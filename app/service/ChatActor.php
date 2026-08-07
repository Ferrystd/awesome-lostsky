<?php
declare(strict_types=1);

namespace app\service;

use app\enum\ChatActorType;
use app\model\Entity;
use app\model\TeamCustomer;
use app\model\TeamMember;
use app\model\Team;
use app\model\TeamVirtual;
use think\exception\HttpException;

class ChatActor
{
    public function list(int $teamId, array $actingEntity): array
    {
        $items = [];
        $memberQuery = TeamMember::where('team_id', $teamId);
        $members = $memberQuery->with(['profile', 'identity'])->select();
        foreach ($members as $member) {
            if (!$member->is_valid || !$member->slug) {
                continue;
            }
            $summary = $this->summary(ChatActorType::Entity, (int) $member->id);
            $summary['can_act'] = (int) $member->identity->id === (int) ($actingEntity['entity_id'] ?? 0);
            $items[$summary['slug']] = $summary;
        }

        if (($actingEntity['type'] ?? '') === 'teamMember') {
            $customers = TeamCustomer::where('team_id', $teamId)
                ->where('is_blocked', 0)
                ->with(['profile', 'identity'])
                ->select();
        } else {
            $customerId = ($actingEntity['type'] ?? '') === 'teamCustomer'
                ? (int) ($actingEntity['id'] ?? 0)
                : 0;
            $customers = $customerId > 0
                ? TeamCustomer::where('team_id', $teamId)
                    ->where('id', $customerId)
                    ->where('is_blocked', 0)
                    ->with(['profile', 'identity'])
                    ->select()
                : [];
        }
        foreach ($customers as $customer) {
            if (!$customer->slug) {
                continue;
            }
            $summary = $this->summary(ChatActorType::Customer, (int) $customer->id);
            $summary['can_act'] = (int) $customer->identity->id === (int) ($actingEntity['entity_id'] ?? 0);
            $items[$summary['slug']] = $summary;
        }

        $team = Team::active()->where('id', $teamId)->with(['identity'])->find();
        if ($team && $team->slug) {
            $summary = $this->summary(ChatActorType::Team, (int) $team->id);
            $summary['can_act'] = (int) $team->identity->id === (int) ($actingEntity['entity_id'] ?? 0);
            $items[$summary['slug']] = $summary;
        }

        foreach (TeamVirtual::where('team_id', $teamId)
            ->where('is_active', 1)
            ->with(['identity'])
            ->select() as $virtual) {
            if (!$virtual->slug) {
                continue;
            }
            $summary = $this->summary(ChatActorType::Virtual, (int) $virtual->id);
            $summary['can_act'] = (int) $virtual->identity->id === (int) ($actingEntity['entity_id'] ?? 0)
                || app(PermissionGate::class)->allows($teamId, $actingEntity, [
                PermissionDictionary::IDENTITY_VIRTUAL_ALL_ACT,
                PermissionDictionary::virtual((string) $virtual->slug, 'act'),
            ]);
            $items[$summary['slug']] = $summary;
        }

        uasort($items, static fn (array $left, array $right): int => strcmp(
            (string) $left['name'],
            (string) $right['name']
        ));
        return array_values($items);
    }

    public function resolve(int $teamId, string $slug): array
    {
        $slug = strtolower(trim($slug));
        $identity = Entity::where('slug', $slug)->find();
        if (!$identity) {
            throw new HttpException(404, '聊天身份不存在');
        }

        [$type, $model] = match ((string) $identity->entityable_type) {
            'teamMember' => [ChatActorType::Entity, TeamMember::where('team_id', $teamId)->find($identity->entityable_id)],
            'teamCustomer' => [ChatActorType::Customer, TeamCustomer::where('team_id', $teamId)->find($identity->entityable_id)],
            'teamVirtual' => [ChatActorType::Virtual, TeamVirtual::where('team_id', $teamId)->find($identity->entityable_id)],
            'team' => [ChatActorType::Team, Team::active()->where('id', $teamId)->find($identity->entityable_id)],
            default => [null, null],
        };
        if (!$type || !$model || !(bool) $model->is_valid) {
            throw new HttpException(404, '聊天身份不存在或不可用');
        }

        return [
            'entity_id' => (int) $identity->id,
            'type' => $type,
            'id' => (int) $model->id,
            'slug' => $slug,
            'model' => $model,
        ];
    }

