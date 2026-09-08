<?php
declare(strict_types=1);

namespace app\team\controller;

use app\service\TeamSetting;
use app\service\PermissionDictionary as Permissions;
use think\Request;

class Setting
{
    protected $middleware = [
        'JwtAuth'    => ['except' => []],
        'Context'    => ['except' => []],
        'EntityType:team,teamMember,teamCustomer,teamVirtual' => ['except' => []],
        'TeamWorkspaceAuth' => ['except' => []],
        'Permission:' . Permissions::TEAM_SETTING_READ => ['only' => ['index', 'schema']],
        'Permission:' . Permissions::TEAM_SETTING_UPDATE => ['only' => ['save']],
    ];

    public function index(Request $request)
    {
        $service = app(TeamSetting::class);
        $result  = $service->get(
            $request->team_id,
            $request->get('app/s', 'index'),
            $request->acting_entity
        );
        $key     = $request->get('key');

        if ($key !== null) {
            return success([$key => $result[$key] ?? null]);
        }

        return success($result);
    }

    public function save(Request $request)
    {
        $appName  = $request->post('app_name', 'index');
        $settings = $request->post('settings', []);

        if (!is_array($settings) || empty($settings)) {
            return error('请提供设置项', 1, 422);
        }

        $service = app(TeamSetting::class);
        $service->batch($request->team_id, $appName, $settings);
        app(\app\service\BusinessAudit::class)->record(
            $request, 'team', 'save', 'teamSetting', null,
            ['application_group' => $appName, 'changed_fields' => array_map('strval', array_keys($settings))]
        );

        return message('设置已保存');
    }

    public function schema(Request $request)
    {
        return success(app(TeamSetting::class)->schema($request->team_id));
    }
}
