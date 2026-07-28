<?php
declare(strict_types=1);

namespace app\service;

use app\enum\ManageScope;
use app\enum\Visibility as VisibilityEnum;
use app\model\Document as DocumentModel;
use app\validate\Document as DocumentValidate;
use think\exception\HttpException;

class Document
{
    public function list(int $entityId, array $filters, int $page, int $limit, int $teamId, array $actingEntity): array
    {
        [$page, $limit] = app(Pagination::class)->normalize($page, $limit);
        app(Entity::class)->assertInTeam($entityId, $teamId);
        $guard = app(Visibility::class);
        $isTeamManager = $guard->isTeamManager($teamId, $actingEntity);
        $isSubject = $entityId === (int) $actingEntity['entity_id'];

        $query = DocumentModel::with(['subject'])->where('entity_id', $entityId);
        if (isset($filters['manager_scope'])) {
            $query->where('manager_scope', (int) $filters['manager_scope']);
        }
        if (isset($filters['visibility'])) {
            $query->where('visibility', (int) $filters['visibility']);
        }
        if (!empty($filters['keyword'])) {
            $query->where('title', 'like', "%{$filters['keyword']}%");
        }

        $query->visibleTo((int) $actingEntity['entity_id'], $isTeamManager, $isSubject);
        $total = $query->count();
        $list = $query->order('sort', 'asc')->order('id', 'desc')
            ->page($page, $limit)->select()->toArray();

        return compact('total', 'list', 'page', 'limit');
    }

    public function get(int $id, int $teamId, array $actingEntity): array
    {
        $doc = DocumentModel::with(['subject', 'visibilityTargets.subject'])->find($id);
        if (!$doc) {
            throw new HttpException(404, '文档不存在');
        }
        $this->guardView($doc, $teamId, $actingEntity);
        return $doc->toArray();
    }

    public function create(int $entityId, array $data, int $teamId, array $actingEntity): int
    {
        $entity = app(Entity::class)->assertInTeam($entityId, $teamId);
        $validate = new DocumentValidate;
        if (!$validate->check($data)) {
            throw new HttpException(422, $validate->getError());
        }
        if (trim((string) ($data['title'] ?? '')) === '') {
            throw new HttpException(422, '文档标题不能为空');
        }

        $isTeamSubject = $entity->entityable_type === 'team';
        $managerScope = $this->managerScope($data['manager_scope']
            ?? ($isTeamSubject ? ManageScope::Team->value : ManageScope::SubjectTeam->value));
        $visibility = $this->visibility($data['visibility']
            ?? ($isTeamSubject ? VisibilityEnum::Team->value : VisibilityEnum::SubjectTeam->value));
        $this->assertPolicy($isTeamSubject, $managerScope, $visibility);

        $guard = app(Visibility::class);
        $guard->assertManage(
            $managerScope,
            $guard->isTeamManager($teamId, $actingEntity),
            $entityId === (int) $actingEntity['entity_id']
        );

        $doc = \think\facade\Db::transaction(function () use ($entityId, $data, $teamId, $managerScope, $visibility, $guard) {
            $doc = app(DocumentModel::class);
            $doc->save([
                'title' => $data['title'],
                'content' => $data['content'] ?? null,
                'entity_id' => $entityId,
                'manager_scope' => $managerScope,
                'visibility' => $visibility,
                'sort' => $data['sort'] ?? 0,
            ]);
            app(Markdown::class)->sync($doc, 'content', $data['content'] ?? null);
            if ($visibility === VisibilityEnum::Custom) {
                $guard->syncTargets($doc, $data['visibility_targets'] ?? [], $teamId);
            }
            return $doc;
        });

        return (int) $doc->id;
    }

