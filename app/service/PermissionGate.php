<?php
declare(strict_types=1);

namespace app\service;

use app\exception\AccessDeniedException;
use app\model\Entity;
use app\model\TeamEntityRole;
use app\model\TeamMember;
use app\model\TeamRolePermission;
use think\exception\HttpException;
use think\Request;

class PermissionGate
{
    public function assert(int $teamId, int|array $subject, array $permissionKeys): void
    {
        if (!$this->allows($teamId, $subject, $permissionKeys)) {
            throw AccessDeniedException::permission($permissionKeys);
        }
    }

    public function effective(int $teamId, int|array $subject): array
    {
        $subject = $this->subject($subject);
        if (!$this->validSubject($teamId, $subject)) {
            return [];
        }

        $roleIds = TeamEntityRole::where('team_id', $teamId)
            ->where('entity_id', $subject['entity_id'])
            ->column('role_id');
        if (!$roleIds) {
            return [];
        }

        return array_values(array_unique(array_map(
            'strval',
            TeamRolePermission::where('team_id', $teamId)
                ->whereIn('role_id', $roleIds)
                ->column('permission_key')
        )));
    }

    public function allows(int $teamId, int|array $subject, array $permissionKeys): bool
    {
        $subject = $this->subject($subject);
        if (!$this->validSubject($teamId, $subject)) {
            return false;
        }

        return $this->assignedAllows($teamId, $subject, $permissionKeys);
    }

    /**
     * 校验目标团队授予来源实体的权限。来源实体可以属于其他团队。
     */
    public function delegatedAllows(int $targetTeamId, array $source, Entity $target): bool
    {
        $source = $this->subject($source);
        if (!$this->validGlobalSubject($source) || !$target->is_valid) {
            return false;
        }

        $targetTeamIdFromEntity = app(IdentitySession::class)->entityTeamId(
            (string) $target->entityable_type,
            (int) $target->entityable_id
        );
        if ($targetTeamIdFromEntity !== $targetTeamId) {
            return false;
        }

        $keys = app(IdentitySession::class)->assumePermissionKeys($target);
        return $this->assignedAllows($targetTeamId, $source, $keys);
    }

    private function subject(int|array $subject): array
    {
        if (is_int($subject)) $subject = ['type' => 'teamMember', 'id' => $subject];
        $type = (string) ($subject['type'] ?? '');
        $id = (int) ($subject['id'] ?? 0);
        if (!in_array($type, ['teamMember', 'teamCustomer', 'team', 'teamVirtual'], true) || $id < 1) {
            throw new HttpException(500, 'Permission subject is invalid');
        }
        $entity = Entity::where('entityable_type', $type)->where('entityable_id', $id)->find();
        if (!$entity) {
            throw new HttpException(500, 'Permission subject has no entity');
        }
        return ['type' => $type, 'id' => $id, 'entity_id' => (int) $entity->id];
    }

    private function validSubject(int $teamId, array $subject): bool
    {
        return match ($subject['type']) {
            'teamMember' => $this->validTeamMember($teamId, (int) $subject['id']),
            'teamCustomer' => (bool) \app\model\TeamCustomer::where('team_id', $teamId)->where('id', $subject['id'])->where('is_blocked', 0)->find(),
            'team' => (bool) \app\model\Team::active()->where('id', $teamId)->where('id', $subject['id'])->find(),
            'teamVirtual' => (bool) \app\model\TeamVirtual::where('team_id', $teamId)->where('id', $subject['id'])->where('is_active', 1)->find(),
            default => false,
        };
    }

    private function validTeamMember(int $teamId, int $memberId): bool
    {
        $member = TeamMember::where('team_id', $teamId)->find($memberId);
        return $member ? (bool) $member->is_valid : false;
    }

    private function validGlobalSubject(array $subject): bool
    {
        $identity = Entity::where('entityable_type', $subject['type'])
            ->where('entityable_id', $subject['id'])
            ->find();

        return $identity ? (bool) $identity->is_valid : false;
    }

    private function assignedAllows(int $teamId, array $subject, array $permissionKeys): bool
    {
        $keys = array_values(array_unique(array_filter(array_map('strval', $permissionKeys))));
        if (!$keys) {
            return false;
        }
        foreach ($keys as $key) {
            $this->assertKey($key);
        }

        $roleIds = TeamEntityRole::where('team_id', $teamId)
            ->where('entity_id', $subject['entity_id'])
            ->column('role_id');
        if (!$roleIds) {
            return false;
        }

        return (bool) TeamRolePermission::where('team_id', $teamId)
            ->whereIn('role_id', $roleIds)
            ->whereIn('permission_key', $keys)
            ->find();
    }

    public function candidates(Request $request, string ...$templates): array
    {
        $templates = $this->splitTemplates($templates);
        if (!$templates) {
            throw new HttpException(500, 'Permission 中间件至少需要一个权限参数');
        }

        $keys = [];
        foreach ($templates as $template) {
            $keys = array_merge($keys, $this->templateCandidates($request, $template));
        }

        return array_values(array_unique($keys));
    }

    private function splitTemplates(array $arguments): array
    {
        $templates = [];
        foreach ($arguments as $argument) {
            foreach (explode(',', $argument) as $template) {
                $template = trim($template);
                if ($template === '') {
                    throw new HttpException(500, 'Permission 中间件包含空权限参数');
                }
                $templates[] = $template;
            }
        }

        return $templates;
    }

    private function templateCandidates(Request $request, string $template): array
    {
        if (!preg_match_all('/<([a-z][a-z0-9_]*)>/', $template, $matches)) {
            $this->assertKey($template);
            return [$template];
        }
        if (count($matches[1]) !== 1) {
            throw new HttpException(500, '一个权限模板只能包含一个动态参数');
        }

        $name = $matches[1][0];
        $value = $this->requestValue($request, $name);
        $wildcard = str_replace("<{$name}>", '*', $template);
        $this->assertKey($wildcard);

        if ($value === null || $value === '') {
            throw new HttpException(422, "权限参数 {$name} 不能为空");
        }

        $value = strtolower(trim((string) $value));
        if ($value === '*' || !preg_match('/^[a-z0-9][a-z0-9_-]{0,49}$/', $value)) {
            throw new HttpException(422, "权限参数 {$name} 格式不正确");
        }

        $specific = str_replace("<{$name}>", $value, $template);
        $this->assertKey($specific);

        return [$specific, $wildcard];
    }

    public function assertKey(string $key): void
    {
        if ($key === '' || mb_strlen($key) > 100
            || !preg_match('/^[a-z][a-z0-9_-]*(?:\.(?:[a-z0-9][a-z0-9_-]*|\*))*$/', $key)
            || substr_count($key, '*') > 1
            || !PermissionDictionary::contains($key)) {
            throw new HttpException(500, '权限配置无效');
        }
    }

    private function requestValue(Request $request, string $name): mixed
    {
        $sources = [
            $request->route($name, null),
            $request->get($name, null),
            $request->post($name, null),
            $request->isPut() ? $request->put($name, null) : null,
        ];
        $provided = array_values(array_filter($sources, static fn ($value) => $value !== null && $value !== ''));
        if (!$provided) {
            return null;
        }

        $normalized = array_values(array_unique(array_map(
            static fn ($value): string => strtolower(trim((string) $value)),
            $provided
        )));
        if (count($normalized) > 1) {
            throw new HttpException(422, "权限参数 {$name} 在请求中的值不一致");
        }

        return $normalized[0];
    }
}
