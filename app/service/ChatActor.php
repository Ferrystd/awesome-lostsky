<?php
declare(strict_types=1);

namespace app\service;

use app\enum\ChatActorType;
use app\model\EntityIdentity;
use app\model\TeamCustomer;
use app\model\TeamMember;
use app\model\Team;
use app\model\TeamVirtual;
use think\exception\HttpException;

class ChatActor
{
    public function list(int $teamId, int $memberId, int $customerId): array
    {
        $items = [];
        $memberQuery = TeamMember::where('team_id', $teamId)->where('is_blocked', 0);
        if ($memberId < 1) {
            $memberQuery->where('is_displayed', 1);
        }
        $members = $memberQuery->with(['profile', 'identity'])->select();
        foreach ($members as $member) {
            if (!$member->slug) {
                continue;
            }
            $summary = $this->summary(ChatActorType::Member, (int) $member->id);
            $summary['can_act'] = $this->currentIdentityAllows(ChatActorType::Member, (int) $member->id)
                || (!$this->hasCurrentIdentity() && (int) $member->id === $memberId);
            $items[$summary['slug']] = $summary;
        }

        if ($memberId > 0) {
            $customers = TeamCustomer::where('team_id', $teamId)
                ->where('is_blocked', 0)
                ->with(['profile', 'identity'])
                ->select();
        } else {
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
            $summary['can_act'] = $this->currentIdentityAllows(ChatActorType::Customer, (int) $customer->id)
                || (!$this->hasCurrentIdentity() && (int) $customer->id === $customerId);
            $items[$summary['slug']] = $summary;
        }

        $team = Team::active()->where('id', $teamId)->with(['identity'])->find();
        if ($team && $team->slug) {
            $summary = $this->summary(ChatActorType::Team, (int) $team->id);
            $summary['can_act'] = $this->currentIdentityAllows(ChatActorType::Team, (int) $team->id);
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
            $summary['can_act'] = $this->currentIdentityAllows(ChatActorType::Virtual, (int) $virtual->id)
                || (!$this->hasCurrentIdentity() && app(PermissionGate::class)->allows($teamId, $this->permissionSubject($memberId), [
                'chat.virtual.*.operate',
                "chat.virtual.{$virtual->slug}.operate",
            ]));
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
        $identity = EntityIdentity::where('slug', $slug)->find();
        if (!$identity) {
            throw new HttpException(404, '聊天身份不存在');
        }

        [$type, $model] = match ((string) $identity->entityable_type) {
            'teamMember' => [ChatActorType::Member, TeamMember::where('team_id', $teamId)->find($identity->entityable_id)],
            'teamCustomer' => [ChatActorType::Customer, TeamCustomer::where('team_id', $teamId)->find($identity->entityable_id)],
            'teamVirtual' => [ChatActorType::Virtual, TeamVirtual::where('team_id', $teamId)->find($identity->entityable_id)],
            'team' => [ChatActorType::Team, Team::active()->where('id', $teamId)->find($identity->entityable_id)],
            default => [null, null],
        };
        if (!$type || !$model || !(bool) $model->is_valid) {
            throw new HttpException(404, '聊天身份不存在或不可用');
        }

        return [
            'type' => $type,
            'id' => (int) $model->id,
            'slug' => $slug,
            'model' => $model,
        ];
    }

    public function assertCanAct(array $actor, int $teamId, int $memberId, int $customerId): void
    {
        $currentAllowed = $this->currentIdentityAllows($actor['type'], (int) $actor['id']);
        if ($currentAllowed) return;
        if ($this->hasCurrentIdentity()) throw new HttpException(403, 'The current entity identity cannot act as another entity');
        $allowed = match ($actor['type']) {
            ChatActorType::Member => (int) $actor['id'] === $memberId,
            ChatActorType::Customer => (int) $actor['id'] === $customerId,
            ChatActorType::Team => false,
            ChatActorType::Virtual => app(PermissionGate::class)->allows($teamId, $memberId, [
                'chat.virtual.*.operate',
                "chat.virtual.{$actor['slug']}.operate",
            ]),
        };
        if (!$allowed) {
            throw new HttpException(403, '你不能使用该聊天身份');
        }
    }

    public function canAct(array $actor, int $teamId, int $memberId, int $customerId): bool
    {
        try {
            $this->assertCanAct($actor, $teamId, $memberId, $customerId);
            return true;
        } catch (HttpException) {
            return false;
        }
    }

    public function summary(ChatActorType|string $type, int $id): array
    {
        $type = $type instanceof ChatActorType ? $type : ChatActorType::from($type);
        $model = match ($type) {
            ChatActorType::Member => TeamMember::with(['profile', 'identity'])->find($id),
            ChatActorType::Customer => TeamCustomer::with(['profile', 'identity'])->find($id),
            ChatActorType::Team => Team::with(['identity'])->find($id),
            ChatActorType::Virtual => TeamVirtual::with(['identity'])->find($id),
        };
        if (!$model) {
            return ['type' => $type->value, 'slug' => null, 'name' => '已失效身份', 'avatar' => null];
        }

        return [
            'type' => $type->value,
            'slug' => $model->slug ?? null,
            'name' => match ($type) {
                ChatActorType::Member => $model->nickname ?: '团队成员',
                ChatActorType::Customer => $model->nickname ?: '客户',
                ChatActorType::Team => $model->display_name ?: '团队',
                ChatActorType::Virtual => $model->name ?: '虚拟实体',
            },
            'avatar' => $type === ChatActorType::Team ? null : ($model->avatar ?: null),
        ];
    }

    private function currentIdentityAllows(ChatActorType $type, int $id): bool
    {
        $acting = request()->acting_entity ?? null;
        $entityType = match ($type) {
            ChatActorType::Member => 'teamMember', ChatActorType::Customer => 'teamCustomer',
            ChatActorType::Team => 'team', ChatActorType::Virtual => 'teamVirtual',
        };
        return is_array($acting) && ($acting['type'] ?? '') === $entityType && (int) ($acting['id'] ?? 0) === $id;
    }

    private function hasCurrentIdentity(): bool
    {
        return is_array(request()->acting_entity ?? null);
    }

    private function permissionSubject(int $memberId): int|array
    {
        return request()->acting_entity ?: $memberId;
    }
}
