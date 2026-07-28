<?php
declare(strict_types=1);

namespace app\service;

use app\enum\ManageScope;
use app\enum\Visibility as VisibilityEnum;
use app\model\VisibilityTarget;
use think\exception\HttpException;
use think\Model;

class Visibility
{
    private const VISIBLEABLE_MAP = [
        \app\model\Document::class => 'document',
        \app\model\TeamSetting::class => 'teamSetting',
        \app\model\TeamEntityField::class => 'entityField',
    ];

    public function isTeamManager(int $teamId, array $actingEntity): bool
    {
        return ($actingEntity['type'] ?? '') === 'team'
            && (int) ($actingEntity['id'] ?? 0) === $teamId;
    }

    public function assertManage(ManageScope $scope, bool $isTeamManager, bool $isSubject): void
    {
        $allowed = match ($scope) {
            ManageScope::Team => $isTeamManager,
            ManageScope::SubjectTeam => $isTeamManager || $isSubject,
        };
        if (!$allowed) {
            throw new HttpException(403, '无权管理该资源');
        }
    }

    public function assertView(Model $model, int $actingEntityId, bool $isTeamManager, bool $isSubject): void
    {
        if (!$this->canView($model, $actingEntityId, $isTeamManager, $isSubject)) {
            throw new HttpException(403, '无权查看该资源');
        }
    }

    public function canView(Model $model, int $actingEntityId, bool $isTeamManager, bool $isSubject): bool
    {
        return match ($model->enumCase('visibility')) {
            VisibilityEnum::Public => true,
            VisibilityEnum::Entity => $actingEntityId > 0,
            VisibilityEnum::Team => $isTeamManager,
            VisibilityEnum::SubjectTeam => $isTeamManager || $isSubject,
            VisibilityEnum::Custom => $this->hasTarget($model, $actingEntityId),
        };
    }

    public function syncTargets(Model $model, array $targets, int $teamId): void
    {
        $alias = $this->visibleableAlias($model::class);
        $activeKeys = [];
        foreach ($this->normalizeTargets($targets, $teamId) as $target) {
            $entityId = (int) $target['entity_id'];
            $activeKeys[$entityId] = true;
            VisibilityTarget::withTrashed()->updateOrCreate([
                'visibleable_type' => $alias,
                'visibleable_id' => (int) $model->id,
                'entity_id' => $entityId,
            ], ['delete_time' => null]);
        }

        $rows = VisibilityTarget::where('visibleable_type', $alias)
            ->where('visibleable_id', (int) $model->id)->select();
        foreach ($rows as $row) {
            if (!isset($activeKeys[(int) $row->entity_id])) {
                $row->delete();
            }
        }
    }

    public function normalizeTargets(array $targets, int $teamId): array
    {
        $normalized = [];
        foreach ($targets as $target) {
            $entityId = (int) ($target['entity_id'] ?? 0);
            if ($entityId <= 0) {
                throw new HttpException(422, '可见对象必须提供 entity_id');
            }
            app(Entity::class)->assertInTeam($entityId, $teamId);
            $normalized[$entityId] = ['entity_id' => $entityId];
        }
        return array_values($normalized);
    }

    private function hasTarget(Model $model, int $actingEntityId): bool
    {
        return $actingEntityId > 0
            && (bool) VisibilityTarget::where('visibleable_type', $this->visibleableAlias($model::class))
                ->where('visibleable_id', (int) $model->id)
                ->where('entity_id', $actingEntityId)
                ->find();
    }

    private function visibleableAlias(string $class): string
    {
        $alias = self::VISIBLEABLE_MAP[$class] ?? null;
        if (!$alias) {
            throw new HttpException(500, '不支持的可见性主体');
        }
        return $alias;
    }
}