    public function assertCanAct(array $actor, int $teamId, array $actingEntity): void
    {
        if ((int) $actor['entity_id'] === (int) ($actingEntity['entity_id'] ?? 0)) {
            return;
        }
        $allowed = $actor['type'] === ChatActorType::Virtual
            && app(PermissionGate::class)->allows($teamId, $actingEntity, [
                PermissionDictionary::IDENTITY_VIRTUAL_ALL_ACT,
                PermissionDictionary::virtual((string) $actor['slug'], 'act'),
            ]);
        if (!$allowed) {
            throw new HttpException(403, '你不能使用该聊天身份');
        }
    }

    public function canAct(array $actor, int $teamId, array $actingEntity): bool
    {
        try {
            $this->assertCanAct($actor, $teamId, $actingEntity);
            return true;
        } catch (HttpException) {
            return false;
        }
    }

    public function summary(ChatActorType|string $type, int $id): array
    {
        $type = $type instanceof ChatActorType ? $type : ChatActorType::from($type);
        $model = match ($type) {
            ChatActorType::Entity => TeamMember::with(['profile', 'identity'])->find($id),
            ChatActorType::Customer => TeamCustomer::with(['profile', 'identity'])->find($id),
            ChatActorType::Team => Team::with(['identity', 'profile'])->find($id),
            ChatActorType::Virtual => TeamVirtual::with(['identity', 'profile'])->find($id),
        };
        if (!$model) {
            return ['type' => $type->value, 'slug' => null, 'name' => '已失效身份', 'avatar' => null];
        }

        return [
            'type' => $type->value,
            'slug' => $model->slug ?? null,
            'name' => match ($type) {
                ChatActorType::Entity => $model->nickname ?: '人员',
                ChatActorType::Customer => $model->nickname ?: '客户',
                ChatActorType::Team => $model->display_name ?: '团队',
                ChatActorType::Virtual => $model->name ?: '虚拟实体',
            },
            'avatar' => $type === ChatActorType::Team ? null : ($model->avatar ?: null),
            'status_code' => $type === ChatActorType::Entity ? $model->status_code : null,
            'status_label' => $type === ChatActorType::Entity ? $model->status_label : null,
            'is_valid' => (bool) $model->is_valid,
        ];
    }

    public function summaryEntity(int $entityId): array
    {
        $identity = Entity::find($entityId);
        if (!$identity) {
            return [
                'type' => 'entity',
                'slug' => null,
                'name' => '已失效实体',
                'avatar' => null,
                'status_code' => null,
                'status_label' => null,
                'is_valid' => false,
            ];
        }
        $type = match ((string) $identity->entityable_type) {
            'teamMember' => ChatActorType::Entity,
            'teamCustomer' => ChatActorType::Customer,
            'teamVirtual' => ChatActorType::Virtual,
            'team' => ChatActorType::Team,
        };

        return $this->summary($type, (int) $identity->entityable_id);
    }

    public function actorEntity(int $entityId): array
    {
        $subject = app(\app\service\Entity::class)->subject($entityId);
        return [
            'entity_id' => $entityId,
            'type' => match ($subject['type']) {
                'teamMember' => ChatActorType::Entity,
                'teamCustomer' => ChatActorType::Customer,
                'teamVirtual' => ChatActorType::Virtual,
                'team' => ChatActorType::Team,
            },
            'id' => $subject['id'],
            'slug' => (string) $subject['entity']->slug,
            'model' => $subject['entity']->entityable,
        ];
    }

}
