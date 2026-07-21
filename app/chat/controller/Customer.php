<?php
declare (strict_types = 1);

namespace app\chat\controller;

class Customer
{
    protected $middleware = ['JwtAuth', 'Context', 'CustomerAccess'];

    public function me(\think\Request $request)
    {
        return success(app(\app\service\CustomerProfile::class)->get(
            (int) $request->team_id, (int) $request->customer_id
        ));
    }

    public function update(\think\Request $request)
    {
        app(\app\service\CustomerProfile::class)->update(
            (int) $request->team_id, (int) $request->customer_id,
            ['nickname' => $request->post('nickname', ''), 'avatar' => $request->post('avatar'),
                'description' => $request->post('description')]
        );
        return message('客户资料已更新');
    }

    public function slug(\think\Request $request)
    {
        return success(app(\app\service\CustomerProfile::class)->claimSlug(
            (int) $request->team_id, (int) $request->customer_id, (string) $request->post('slug', '')
        ), '客户标识已确定');
    }
}
