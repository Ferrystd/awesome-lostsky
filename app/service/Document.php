<?php
declare(strict_types=1);

namespace app\service;

use app\enum\DocTarget;
use app\enum\ManageScope;
use app\enum\Visibility as VisibilityEnum;
use app\model\Document as DocumentModel;
use app\model\TeamMember as TeamMemberModel;
use app\validate\Document as DocumentValidate;
use think\exception\HttpException;

class Document
{
    private const MORPH_MAP = [
        DocTarget::Team->value       => \app\model\Team::class,
        DocTarget::Member->value     => \app\model\TeamMember::class,
    ];

    public function list(string $targetType, int $targetId, array $filters, int $page = 1, int $limit = 20, int $teamId = 0, int $userId = 0, int $memberId = 0): array
    {
        $subjectMemberId = $this->guardTarget($targetType, $targetId, $teamId);
        $visibility      = app(\app\service\Visibility::class);
        $isTeamManager   = $visibility->isTeamManager($teamId, $userId);
        $isSubject       = $subjectMemberId > 0 && $subjectMemberId === $memberId;

        $query = DocumentModel::where('documentable_type', $targetType)
            ->where('documentable_id', $targetId);

        if (isset($filters['manager_scope'])) {
            $query->where('manager_scope', (int) $filters['manager_scope']);
        }
        if (isset($filters['visibility'])) {
            $query->where('visibility', (int) $filters['visibility']);
        }
        if (!empty($filters['keyword'])) {
            $query->where('title', 'like', "%{$filters['keyword']}%");
        }

        $total = $query->count();
        $list  = $query->order('sort', 'asc')
            ->order('id', 'desc')
            ->page($page, $limit)
            ->select()
            ->filter(fn ($doc) => $visibility->canView($doc, $teamId, $memberId, $isTeamManager, $isSubject))
            ->toArray();

        $total = count($list);

        return compact('total', 'list', 'page', 'limit');
    }

    public function get(int $id, int $teamId = 0, int $userId = 0, int $memberId = 0): array
    {
        $doc = DocumentModel::find($id);
        if (!$doc) {
            throw new HttpException(404, '文档不存在');
        }
        $this->guardView($doc, $teamId, $userId, $memberId);
        return $doc->toArray();
    }

    public function create(string $targetType, int $targetId, array $data, int $teamId = 0, int $userId = 0, int $memberId = 0): int
    {
        $subjectMemberId = $this->guardTarget($targetType, $targetId, $teamId);

        $validate = new DocumentValidate;
        if (!$validate->check($data)) {
            throw new HttpException(422, $validate->getError());
        }
        if (trim((string) ($data['title'] ?? '')) === '') {
            throw new HttpException(422, '文档标题不能为空');
        }

        $this->ensureTargetExists($targetType, $targetId);

        $managerScope = $this->managerScope($data['manager_scope'] ?? ($targetType === DocTarget::Team->value ? ManageScope::Team->value : ManageScope::SubjectTeam->value));
        $visibility   = $this->visibility($data['visibility'] ?? ($targetType === DocTarget::Team->value ? VisibilityEnum::Team->value : VisibilityEnum::SubjectTeam->value));

        $this->assertPolicy($targetType, $managerScope, $visibility);

        $guard = app(\app\service\Visibility::class);
        $guard->assertManage($managerScope, $guard->isTeamManager($teamId, $userId), $subjectMemberId > 0 && $subjectMemberId === $memberId);

        $doc = \think\facade\Db::transaction(function () use ($targetType, $targetId, $data, $teamId, $managerScope, $visibility, $guard) {
            $doc = app(DocumentModel::class);
            $doc->save([
                'title'             => $data['title'],
                'content'           => $data['content'] ?? null,
                'documentable_type' => $targetType,
                'documentable_id'   => $targetId,
                'manager_scope'     => $managerScope->value,
                'visibility'        => $visibility->value,
                'sort'              => $data['sort'] ?? 0,
            ]);

            if ($visibility === VisibilityEnum::Custom) {
                $guard->syncTargets($doc, $data['visibility_targets'] ?? [], $teamId);
            }

            return $doc;
        });

        return (int) $doc->id;
    }

