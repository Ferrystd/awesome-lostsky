<?php
declare (strict_types = 1);

namespace app\chat\controller;

use app\service\PermissionDictionary as Permissions;

class Integration
{
    protected $middleware = [
        'JwtAuth' => ['except' => ['send']],
        'Context' => ['except' => ['send']],
        'EntityType:team,teamMember,teamCustomer,teamVirtual' => ['except' => ['send']],
        'TeamAuth' => ['except' => ['send']],
        [
            'middleware' => ['Permission', [Permissions::TEAM_ENTITY_VIRTUAL_MANAGE_TEMPLATE]],
            'options' => ['except' => ['send']],
        ],
    ];

    public function create(\think\Request $request)
    {
        $result = app(\app\service\ChatIntegration::class)->create(
            $request->team_id,
            $request->post('slug/s', ''),
            ['name' => $request->post('name', ''), 'endpoint_url' => $request->post('endpoint_url', ''),
                'events' => $request->post('events', [])]
        );
        app(\app\service\BusinessAudit::class)->record(
            $request, 'chat', 'create', 'chatIntegration', (int) $result['id'],
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
        app(\app\service\BusinessAudit::class)->record(
            $request, 'chat', 'update', 'chatIntegration', $request->post('id/d', 0),
            ['changed_fields' => array_keys($data), 'changed' => $data !== []]
        );
        return message('集成已更新');
    }

    public function rotate(\think\Request $request)
    {
        $result = app(\app\service\ChatIntegration::class)->rotate(
            $request->team_id,
            $request->post('slug/s', ''),
            $request->post('id/d', 0)
        );
        app(\app\service\BusinessAudit::class)->record(
            $request, 'chat', 'rotate', 'chatIntegration', $request->post('id/d', 0),
            ['changed_fields' => ['token', 'signing_secret']]
        );
        return success($result, '凭据已轮换，请立即保存');
    }

    public function delete(\think\Request $request)
    {
        app(\app\service\ChatIntegration::class)->delete(
            $request->team_id,
            $request->post('slug/s', ''),
            $request->post('id/d', 0)
        );
        app(\app\service\BusinessAudit::class)->record(
            $request, 'chat', 'delete', 'chatIntegration', $request->post('id/d', 0)
        );
        return message('集成已删除');
    }

    public function send(\think\Request $request)
    {
        $header = $request->header('Authorization', '');
        $authorization = is_scalar($header) ? (string) $header : '';
        $token = preg_match('/^Bearer\s+(.+)$/i', $authorization, $match) ? trim($match[1]) : '';
        $actor = app(\app\service\ChatIntegration::class)->authenticateActor($token);
        $integration = $actor['integration'];
        $virtual = $actor['virtual'];
        return success(app(\app\service\ChatMessage::class)->send(
            (int) $integration->team_id,
            [
                'entity_id' => (int) $virtual->identity->id,
                'type' => 'teamVirtual',
                'id' => (int) $virtual->id,
            ],
            [
                'conversation' => $request->post('conversation', ''),
                'actor_slug' => $virtual->slug,
                'content' => $request->post('content', ''),
                'reply_id' => $request->post('reply_id'),
            ],
            (int) $integration->id
        ));
    }
}
