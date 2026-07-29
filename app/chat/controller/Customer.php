<?php
declare (strict_types = 1);

namespace app\chat\controller;

class Customer
{
    protected $middleware = [
        'JwtAuth', 'Context', 'EntityType:teamCustomer', 'TeamAuth', 'CustomerAccess',
    ];

    public function me(\think\Request $request)
    {
        return success(app(\app\service\CustomerProfile::class)->get(
            $request->team_id, $request->customer_id
        ));
    }

    public function update(\think\Request $request)
    {
        app(\app\service\CustomerProfile::class)->update(
            $request->team_id, $request->customer_id,
            ['nickname' => $request->post('nickname', ''), 'avatar' => $request->post('avatar'),
                'description' => $request->post('description')]
        );
        return message('客户资料已更新');
    }

    public function slug(\think\Request $request)
    {
        return success(app(\app\service\CustomerProfile::class)->claimSlug(
            $request->team_id, $request->customer_id, $request->post('slug/s', '')
        ), '客户标识已确定');
    }
}
