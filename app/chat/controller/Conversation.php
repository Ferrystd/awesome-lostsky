<?php
declare(strict_types=1);

namespace app\chat\controller;

final class Conversation
{
    protected $middleware = ['JwtAuth', 'Context', 'EntityType:team,teamMember,teamCustomer,teamVirtual', 'EntityRequired'];

    public function index(\think\Request $request) { return success(app(\app\service\ChatConversation::class)->list($request->acting_entity)); }
    public function get(\think\Request $request) { return success(app(\app\service\ChatConversation::class)->get($request->get('uuid/s', ''), $request->acting_entity)); }
    public function create(\think\Request $request) { return success(app(\app\service\ChatConversation::class)->create($request->acting_entity, $request->post('expected_entity_id/d', 0), [
        'kind' => $request->post('kind/s', 'direct'), 'participants' => $request->post('participants/a', []),
        'is_temporary' => $request->post('is_temporary/d', 0), 'expires_at' => $request->post('expires_at'),
    ]), '会话已创建'); }
    public function invitations(\think\Request $request) { return success(app(\app\service\ChatConversation::class)->invitations($request->acting_entity)); }
    public function acceptInvitation(\think\Request $request) { app(\app\service\ChatConversation::class)->respondInvitation($request->acting_entity, $request->post('expected_entity_id/d', 0), $request->post('uuid/s', ''), true); return message('已加入群聊'); }
    public function rejectInvitation(\think\Request $request) { app(\app\service\ChatConversation::class)->respondInvitation($request->acting_entity, $request->post('expected_entity_id/d', 0), $request->post('uuid/s', ''), false); return message('已拒绝邀请'); }
    public function leave(\think\Request $request) { app(\app\service\ChatConversation::class)->leave($request->acting_entity, $request->post('expected_entity_id/d', 0), $request->post('uuid/s', '')); return message('已退出群聊'); }
}
