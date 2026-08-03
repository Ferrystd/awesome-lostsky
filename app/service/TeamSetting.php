<?php
declare(strict_types=1);

namespace app\service;

use app\enum\Visibility as VisibilityEnum;
use app\model\TeamSetting as TeamSettingModel;
use think\exception\HttpException;

class TeamSetting
{
    public function internal(int $teamId, string $appName): array
    {
        return $this->internalMany([$teamId], $appName)[$teamId] ?? $this->defaults($appName);
    }

    public function internalMany(array $teamIds, string $appName): array
    {
        $definitions = $this->definitions($appName);
        $teamIds     = array_values(array_unique(array_filter(array_map('intval', $teamIds))));
        if (!$teamIds) {
            return [];
        }

        $defaults = $this->defaults($appName);
        $result   = [];
        foreach ($teamIds as $teamId) {
            $result[$teamId] = $defaults;
        }

        $rows = TeamSettingModel::whereIn('team_id', $teamIds)
            ->where('app_name', $appName)
            ->select();
        foreach ($rows as $row) {
            $key = (string) $row->key;
            if (!isset($definitions[$key])) {
                continue;
            }

            try {
                $result[(int) $row->team_id][$key] = $this->normalize($appName, $key, $row->value);
            } catch (HttpException) {
                // 无效历史值回退到注册表默认值。
            }
        }

        return $result;
    }

    public function get(int $teamId, string $appName, array $actingEntity): array
    {
        $definitions = $this->definitions($appName);
        $guard       = app(\app\service\Visibility::class);
        $isManager   = $guard->isTeamManager($teamId, $actingEntity);
        $result      = $this->defaults($appName);

        $rows = TeamSettingModel::where('team_id', $teamId)
            ->where('app_name', $appName)
            ->select();

        foreach ($rows as $row) {
            $key = (string) $row->key;
            if (!isset($definitions[$key])) {
                continue;
            }

            if (!$guard->canView($row, (int) $actingEntity['entity_id'], $isManager, false)) {
                unset($result[$key]);
                continue;
            }

            try {
                $result[$key] = $this->normalize($appName, $key, $row->value);
            } catch (HttpException) {
                // 无效历史值不覆盖默认值。
            }
        }

        return $this->typedSettings($result, $definitions);
    }

    public function schema(int $teamId): array
    {
        $registry = $this->registry();
        $values   = [];
        foreach (array_keys($registry) as $appName) {
            $values[$appName] = $this->defaults($appName);
        }

        if ($registry) {
            $rows = TeamSettingModel::where('team_id', $teamId)
                ->whereIn('app_name', array_keys($registry))
                ->select();
            foreach ($rows as $row) {
                $appName = (string) $row->app_name;
                $key     = (string) $row->key;
                if (!isset($registry[$appName]['settings'][$key])) {
                    continue;
                }

                try {
                    $values[$appName][$key] = $this->normalize($appName, $key, $row->value);
                } catch (HttpException) {
                    // 无效历史值在管理页面中显示为默认值。
                }
            }
        }

        $apps = [];
        foreach ($registry as $appName => $group) {
            $settings = [];
            foreach ($this->definitions($appName) as $key => $definition) {
                $settings[] = $this->fieldSchema($appName, $key, $definition, $values[$appName][$key]);
            }
            usort($settings, static fn (array $left, array $right): int => $left['order'] <=> $right['order']);

            $apps[] = [
                'app_name'    => $appName,
                'label'       => (string) ($group['label'] ?? $appName),
                'description' => (string) ($group['description'] ?? ''),
                'order'       => (int) ($group['order'] ?? 0),
                'settings'    => $settings,
            ];
        }
        usort($apps, static fn (array $left, array $right): int => $left['order'] <=> $right['order']);

        return ['apps' => $apps];
    }

    public function set(
        int $teamId,
        string $appName,
        string $key,
        mixed $value,
        int $visibility = VisibilityEnum::Team->value,
        array $targets = []
    ): void {
        $before = $appName === 'member' ? $this->internal($teamId, 'member') : [];
        $preparedVisibility = $this->visibility($visibility);
        $this->assertVisibility($preparedVisibility);
        $normalized = $this->normalize($appName, $key, $value);

        \think\facade\Db::transaction(function () use ($teamId, $appName, $key, $normalized, $preparedVisibility, $targets) {
            $this->persist($teamId, $appName, $key, $normalized, $preparedVisibility, $targets);
        });
        $this->afterMemberSettingsChanged($teamId, $appName, $before);
    }

