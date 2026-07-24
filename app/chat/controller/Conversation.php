<?php
declare (strict_types = 1);

namespace app\chat\controller;

class Conversation
{
    protected $middleware = [
        'JwtAuth', 'Context', 'EntityType:team,teamMember,teamCustomer,teamVirtual',
        'TeamBelongs', 'ChatAccess',
    ];

    public function index(\think\Request $request)
    {
        return success(app(\app\service\ChatConversation::class)->list(
            (int) $request->team_id, (int) ($request->member_id ?? 0), (int) ($request->customer_id ?? 0)
        ));
    }

    public function get(\think\Request $request)
    {
        return success(app(\app\service\ChatConversation::class)->get(
            (int) $request->team_id, (string) $request->param('uuid', ''),
            (int) ($request->member_id ?? 0), (int) ($request->customer_id ?? 0)
        ));
    }

    public function create(\think\Request $request)
    {
        return success(app(\app\service\ChatConversation::class)->create(
            (int) $request->team_id, (int) ($request->member_id ?? 0), (int) ($request->customer_id ?? 0),
            [
                'kind' => $request->post('kind', 'direct'), 'title' => $request->post('title'),
                'actor_slug' => $request->post('actor_slug', ''), 'participants' => $request->post('participants', []),
                'is_temporary' => $request->post('is_temporary', 0), 'expires_at' => $request->post('expires_at'),
            ]
        ), '会话已创建');
    }

    public function close(\think\Request $request)
    {
        app(\app\service\ChatConversation::class)->close(
            (int) $request->team_id, (string) $request->param('uuid', ''),
            (int) ($request->member_id ?? 0), (int) ($request->customer_id ?? 0)
        );
        return message('会话已关闭');
    }

    public function addParticipants(\think\Request $request)
    {
        app(\app\service\ChatConversation::class)->addParticipants(
            (int) $request->team_id,
            (string) $request->post('uuid', ''),
            (int) ($request->member_id ?? 0),
            (int) ($request->customer_id ?? 0),
            (array) $request->post('participants', [])
        );
        return message('参与者已加入群聊');
    }

    public function removeParticipant(\think\Request $request)
    {
        app(\app\service\ChatConversation::class)->removeParticipant(
            (int) $request->team_id,
            (string) $request->post('uuid', ''),
            (int) ($request->member_id ?? 0),
            (int) ($request->customer_id ?? 0),
            (string) $request->post('slug', '')
        );
        return message('参与者已移出群聊');
    }
}
