<?php
declare(strict_types=1);

namespace app\service;

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
            throw new HttpException(403, '你没有执行此操作的权限');
        }
    }

    public function allows(int $teamId, int|array $subject, array $permissionKeys): bool
    {
        $subject = $this->subject($subject);
        if (!$this->validSubject($teamId, $subject)) {
            return false;
        }

        $keys = array_values(array_unique(array_filter(array_map('strval', $permissionKeys))));
        if (!$keys) {
            return false;
        }
        foreach ($keys as $key) {
            $this->assertKey($key);
        }

        $roleIds = TeamEntityRole::where('team_id', $teamId)
            ->where('entity_type', $subject['type'])
            ->where('entity_id', $subject['id'])
            ->column('role_id');
        if (!$roleIds) {
            return false;
        }

        return (bool) TeamRolePermission::where('team_id', $teamId)
            ->whereIn('role_id', $roleIds)
            ->whereIn('permission_key', $keys)
            ->find();
    }

    private function subject(int|array $subject): array
    {
        if (is_int($subject)) return ['type' => 'teamMember', 'id' => $subject];
        $type = (string) ($subject['type'] ?? '');
        $id = (int) ($subject['id'] ?? 0);
        if (!in_array($type, ['teamMember', 'teamCustomer', 'team', 'teamVirtual'], true) || $id < 1) {
            throw new HttpException(500, 'Permission subject is invalid');
        }
        return compact('type', 'id');
    }

    private function validSubject(int $teamId, array $subject): bool
    {
        return match ($subject['type']) {
            'teamMember' => (bool) TeamMember::where('team_id', $teamId)->where('id', $subject['id'])->where('is_blocked', 0)->find(),
            'teamCustomer' => (bool) \app\model\TeamCustomer::where('team_id', $teamId)->where('id', $subject['id'])->where('is_blocked', 0)->find(),
            'team' => (bool) \app\model\Team::active()->where('id', $teamId)->where('id', $subject['id'])->find(),
            'teamVirtual' => (bool) \app\model\TeamVirtual::where('team_id', $teamId)->where('id', $subject['id'])->where('is_active', 1)->find(),
            default => false,
        };
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
            || substr_count($key, '*') > 1) {
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
