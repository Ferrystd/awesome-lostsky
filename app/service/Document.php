<?php
declare(strict_types=1);

namespace app\service;

use app\enum\DocTarget;
use app\model\Document as DocumentModel;
use app\model\TeamMember as TeamMemberModel;
use app\validate\Document as DocumentValidate;
use think\exception\HttpException;

class Document
{
    private const MORPH_MAP = [
        DocTarget::Team->value   => \app\model\Team::class,
        DocTarget::Member->value => \app\model\TeamMember::class,
        DocTarget::User->value   => \app\model\User::class,
    ];

    public function list(string $targetType, int $targetId, array $filters, int $page = 1, int $limit = 20, int $teamId = 0): array
    {
        $this->guardTarget($targetType, $targetId, $teamId);

        $query = DocumentModel::where('documentable_type', $targetType)
            ->where('documentable_id', $targetId);

        if (isset($filters['scope'])) {
            $query->where('scope', (int) $filters['scope']);
        }
        if (!empty($filters['keyword'])) {
            $query->where('title', 'like', "%{$filters['keyword']}%");
        }

        $total = $query->count();
        $list  = $query->order('sort', 'asc')
            ->order('id', 'desc')
            ->page($page, $limit)
            ->select()
            ->toArray();

        return compact('total', 'list', 'page', 'limit');
    }

    public function get(int $id, int $teamId = 0): array
    {
        $doc = DocumentModel::find($id);
        if (!$doc) {
            throw new HttpException(404, '文档不存在');
        }
        $this->guardAccess($doc, $teamId);
        return $doc->toArray();
    }

    public function create(string $targetType, int $targetId, int $scope, array $data, int $teamId = 0): int
    {
        $this->guardTarget($targetType, $targetId, $teamId);

        $validate = new DocumentValidate;
        if (!$validate->check($data)) {
            throw new HttpException(422, $validate->getError());
        }

        $this->ensureTargetExists($targetType, $targetId);

        $doc = app(DocumentModel::class);
        $doc->title             = $data['title'];
        $doc->content           = $data['content'] ?? null;
        $doc->documentable_type = $targetType;
        $doc->documentable_id   = $targetId;
        $doc->scope             = $scope;
        $doc->sort              = $data['sort'] ?? 0;
        $doc->save();

        return (int) $doc->id;
    }

    public function edit(int $id, array $data, int $teamId = 0): void
    {
        $doc = DocumentModel::find($id);
        if (!$doc) {
            throw new HttpException(404, '文档不存在');
        }
        $this->guardAccess($doc, $teamId);

        $allow  = ['title', 'content', 'scope', 'sort'];
        $update = [];
        foreach ($allow as $k) {
            if (array_key_exists($k, $data)) {
                $update[$k] = $data[$k];
            }
        }

        if ($update) {
            $validate = new DocumentValidate;
            if (!$validate->check($update)) {
                throw new HttpException(422, $validate->getError());
            }
            $doc->save($update);
        }
    }

    public function delete(int $id, int $teamId = 0): void
    {
        $doc = DocumentModel::find($id);
        if (!$doc) {
            throw new HttpException(404, '文档不存在');
        }
        $this->guardAccess($doc, $teamId);
        $doc->delete();
    }

    private function guardTarget(string $type, int $id, int $teamId): void
    {
        if ($teamId === 0) return;
        match ($type) {
            'team'   => ($id === $teamId) ?: throw new HttpException(403, '无权访问该团队的文档'),
            'member' => $this->memberInTeam($id, $teamId),
            'user'   => $this->userInTeam($id, $teamId),
            default  => throw new HttpException(400, '无效的目标类型'),
        };
    }

    private function guardAccess(DocumentModel $doc, int $teamId): void
    {
        if ($teamId === 0) return;
        $this->guardTarget($doc->documentable_type, (int) $doc->documentable_id, $teamId);
    }

    private function memberInTeam(int $memberId, int $teamId): void
    {
        $actualTeamId = TeamMemberModel::where('id', $memberId)->value('team_id');
        if (!$actualTeamId || (int) $actualTeamId !== $teamId) {
            throw new HttpException(403, '无权访问该成员的文档');
        }
    }

    private function userInTeam(int $userId, int $teamId): void
    {
        $exists = TeamMemberModel::where('user_id', $userId)
            ->where('team_id', $teamId)
            ->find();
        if (!$exists) {
            throw new HttpException(403, '无权访问该用户的文档');
        }
    }

    private function ensureTargetExists(string $type, int $id): void
    {
        $class = self::MORPH_MAP[$type] ?? null;
        if (!$class || !$class::find($id)) {
            throw new HttpException(422, '目标主体不存在');
        }
    }
}
