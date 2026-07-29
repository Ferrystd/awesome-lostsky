<?php
declare (strict_types = 1);

namespace app\chat\controller;

class Message
{
    protected $middleware = [
        'JwtAuth', 'Context', 'EntityType:team,teamMember,teamCustomer,teamVirtual',
        'TeamAuth', 'ChatAccess',
    ];

    public function index(\think\Request $request)
    {
        return success(app(\app\service\ChatMessage::class)->list(
            $request->team_id, $request->get('conversation/s', ''),
            $request->acting_entity,
            $request->get('before_id/d', 0), $request->get('limit/d', 50)
        ));
    }

    public function send(\think\Request $request)
    {
        return success(app(\app\service\ChatMessage::class)->send(
            $request->team_id, $request->acting_entity,
            [
                'conversation' => $request->post('conversation', ''), 'actor_slug' => $request->post('actor_slug', ''),
                'content' => $request->post('content', ''), 'reply_id' => $request->post('reply_id'),
            ]
        ), '消息已发送');
    }

    public function edit(\think\Request $request)
    {
        app(\app\service\ChatMessage::class)->edit(
            $request->team_id, $request->acting_entity,
            $request->post('message_id/d', 0), $request->post('content/s', '')
        );
        return message('消息已编辑');
    }

    public function revoke(\think\Request $request)
    {
        app(\app\service\ChatMessage::class)->revoke(
            $request->team_id, $request->acting_entity,
            $request->post('message_id/d', 0)
        );
        return message('消息已撤回');
    }

    public function read(\think\Request $request)
    {
        app(\app\service\ChatMessage::class)->read(
            $request->team_id, $request->post('conversation/s', ''),
            $request->post('actor_slug/s', ''), $request->acting_entity,
            $request->post('message_id/d', 0)
        );
        return message('已读状态已更新');
    }
}
