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
            'middleware' => ['Permission', [Permissions::TEAM_ENTITY_VIRTUAL_MANAGE_TEMPLATE]],
        ],
    ];

    public function create(\think\Request $request)
    {
        $result = app(\app\service\ChatIntegration::class)->create(
            $request->team_id,
            $request->post('slug/s', ''),
            [
                'name' => $request->post('name', ''),
                'endpoint_url' => $request->post('endpoint_url', ''),
                'events' => $request->post('events', []),
            ]
        );
        app(\app\service\BusinessAudit::class)->record(
            $request, 'team', 'create', 'chatIntegration', (int) ($result['id'] ?? 0),
            ['changed_fields' => ['name', 'endpoint_url', 'events']]
        );
        return success($result, '集成已创建，请立即保存凭据');
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
            $request->team_id,
            $request->post('slug/s', ''),
            $request->post('id/d', 0),
            $data
        );
        $id = $request->post('id/d', 0);
        app(\app\service\BusinessAudit::class)->record(
            $request, 'team', 'update', 'chatIntegration', $id,
            ['changed_fields' => array_keys($data), 'changed' => $data !== []]
        );
        return message('集成已更新');
    }

    public function rotate(\think\Request $request)
    {
        $id = $request->post('id/d', 0);
        $result = app(\app\service\ChatIntegration::class)->rotate(
            $request->team_id,
            $request->post('slug/s', ''),
            $id
        );
        app(\app\service\BusinessAudit::class)->record(
            $request, 'team', 'rotate', 'chatIntegration', $id,
            ['changed_fields' => ['api_token', 'signing_secret']]
        );
        return success($result, '凭据已轮换，请立即保存');
    }

    public function delete(\think\Request $request)
    {
        $id = $request->post('id/d', 0);
        app(\app\service\ChatIntegration::class)->delete(
            $request->team_id,
            $request->post('slug/s', ''),
            $id
        );
        app(\app\service\BusinessAudit::class)->record($request, 'team', 'delete', 'chatIntegration', $id);
        return message('集成已删除');
    }
}
