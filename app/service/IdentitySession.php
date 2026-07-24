<?php
declare(strict_types=1);

namespace app\service;

use app\model\EntityIdentity;
use app\model\EntitySession;
use app\model\Team;
use app\model\TeamCustomer;
use app\model\TeamMember;
use app\model\TeamVirtual;
use think\exception\HttpException;

class IdentitySession
{
    public function candidates(int $userId): array
    {
        $items = [];
        foreach (TeamMember::where('user_id', $userId)->where('is_blocked', 0)->with(['identity', 'profile'])->select() as $member) {
            $items[] = $this->item('teamMember', (int) $member->id, $member->slug, $member->nickname ?: 'Member');
        }
        foreach (TeamCustomer::where('user_id', $userId)->where('is_blocked', 0)->with(['identity', 'profile'])->select() as $customer) {
            $items[] = $this->item('teamCustomer', (int) $customer->id, $customer->slug, $customer->nickname ?: 'Customer');
        }
        foreach (TeamMember::where('user_id', $userId)->where('is_blocked', 0)->select() as $member) {
            $team = Team::active()->find($member->team_id);
            if ($team && $this->canAssume('team', (int) $team->id, $userId)) {
                $items[] = $this->item('team', (int) $team->id, $team->identity?->slug, (string) $team->display_name);
            }
            foreach (TeamVirtual::where('team_id', $member->team_id)->where('is_active', 1)->with(['identity'])->select() as $virtual) {
                if ($this->canAssume('teamVirtual', (int) $virtual->id, $userId)) {
                    $items[] = $this->item('teamVirtual', (int) $virtual->id, $virtual->slug, (string) $virtual->name);
                }
            }
        }
        return array_values(array_filter($items, static fn (array $item): bool => $item['slug'] !== null));
    }

    public function receive(int $userId, string $deviceToken, string $slug): array
    {
        $identity = EntityIdentity::where('slug', strtolower(trim($slug)))->find();
        if (!$identity || !$identity->is_valid) throw new HttpException(404, 'Entity identity is unavailable');
        $type = (string) $identity->entityable_type;
        $id = (int) $identity->entityable_id;
        if (!$this->canAssume($type, $id, $userId)) throw new HttpException(403, 'You cannot receive this identity');
        $jti = bin2hex(random_bytes(24));
        $expiresAt = time() + (int) config('jwt.ttl');
        EntitySession::transaction(function () use ($userId, $deviceToken, $jti, $type, $id, $expiresAt): void {
            EntitySession::where('user_id', $userId)->where('device_token', $deviceToken)->whereNull('revoked_at')->update(['revoked_at' => time()]);
            $session = app(EntitySession::class, [], true);
            $session->save(['user_id' => $userId, 'device_token' => $deviceToken, 'jti' => $jti, 'entity_type' => $type, 'entity_id' => $id, 'expires_at' => $expiresAt]);
        });
        return ['token' => app(Jwt::class)->createToken($userId, $deviceToken, ['aud' => 'lostsky', 'jti' => $jti, 'act' => ['type' => $type, 'id' => $id]]), 'identity' => $this->item($type, $id, $identity->slug, $this->name($type, $id))];
    }

    public function drop(int $userId, string $deviceToken, string $jti = ''): array
    {
        if ($jti !== '') EntitySession::where('user_id', $userId)->where('device_token', $deviceToken)->where('jti', $jti)->whereNull('revoked_at')->update(['revoked_at' => time()]);
        return ['token' => app(Jwt::class)->createToken($userId, $deviceToken)];
    }

    public function session(int $userId, string $deviceToken, string $jti, string $type, int $id): EntitySession
    {
        $session = EntitySession::where('user_id', $userId)->where('device_token', $deviceToken)->where('jti', $jti)->where('entity_type', $type)->where('entity_id', $id)->whereNull('revoked_at')->where('expires_at', '>', time())->find();
        if (!$session || !$this->canAssume($type, $id, $userId)) throw new HttpException(401, 'Entity identity session is no longer valid');
        return $session;
    }

    public function canAssume(string $type, int $id, int $userId): bool
    {
        return match ($type) {
            'teamMember' => (bool) TeamMember::where('id', $id)->where('user_id', $userId)->where('is_blocked', 0)->find(),
            'teamCustomer' => (bool) TeamCustomer::where('id', $id)->where('user_id', $userId)->where('is_blocked', 0)->find(),
            'team' => $this->memberAllows($id, $userId, ['identity.team.assume']),
            'teamVirtual' => $this->virtualAllows($id, $userId),
            default => false,
        };
    }

    private function virtualAllows(int $virtualId, int $userId): bool
    {
        $virtual = TeamVirtual::with(['identity'])->where('is_active', 1)->find($virtualId);
        if (!$virtual || !$virtual->slug) return false;
        return $this->memberAllows((int) $virtual->team_id, $userId, ['identity.virtual.*.assume', "identity.virtual.{$virtual->slug}.assume"]);
    }

    private function memberAllows(int $teamId, int $userId, array $keys): bool
    {
        $member = TeamMember::where('team_id', $teamId)->where('user_id', $userId)->where('is_blocked', 0)->find();
        return $member && app(PermissionGate::class)->allows($teamId, ['type' => 'teamMember', 'id' => (int) $member->id], $keys);
    }

    private function name(string $type, int $id): string
    {
        return match ($type) {
            'team' => (string) (Team::find($id)?->display_name ?: 'Team'),
            'teamVirtual' => (string) (TeamVirtual::find($id)?->name ?: 'Virtual entity'),
            'teamMember' => (string) (TeamMember::with(['profile'])->find($id)?->nickname ?: 'Member'),
            'teamCustomer' => (string) (TeamCustomer::with(['profile'])->find($id)?->nickname ?: 'Customer'),
            default => 'Entity',
        };
    }

    private function item(string $type, int $id, ?string $slug, string $name): array { return compact('type', 'id', 'slug', 'name'); }
}
