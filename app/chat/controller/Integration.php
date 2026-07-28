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
            'middleware' => ['Permission', [Permissions::CHAT_VIRTUAL_MANAGE_TEMPLATE]],
            'options' => ['except' => ['send']],
        ],
    ];

    public function create(\think\Request $request)
    {
        return success(app(\app\service\ChatIntegration::class)->create(
            (int) $request->team_id,
            (string) $request->param('slug', ''),
            ['name' => $request->post('name', ''), 'endpoint_url' => $request->post('endpoint_url', ''),
                'events' => $request->post('events', [])]
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
            (string) $request->param('slug', ''),
            (int) $request->param('id', 0),
            $data
        );
        return message('集成已更新');
    }

    public function rotate(\think\Request $request)
    {
        return success(app(\app\service\ChatIntegration::class)->rotate(
            (int) $request->team_id,
            (string) $request->param('slug', ''),
            (int) $request->param('id', 0)
        ), '凭据已轮换，请立即保存');
    }

    public function delete(\think\Request $request)
    {
        app(\app\service\ChatIntegration::class)->delete(
            (int) $request->team_id,
            (string) $request->param('slug', ''),
            (int) $request->param('id', 0)
        );
        return message('集成已删除');
    }

    public function send(\think\Request $request)
    {
        $authorization = (string) $request->header('Authorization', '');
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
