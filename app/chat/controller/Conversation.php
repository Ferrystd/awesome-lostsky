<?php
declare (strict_types = 1);

namespace app\chat\controller;

class Conversation
{
    protected $middleware = [
        'JwtAuth', 'Context', 'EntityType:team,teamMember,teamCustomer,teamVirtual',
        'TeamAuth', 'ChatAccess',
    ];

    public function index(\think\Request $request)
    {
        return success(app(\app\service\ChatConversation::class)->list(
            $request->team_id, $request->acting_entity
        ));
    }

    public function get(\think\Request $request)
    {
        return success(app(\app\service\ChatConversation::class)->get(
            $request->team_id, $request->get('uuid/s', ''),
            $request->acting_entity
        ));
    }

    public function create(\think\Request $request)
    {
        return success(app(\app\service\ChatConversation::class)->create(
            $request->team_id, $request->acting_entity,
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
            $request->team_id, $request->post('uuid/s', ''),
            $request->acting_entity
        );
        return message('会话已关闭');
    }

    public function addParticipants(\think\Request $request)
    {
        app(\app\service\ChatConversation::class)->addParticipants(
            $request->team_id,
            $request->post('uuid/s', ''),
            $request->acting_entity,
            $request->post('participants/a', [])
        );
        return message('参与者已加入群聊');
    }

    public function removeParticipant(\think\Request $request)
    {
        app(\app\service\ChatConversation::class)->removeParticipant(
            $request->team_id,
            $request->post('uuid/s', ''),
            $request->acting_entity,
            $request->post('slug/s', '')
        );
        return message('参与者已移出群聊');
    }
}
