<?php
declare(strict_types=1);

namespace app\service;

use app\model\TeamSetting as TeamSettingModel;
use think\facade\Db;

class TeamSetting
{
    public function get(int $teamId, string $appName): array
    {
        $defaults = config("teamsetting.{$appName}", []);

        $rows = TeamSettingModel::where('team_id', $teamId)
            ->where('app_name', $appName)
            ->column('value', 'key');

        return array_merge($defaults, $rows);
    }

    public function set(int $teamId, string $appName, string $key, string $value): void
    {
        TeamSettingModel::withTrashed()->updateOrCreate([
            'team_id'  => $teamId,
            'app_name' => $appName,
            'key'      => $key,
        ], [
            'value'       => $value,
            'delete_time' => null,
        ]);
    }

    public function batch(int $teamId, string $appName, array $kv): void
    {
        Db::transaction(function () use ($teamId, $appName, $kv) {
            foreach ($kv as $key => $value) {
                TeamSettingModel::withTrashed()->updateOrCreate([
                    'team_id'  => $teamId,
                    'app_name' => $appName,
                    'key'      => $key,
                ], [
                    'value'       => $value,
                    'delete_time' => null,
                ]);
            }
        });
    }
}
