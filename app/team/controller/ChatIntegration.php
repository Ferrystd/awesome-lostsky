<?php
declare (strict_types = 1);

namespace app\team\controller;

use app\service\PermissionDictionary as Permissions;

class ChatIntegration
{
    protected $middleware = [
        'JwtAuth',
        'Context',
        'EntityType:team,teamMember,teamCustomer,teamVirtual',
        'TeamAuth',
        [
            'middleware' => ['Permission', [Permissions::CHAT_VIRTUAL_MANAGE_TEMPLATE]],
        ],
    ];

    public function create(\think\Request $request)
    {
        return success(app(\app\service\ChatIntegration::class)->create(
            (int) $request->team_id,
            (string) $request->post('slug', ''),
            [
                'name' => $request->post('name', ''),
                'endpoint_url' => $request->post('endpoint_url', ''),
                'events' => $request->post('events', []),
            ]
        ), '集成已创建，请立即保存凭据');
    }

    public function update(\think\Request $request)
    {
        $data = [];
        foreach (['name', 'endpoint_url', 'events', 'is_active'] as $field) {
            if ($request->has($field, 'post')) {
                $data[$field] = $request->post($field);
            }
        }
        app(\app\service\ChatIntegration::class)->update(
            (int) $request->team_id,
            (string) $request->post('slug', ''),
            (int) $request->post('id', 0),
            $data
        );
        return message('集成已更新');
    }

    public function rotate(\think\Request $request)
    {
        return success(app(\app\service\ChatIntegration::class)->rotate(
            (int) $request->team_id,
            (string) $request->post('slug', ''),
            (int) $request->post('id', 0)
        ), '凭据已轮换，请立即保存');
    }

    public function delete(\think\Request $request)
    {
        app(\app\service\ChatIntegration::class)->delete(
            (int) $request->team_id,
            (string) $request->post('slug', ''),
            (int) $request->post('id', 0)
        );
        return message('集成已删除');
    }
}