    public function edit(int $id, array $data, int $teamId = 0, int $userId = 0, int $memberId = 0): void
    {
        $doc = DocumentModel::find($id);
        if (!$doc) {
            throw new HttpException(404, '文档不存在');
        }
        $subjectMemberId = $this->guardAccess($doc, $teamId);

        $guard = app(\app\service\Visibility::class);
        $guard->assertManage($this->managerScope($doc->manager_scope), $guard->isTeamManager($teamId, $userId), $subjectMemberId > 0 && $subjectMemberId === $memberId);

        $allow  = ['title', 'content', 'manager_scope', 'visibility', 'sort'];
        $update = [];
        foreach ($allow as $k) {
            if (array_key_exists($k, $data)) {
                $update[$k] = $data[$k];
            }
        }

        if (array_key_exists('manager_scope', $update)) {
            $update['manager_scope'] = $this->managerScope($update['manager_scope'])->value;
        }
        if (array_key_exists('visibility', $update)) {
            $update['visibility'] = $this->visibility($update['visibility'])->value;
        }

        $managerScope = $this->managerScope($update['manager_scope'] ?? $doc->manager_scope);
        $visibility   = $this->visibility($update['visibility'] ?? $doc->visibility);
        $this->assertPolicy($doc->documentable_type, $managerScope, $visibility);

        if ($update) {
            $validate = new DocumentValidate;
            if (!$validate->check($update)) {
                throw new HttpException(422, $validate->getError());
            }
        }

        \think\facade\Db::transaction(function () use ($doc, $update, $data, $teamId, $visibility, $guard) {
            if ($update) {
                $doc->save($update);
            }

            if (array_key_exists('visibility', $data) || array_key_exists('visibility_targets', $data)) {
                $guard->syncTargets($doc, $visibility === VisibilityEnum::Custom ? ($data['visibility_targets'] ?? []) : [], $teamId);
            }
        });
    }

    public function delete(int $id, int $teamId = 0, int $userId = 0, int $memberId = 0): void
    {
        $doc = DocumentModel::find($id);
        if (!$doc) {
            throw new HttpException(404, '文档不存在');
        }
        $subjectMemberId = $this->guardAccess($doc, $teamId);

        $guard = app(\app\service\Visibility::class);
        $guard->assertManage($this->managerScope($doc->manager_scope), $guard->isTeamManager($teamId, $userId), $subjectMemberId > 0 && $subjectMemberId === $memberId);

        \think\facade\Db::transaction(function () use ($doc) {
            \app\model\VisibilityTarget::where('visibleable_type', 'document')
                ->where('visibleable_id', (int) $doc->id)
                ->delete();
            $doc->delete();
        });
    }

    private function guardTarget(string $type, int $id, int $teamId): int
    {
        if ($teamId === 0) return 0;

        return match ($type) {
            'team'       => ($id === $teamId) ? 0 : throw new HttpException(403, '无权访问该团队的文档'),
            'teamMember' => $this->memberInTeam($id, $teamId),
            default      => throw new HttpException(400, '无效的目标类型'),
        };
    }

    private function guardAccess(DocumentModel $doc, int $teamId): int
    {
        if ($teamId === 0) return 0;
        return $this->guardTarget($doc->documentable_type, (int) $doc->documentable_id, $teamId);
    }

    private function guardView(DocumentModel $doc, int $teamId, int $userId, int $memberId): void
    {
        $subjectMemberId = $this->guardAccess($doc, $teamId);
        $visibility      = app(\app\service\Visibility::class);
        $visibility->assertView($doc, $teamId, $memberId, $visibility->isTeamManager($teamId, $userId), $subjectMemberId > 0 && $subjectMemberId === $memberId);
    }

    private function memberInTeam(int $memberId, int $teamId): int
    {
        $actualTeamId = TeamMemberModel::where('id', $memberId)->value('team_id');
        if (!$actualTeamId || (int) $actualTeamId !== $teamId) {
            throw new HttpException(403, '无权访问该成员的文档');
        }
        return $memberId;
    }

    private function ensureTargetExists(string $type, int $id): void
    {
        $class = self::MORPH_MAP[$type] ?? null;
        if (!$class || !$class::find($id)) {
            throw new HttpException(422, '目标主体不存在');
        }
    }

    private function assertPolicy(string $targetType, ManageScope $managerScope, VisibilityEnum $visibility): void
    {
        $allowed = match ($targetType) {
            DocTarget::Team->value => $managerScope === ManageScope::Team
                && in_array($visibility, [VisibilityEnum::Team, VisibilityEnum::Member, VisibilityEnum::Public, VisibilityEnum::Custom], true),
            DocTarget::Member->value => match ($managerScope) {
                ManageScope::Team => in_array($visibility, [VisibilityEnum::TeamExceptSubject, VisibilityEnum::SubjectTeam, VisibilityEnum::Public, VisibilityEnum::Custom], true),
                ManageScope::SubjectTeam => in_array($visibility, [VisibilityEnum::Member, VisibilityEnum::SubjectTeam, VisibilityEnum::Public, VisibilityEnum::Custom], true),
            },
            default => false,
        };

        if (!$allowed) {
            throw new HttpException(422, '管理范围与可见范围组合不合法');
        }
    }

    private function managerScope($value): ManageScope
    {
        try {
            return $value instanceof ManageScope ? $value : ManageScope::from((int) $value);
        } catch (\ValueError) {
            throw new HttpException(422, '管理范围格式不正确');
        }
    }

    private function visibility($value): VisibilityEnum
    {
        try {
            return $value instanceof VisibilityEnum ? $value : VisibilityEnum::from((int) $value);
        } catch (\ValueError) {
            throw new HttpException(422, '可见范围格式不正确');
        }
    }
}
