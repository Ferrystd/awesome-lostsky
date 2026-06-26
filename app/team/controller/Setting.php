<?php
declare(strict_types=1);

namespace app\team\controller;

use app\service\TeamSetting;
use think\Request;

class Setting
{
    protected $middleware = [
        'JwtAuth'    => ['except' => []],
        'Context'    => ['except' => []],
        'TeamMember' => ['except' => []],
        'TeamAccess' => ['only' => ['save']],
    ];

    public function index(Request $request)
    {
        $service = app(TeamSetting::class);
        $result  = $service->get($request->team_id, $request->get('app', 'index'));
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

        return message('设置已保存');
    }
}
