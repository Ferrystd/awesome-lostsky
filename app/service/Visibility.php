<?php
declare(strict_types=1);

namespace app\service;

use app\enum\ManageScope;
use app\enum\Visibility as VisibilityEnum;
use app\model\Team;
use app\model\TeamMember;
use app\model\VisibilityTarget;
use think\exception\HttpException;
use think\Model;

class Visibility
{
    private const VISIBLEABLE_MAP = [
        \app\model\Document::class        => 'document',
        \app\model\TeamSetting::class     => 'teamSetting',
        \app\model\TeamMemberField::class => 'teamMemberField',
    ];

    public function isTeamManager(int $teamId, int $userId): bool
    {
        return (int) Team::where('id', $teamId)->value('user_id') === $userId;
    }

    public function assertManage(ManageScope $scope, bool $isTeamManager, bool $isSubject): void
    {
        $allowed = match ($scope) {
            ManageScope::Team        => $isTeamManager,
            ManageScope::SubjectTeam => $isTeamManager || $isSubject,
        };

        if (!$allowed) {
            throw new HttpException(403, '无权管理该资源');
        }
    }

    public function assertView(Model $model, int $teamId, int $memberId, bool $isTeamManager, bool $isSubject): void
    {
        if (!$this->canView($model, $teamId, $memberId, $isTeamManager, $isSubject)) {
            throw new HttpException(403, '无权查看该资源');
        }
    }

    public function canView(Model $model, int $teamId, int $memberId, bool $isTeamManager, bool $isSubject): bool
    {
        $visibility = $model->visibility instanceof VisibilityEnum
            ? $model->visibility
            : VisibilityEnum::from((int) $model->visibility);

        return match ($visibility) {
            VisibilityEnum::Public            => true,
            VisibilityEnum::Member            => $memberId > 0,
            VisibilityEnum::Team              => $isTeamManager,
            VisibilityEnum::TeamExceptSubject => $isTeamManager && !$isSubject,
            VisibilityEnum::SubjectTeam       => $isTeamManager || $isSubject,
            VisibilityEnum::Custom            => $this->hasTarget($model, $teamId, $memberId, $isTeamManager),
        };
    }

    public function syncTargets(Model $model, array $targets, int $teamId): void
    {
        $alias      = $this->visibleableAlias($model::class);
        $normalized = $this->normalizeTargets($targets, $teamId);
        $activeKeys = [];

        foreach ($normalized as $target) {
            $activeKeys["{$target['target_type']}:{$target['target_id']}"] = true;

            VisibilityTarget::withTrashed()->updateOrCreate([
                'visibleable_type' => $alias,
                'visibleable_id'   => (int) $model->id,
                'target_type'      => $target['target_type'],
                'target_id'        => $target['target_id'],
            ], [
                'delete_time' => null,
            ]);
        }

        $rows = VisibilityTarget::where('visibleable_type', $alias)
            ->where('visibleable_id', (int) $model->id)
            ->select();

        foreach ($rows as $row) {
            $key = "{$row->target_type}:{$row->target_id}";
            if (!isset($activeKeys[$key])) {
                $row->delete();
            }
        }
    }

    public function normalizeTargets(array $targets, int $teamId): array
    {
        $normalized = [];

        foreach ($targets as $target) {
            $type = (string) ($target['target_type'] ?? '');
            $id   = (int) ($target['target_id'] ?? 0);

            if ($type === 'team') {
                if ($id !== $teamId) {
                    throw new HttpException(422, '指定团队不属于当前上下文');
                }
            } elseif ($type === 'teamMember') {
                $exists = TeamMember::where('team_id', $teamId)->where('id', $id)->find();
                if (!$exists) {
                    throw new HttpException(422, '指定成员不属于当前团队');
                }
            } else {
                throw new HttpException(422, '指定可见对象类型不正确');
            }

            $normalized["{$type}:{$id}"] = [
                'target_type' => $type,
                'target_id'   => $id,
            ];
        }

        return array_values($normalized);
    }

    private function hasTarget(Model $model, int $teamId, int $memberId, bool $isTeamManager): bool
    {
        $alias = $this->visibleableAlias($model::class);

        $query = VisibilityTarget::where('visibleable_type', $alias)
            ->where('visibleable_id', (int) $model->id);

        $query->where(function ($query) use ($teamId, $memberId, $isTeamManager) {
            $hasCondition = false;

            if ($isTeamManager) {
                $query->where(function ($query) use ($teamId) {
                    $query->where('target_type', 'team')->where('target_id', $teamId);
                });
                $hasCondition = true;
            }

            if ($memberId > 0) {
                $method = $hasCondition ? 'whereOr' : 'where';
                $query->{$method}(function ($query) use ($memberId) {
                    $query->where('target_type', 'teamMember')->where('target_id', $memberId);
                });
                $hasCondition = true;
            }

            if (!$hasCondition) {
                $query->whereRaw('1=0');
            }
        });

        return (bool) $query->find();
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
