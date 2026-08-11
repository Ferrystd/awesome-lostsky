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
        $result = app(\app\service\ChatConversation::class)->create(
            $request->team_id, $request->acting_entity,
            [
                'kind' => $request->post('kind', 'direct'), 'title' => $request->post('title'),
                'actor_slug' => $request->post('actor_slug', ''), 'participants' => $request->post('participants', []),
                'is_temporary' => $request->post('is_temporary', 0), 'expires_at' => $request->post('expires_at'),
            ]
        );
        app(\app\service\BusinessAudit::class)->record(
            $request, 'chat', 'create', 'conversation', null,
            ['conversation_uuid' => $result['uuid'] ?? null, 'changed_fields' => ['kind', 'title', 'participants', 'is_temporary', 'expires_at']]
        );
        return success($result, '会话已创建');
    }

    public function close(\think\Request $request)
    {
        $uuid = $request->post('uuid/s', '');
        app(\app\service\ChatConversation::class)->close(
            $request->team_id, $uuid,
            $request->acting_entity
        );
        app(\app\service\BusinessAudit::class)->record(
            $request, 'chat', 'close', 'conversation', null, ['conversation_uuid' => $uuid]
        );
        return message('会话已关闭');
    }

    public function addParticipants(\think\Request $request)
    {
        $participants = $request->post('participants/a', []);
        $uuid = $request->post('uuid/s', '');
        app(\app\service\ChatConversation::class)->addParticipants(
            $request->team_id,
            $uuid,
            $request->acting_entity,
            $participants
        );
        app(\app\service\BusinessAudit::class)->record(
            $request, 'chat', 'addParticipants', 'conversation', null,
            ['conversation_uuid' => $uuid, 'changed_fields' => ['participants'], 'changed' => $participants !== []]
        );
        return message('参与者已加入群聊');
    }

    public function removeParticipant(\think\Request $request)
    {
        $uuid = $request->post('uuid/s', '');
        app(\app\service\ChatConversation::class)->removeParticipant(
            $request->team_id,
            $uuid,
            $request->acting_entity,
            $request->post('slug/s', '')
        );
        app(\app\service\BusinessAudit::class)->record(
            $request, 'chat', 'removeParticipant', 'conversation', null,
            ['conversation_uuid' => $uuid, 'changed_fields' => ['participants']]
        );
        return message('参与者已移出群聊');
    }
}