    public function edit(int $id, array $data, int $teamId, array $actingEntity): void
    {
        $doc = DocumentModel::with(['subject'])->find($id);
        if (!$doc) {
            throw new HttpException(404, '文档不存在');
        }
        $this->guardAccess($doc, $teamId);

        $guard = app(Visibility::class);
        $guard->assertManage(
            $doc->enumCase('manager_scope'),
            $guard->isTeamManager($teamId, $actingEntity),
            (int) $doc->entity_id === (int) $actingEntity['entity_id']
        );

        $update = [];
        foreach (['title', 'content', 'manager_scope', 'visibility', 'sort'] as $field) {
            if (array_key_exists($field, $data)) {
                $update[$field] = $data[$field];
            }
        }
        if ($update) {
            $validate = new DocumentValidate;
            if (!$validate->check($update)) {
                throw new HttpException(422, $validate->getError());
            }
        }
        if (array_key_exists('manager_scope', $update)) {
            $update['manager_scope'] = $this->managerScope($update['manager_scope']);
        }
        if (array_key_exists('visibility', $update)) {
            $update['visibility'] = $this->visibility($update['visibility']);
        }

        $managerScope = $update['manager_scope'] ?? $doc->enumCase('manager_scope');
        $visibility = $update['visibility'] ?? $doc->enumCase('visibility');
        $this->assertPolicy($doc->subject->entityable_type === 'team', $managerScope, $visibility);

        \think\facade\Db::transaction(function () use ($doc, $update, $data, $teamId, $visibility, $guard) {
            if ($update) {
                $doc->save($update);
            }
            if (array_key_exists('content', $update)) {
                app(Markdown::class)->sync($doc, 'content', $update['content']);
            }
            if (array_key_exists('visibility', $data) || array_key_exists('visibility_targets', $data)) {
                $guard->syncTargets(
                    $doc,
                    $visibility === VisibilityEnum::Custom ? ($data['visibility_targets'] ?? []) : [],
                    $teamId
                );
            }
        });
    }

    public function delete(int $id, int $teamId, array $actingEntity): void
    {
        $doc = DocumentModel::with(['subject'])->find($id);
        if (!$doc) {
            throw new HttpException(404, '文档不存在');
        }
        $this->guardAccess($doc, $teamId);
        $guard = app(Visibility::class);
        $guard->assertManage(
            $doc->enumCase('manager_scope'),
            $guard->isTeamManager($teamId, $actingEntity),
            (int) $doc->entity_id === (int) $actingEntity['entity_id']
        );

        \think\facade\Db::transaction(function () use ($doc) {
            app(Markdown::class)->deleteSource($doc, 'content');
            \app\model\VisibilityTarget::where('visibleable_type', 'document')
                ->where('visibleable_id', (int) $doc->id)->delete();
            $doc->delete();
        });
    }

    private function guardAccess(DocumentModel $doc, int $teamId): void
    {
        app(Entity::class)->assertInTeam((int) $doc->entity_id, $teamId);
    }

    private function guardView(DocumentModel $doc, int $teamId, array $actingEntity): void
    {
        $this->guardAccess($doc, $teamId);
        $visibility = app(Visibility::class);
        $visibility->assertView(
            $doc,
            (int) $actingEntity['entity_id'],
            $visibility->isTeamManager($teamId, $actingEntity),
            (int) $doc->entity_id === (int) $actingEntity['entity_id']
        );
    }

    private function assertPolicy(bool $isTeamSubject, ManageScope $managerScope, VisibilityEnum $visibility): void
    {
        $allowed = $isTeamSubject
            ? $managerScope === ManageScope::Team
                && in_array($visibility, [VisibilityEnum::Team, VisibilityEnum::Entity, VisibilityEnum::Public, VisibilityEnum::Custom], true)
            : match ($managerScope) {
                ManageScope::Team => in_array($visibility, [VisibilityEnum::Team, VisibilityEnum::SubjectTeam, VisibilityEnum::Public, VisibilityEnum::Custom], true),
                ManageScope::SubjectTeam => in_array($visibility, [VisibilityEnum::Entity, VisibilityEnum::SubjectTeam, VisibilityEnum::Public, VisibilityEnum::Custom], true),
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
