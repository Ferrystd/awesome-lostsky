<?php
declare(strict_types=1);

namespace app\service;

use app\enum\Visibility as VisibilityEnum;
use app\model\TeamSetting as TeamSettingModel;
use think\exception\HttpException;
use think\facade\Db;

class TeamSetting
{
    public function get(int $teamId, string $appName, int $userId = 0, int $memberId = 0): array
    {
        $defaults = config("teamsetting.{$appName}", []);
        $guard    = app(\app\service\Visibility::class);
        $isManager = $guard->isTeamManager($teamId, $userId);

        $rows = TeamSettingModel::where('team_id', $teamId)
            ->where('app_name', $appName)
            ->select();

        $settings = [];
        $hidden   = [];
        foreach ($rows as $row) {
            if ($guard->canView($row, $teamId, $memberId, $isManager, false)) {
                $settings[$row->key] = $row->value;
            } else {
                $hidden[$row->key] = true;
            }
        }

        $result = array_merge($defaults, $settings);
        foreach (array_keys($hidden) as $key) {
            unset($result[$key]);
        }

        return $result;
    }

    public function set(int $teamId, string $appName, string $key, string $value, int $visibility = VisibilityEnum::Team->value, array $targets = []): void
    {
        $visibility = $this->visibility($visibility);
        $this->assertVisibility($visibility);

        Db::transaction(function () use ($teamId, $appName, $key, $value, $visibility, $targets) {
            $setting = TeamSettingModel::withTrashed()->updateOrCreate([
                'team_id'  => $teamId,
                'app_name' => $appName,
                'key'      => $key,
            ], [
                'value'       => $value,
                'visibility'  => $visibility->value,
                'delete_time' => null,
            ]);

            app(\app\service\Visibility::class)->syncTargets($setting, $visibility === VisibilityEnum::Custom ? $targets : [], $teamId);
        });
    }

    public function batch(int $teamId, string $appName, array $kv): void
    {
        foreach ($kv as $key => $value) {
            $setting = $this->settingData($value);
            $this->set($teamId, $appName, (string) $key, $setting['value'], $setting['visibility'], $setting['visibility_targets']);
        }
    }

    private function settingData($value): array
    {
        if (is_array($value) && array_key_exists('value', $value)) {
            return [
                'value'              => (string) $value['value'],
                'visibility'         => (int) ($value['visibility'] ?? VisibilityEnum::Team->value),
                'visibility_targets' => is_array($value['visibility_targets'] ?? null) ? $value['visibility_targets'] : [],
            ];
        }

        return [
            'value'              => (string) $value,
            'visibility'         => VisibilityEnum::Team->value,
            'visibility_targets' => [],
        ];
    }

    private function assertVisibility(VisibilityEnum $visibility): void
    {
        if (!in_array($visibility, [VisibilityEnum::Team, VisibilityEnum::Member, VisibilityEnum::Public, VisibilityEnum::Custom], true)) {
            throw new HttpException(422, '设置可见范围不合法');
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