    public function batch(int $teamId, string $appName, array $kv): void
    {
        $before = $appName === 'member' ? $this->internal($teamId, 'member') : [];
        $this->definitions($appName);
        $prepared = [];
        foreach ($kv as $key => $value) {
            $key     = (string) $key;
            $setting = $this->settingData($value);
            $setting['value']      = $this->normalize($appName, $key, $setting['value']);
            $setting['visibility'] = $this->visibility($setting['visibility']);
            $this->assertVisibility($setting['visibility']);
            $prepared[$key] = $setting;
        }

        \think\facade\Db::transaction(function () use ($teamId, $appName, $prepared) {
            foreach ($prepared as $key => $setting) {
                $this->persist(
                    $teamId,
                    $appName,
                    $key,
                    $setting['value'],
                    $setting['visibility'],
                    $setting['visibility_targets']
                );
            }
        });
        $this->afterMemberSettingsChanged($teamId, $appName, $before);
    }

    private function afterMemberSettingsChanged(int $teamId, string $appName, array $before): void
    {
        if ($appName !== 'member' || !(bool) ($before['inactive_entity_available'] ?? false)) {
            return;
        }

        $after = $this->internal($teamId, 'member');
        if (!(bool) ($after['inactive_entity_available'] ?? false)) {
            app(IdentitySession::class)->revokeInactiveMembers($teamId);
        }
    }

    private function persist(
        int $teamId,
        string $appName,
        string $key,
        string $value,
        VisibilityEnum $visibility,
        array $targets
    ): void {
        $setting = TeamSettingModel::withTrashed()
            ->where('team_id', $teamId)
            ->where('app_name', $appName)
            ->where('key', $key)
            ->find();
        $data = [
            'value' => $value,
            'visibility' => $visibility,
            'delete_time' => null,
        ];
        if (!$setting) {
            $setting = app(TeamSettingModel::class, [], true);
            $data = array_merge([
                'team_id' => $teamId,
                'app_name' => $appName,
                'key' => $key,
            ], $data);
        }
        $setting->save($data);

        app(\app\service\Visibility::class)->syncTargets(
            $setting,
            $visibility === VisibilityEnum::Custom ? $targets : [],
            $teamId
        );
    }

    private function registry(): array
    {
        $registry = config('teamsetting', []);
        return is_array($registry) ? $registry : [];
    }

    private function definitions(string $appName): array
    {
        $settings = $this->registry()[$appName]['settings'] ?? null;
        if (!is_array($settings)) {
            throw new HttpException(422, '团队设置应用未登记');
        }

        return $settings;
    }

    private function defaults(string $appName): array
    {
        $defaults = [];
        foreach ($this->definitions($appName) as $key => $definition) {
            if (!is_array($definition) || !array_key_exists('default', $definition)) {
                throw new \LogicException("TeamSetting {$appName}.{$key} 缺少默认值");
            }
            $defaults[$key] = $this->normalize($appName, (string) $key, $definition['default']);
        }

        return $defaults;
    }

    private function settingData(mixed $value): array
    {
        if (is_array($value) && array_key_exists('value', $value)) {
            return [
                'value'              => $value['value'],
                'visibility'         => (int) ($value['visibility'] ?? VisibilityEnum::Team->value),
                'visibility_targets' => is_array($value['visibility_targets'] ?? null) ? $value['visibility_targets'] : [],
            ];
        }

        return [
            'value'              => $value,
            'visibility'         => VisibilityEnum::Team->value,
            'visibility_targets' => [],
        ];
    }

    private function normalize(string $appName, string $key, mixed $value): string
    {
        $definition = $this->definitions($appName)[$key] ?? null;
        if (!is_array($definition)) {
            throw new HttpException(422, "团队设置 {$appName}.{$key} 未登记");
        }

        $label = (string) ($definition['label'] ?? $key);
        return match ($definition['type'] ?? 'string') {
            'boolean' => $this->normalizeBoolean($value, $label),
            'integer' => $this->normalizeInteger($value, $definition, $label),
            'enum'    => $this->normalizeEnum($value, $definition, $label),
            'string'  => $this->normalizeString($value, $definition, $label),
            default   => throw new \LogicException("TeamSetting {$appName}.{$key} 类型未受支持"),
        };
    }

    private function normalizeBoolean(mixed $value, string $label): string
    {
        if (is_bool($value)) {
            return $value ? '1' : '0';
        }
        if (in_array($value, [0, 1, '0', '1'], true)) {
            return (string) $value;
        }

        throw new HttpException(422, "{$label}必须是布尔值");
    }

    private function normalizeInteger(mixed $value, array $definition, string $label): string
    {
        if (is_int($value)) {
            $integer = $value;
        } elseif (is_string($value) && preg_match('/^-?\d+$/D', $value)) {
            $integer = (int) $value;
        } else {
            throw new HttpException(422, "{$label}必须是整数");
        }

        if (isset($definition['min']) && $integer < (int) $definition['min']) {
            throw new HttpException(422, "{$label}不能小于{$definition['min']}");
        }
        if (isset($definition['max']) && $integer > (int) $definition['max']) {
            throw new HttpException(422, "{$label}不能大于{$definition['max']}");
        }

        return (string) $integer;
    }

