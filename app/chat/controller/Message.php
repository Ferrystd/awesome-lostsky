<?php
declare (strict_types = 1);

namespace app\chat\controller;

class Message
{
    protected $middleware = ['JwtAuth', 'Context', 'ChatAccess'];

    public function index(\think\Request $request)
    {
        return success(app(\app\service\ChatMessage::class)->list(
            (int) $request->team_id, (string) $request->get('conversation', ''),
            (int) ($request->member_id ?? 0), (int) ($request->customer_id ?? 0),
            (int) $request->get('before_id', 0), (int) $request->get('limit', 50)
        ));
    }

    public function send(\think\Request $request)
    {
        return success(app(\app\service\ChatMessage::class)->send(
            (int) $request->team_id, (int) ($request->member_id ?? 0), (int) ($request->customer_id ?? 0),
            [
                'conversation' => $request->post('conversation', ''), 'actor_slug' => $request->post('actor_slug', ''),
                'content' => $request->post('content', ''), 'reply_id' => $request->post('reply_id'),
            ]
        ), '消息已发送');
    }

    public function edit(\think\Request $request)
    {
        app(\app\service\ChatMessage::class)->edit(
            (int) $request->team_id, (int) ($request->member_id ?? 0), (int) ($request->customer_id ?? 0),
            (int) $request->post('message_id', 0), (string) $request->post('content', '')
        );
        return message('消息已编辑');
    }

    public function revoke(\think\Request $request)
    {
        app(\app\service\ChatMessage::class)->revoke(
            (int) $request->team_id, (int) ($request->member_id ?? 0), (int) ($request->customer_id ?? 0),
            (int) $request->post('message_id', 0)
        );
        return message('消息已撤回');
    }

    public function read(\think\Request $request)
    {
        app(\app\service\ChatMessage::class)->read(
            (int) $request->team_id, (string) $request->post('conversation', ''),
            (string) $request->post('actor_slug', ''), (int) ($request->member_id ?? 0),
            (int) ($request->customer_id ?? 0), (int) $request->post('message_id', 0)
        );
        return message('已读状态已更新');
    }
}
