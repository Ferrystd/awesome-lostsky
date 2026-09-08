<?php
declare(strict_types=1);

namespace app\service;

use app\model\Entity;
use app\model\Team;
use think\exception\HttpException;
use think\facade\Cookie;
use think\Request;

final class WorkspaceWarning
{
    public function context(string $teamSlug, array $subject, int $entityId, Request $request): array
    {
        $team = Team::active()->where('slug', $teamSlug)->find();
        if (!$team) {
            throw new HttpException(404, '团队不存在或不可用');
        }
        $access = app(WorkspaceAccess::class)->assert((int) $team->id, $subject, $teamSlug);
        $entity = Entity::with(['profile'])->find($entityId);

        return [
            'team_id' => (int) $team->id,
            'team' => app(IdentitySession::class)->teamSummary((int) $team->id),
            'identity' => [
                'type' => (string) ($subject['type'] ?? ''),
                'id' => (int) ($subject['id'] ?? 0),
                'entity_id' => $entityId,
                'slug' => $entity?->slug ?: null,
                'name' => (string) ($entity?->profile?->name ?: app(IdentitySession::class)->entityName(
                    (string) ($subject['type'] ?? ''),
                    (int) ($subject['id'] ?? 0)
                )),
            ],
            'can_continue' => (bool) $access['has_workspace_role'],
            'is_external' => (bool) $access['is_external'],
            'entry_warning' => $this->state(
                (int) $team->id,
                $entityId,
                (bool) $access['is_external'],
                $request
            ),
        ];
    }

    public function state(int $teamId, int $entityId, bool $external, ?Request $request = null): array
    {
        $ttl = max(60, (int) config('workspace.external_warning_ttl', 86400));

        return [
            'required' => $external && !$this->acknowledged($request, $teamId, $entityId),
            'kind' => $external ? 'external_entity' : null,
            'ttl_seconds' => $ttl,
        ];
    }

    public function acknowledge(Request $request, int $teamId, int $entityId): array
    {
        $ttl = max(60, (int) config('workspace.external_warning_ttl', 86400));
        $host = strtolower(explode(':', $request->host())[0]);
        $sharedDomain = $host === 'lostsky.work' || str_ends_with($host, '.lostsky.work');
        Cookie::set($this->cookieName($teamId, $entityId), '1', [
            'expire' => $ttl,
            'path' => '/',
            'domain' => $sharedDomain ? '.lostsky.work' : '',
            'secure' => $request->isSsl(),
            'httponly' => true,
            'samesite' => 'lax',
        ]);

        return ['acknowledged' => true, 'ttl_seconds' => $ttl];
    }

    private function acknowledged(?Request $request, int $teamId, int $entityId): bool
    {
        return $request !== null
            && (string) $request->cookie($this->cookieName($teamId, $entityId), '') === '1';
    }

    private function cookieName(int $teamId, int $entityId): string
    {
        return 'lostsky_external_warning_' . substr(hash('sha256', "{$entityId}:{$teamId}"), 0, 20);
    }
}