    private function normalizeEnum(mixed $value, array $definition, string $label): string
    {
        $enum = $definition['enum'] ?? null;
        if (!is_string($enum) || !enum_exists($enum) || !is_subclass_of($enum, \BackedEnum::class)) {
            throw new \LogicException("{$label}未配置有效的 backed enum");
        }

        if ($value instanceof $enum) {
            return (string) $value->value;
        }

        $backingType = (new \ReflectionEnum($enum))->getBackingType()?->getName();
        if ($backingType === 'int') {
            if (is_int($value)) {
                $candidate = $value;
            } elseif (is_string($value) && preg_match('/^-?\d+$/D', $value)) {
                $candidate = (int) $value;
            } else {
                $candidate = null;
            }
        } else {
            $candidate = is_string($value) ? $value : null;
        }

        $case = $candidate === null ? null : $enum::tryFrom($candidate);
        if (!$case) {
            throw new HttpException(422, "{$label}的选项不合法");
        }

        return (string) $case->value;
    }

    private function normalizeString(mixed $value, array $definition, string $label): string
    {
        if (!is_string($value) && !is_int($value) && !is_float($value)) {
            throw new HttpException(422, "{$label}必须是字符串");
        }
        $string = (string) $value;
        $length = function_exists('mb_strlen') ? mb_strlen($string) : strlen($string);
        if (isset($definition['min_length']) && $length < (int) $definition['min_length']) {
            throw new HttpException(422, "{$label}长度不足");
        }
        if (isset($definition['max_length']) && $length > (int) $definition['max_length']) {
            throw new HttpException(422, "{$label}长度超出限制");
        }

        return $string;
    }

    private function fieldSchema(string $appName, string $key, array $definition, string $value): array
    {
        $type = (string) ($definition['type'] ?? 'string');
        $field = [
            'key'         => $key,
            'label'       => (string) ($definition['label'] ?? $key),
            'description' => (string) ($definition['description'] ?? ''),
            'type'        => $type,
            'control'     => (string) ($definition['control'] ?? $this->defaultControl($type)),
            'order'       => (int) ($definition['order'] ?? 0),
            'default'     => $this->typedValue($this->normalize($appName, $key, $definition['default']), $definition),
            'value'       => $this->typedValue($value, $definition),
        ];

        if ($type === 'enum') {
            $field['options'] = $this->enumOptions($definition);
        }
        foreach (['min', 'max', 'step', 'min_length', 'max_length'] as $rule) {
            if (array_key_exists($rule, $definition)) {
                $field[$rule] = $definition[$rule];
            }
        }

        return $field;
    }

    private function typedValue(string $value, array $definition): mixed
    {
        return match ($definition['type'] ?? 'string') {
            'boolean' => $value === '1',
            'integer' => (int) $value,
            'enum'    => (new \ReflectionEnum($definition['enum']))->getBackingType()?->getName() === 'int'
                ? (int) $value
                : $value,
            default   => $value,
        };
    }

    private function typedSettings(array $values, array $definitions): array
    {
        $typed = [];
        foreach ($values as $key => $value) {
            if (isset($definitions[$key])) {
                $typed[$key] = $this->typedValue($value, $definitions[$key]);
            }
        }
        return $typed;
    }

    private function enumOptions(array $definition): array
    {
        $enum = $definition['enum'];
        return array_map(static function (\BackedEnum $case): array {
            $option = [
                'value' => $case->value,
                'label' => method_exists($case, 'value') ? $case->value() : $case->name,
            ];
            if (method_exists($case, 'description')) {
                $option['description'] = $case->description();
            }
            return $option;
        }, $enum::cases());
    }

    private function defaultControl(string $type): string
    {
        return match ($type) {
            'boolean' => 'switch',
            'integer' => 'number',
            'enum'    => 'select',
            default   => 'input',
        };
    }

    private function assertVisibility(VisibilityEnum $visibility): void
    {
        if (!in_array($visibility, [VisibilityEnum::Team, VisibilityEnum::Entity, VisibilityEnum::Public, VisibilityEnum::Custom], true)) {
            throw new HttpException(422, '设置可见范围不合法');
        }
    }

    private function visibility(mixed $value): VisibilityEnum
    {
        try {
            return $value instanceof VisibilityEnum ? $value : VisibilityEnum::from((int) $value);
        } catch (\ValueError) {
            throw new HttpException(422, '可见范围格式不正确');
        }
    }
}
