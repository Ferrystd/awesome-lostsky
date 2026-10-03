<?php
declare(strict_types=1);
namespace app\chat\controller;
final class Message
{
    protected $middleware=['JwtAuth','Context','EntityType:team,teamMember,teamCustomer,teamVirtual','EntityRequired'];
    public function index(\think\Request $r){return success(app(\app\service\ChatMessage::class)->list($r->get('conversation/s',''),$r->acting_entity,$r->get('before_id/d',0),$r->get('limit/d',50)));}
    public function send(\think\Request $r){return success(app(\app\service\ChatMessage::class)->send($r->acting_entity,$r->post('expected_entity_id/d',0),['conversation'=>$r->post('conversation/s',''),'content'=>$r->post('content/s',''),'reply_id'=>$r->post('reply_id')]),'消息已发送');}
    public function edit(\think\Request $r){app(\app\service\ChatMessage::class)->edit($r->acting_entity,$r->post('expected_entity_id/d',0),$r->post('message_id/d',0),$r->post('content/s',''));return message('消息已编辑');}
    public function revoke(\think\Request $r){app(\app\service\ChatMessage::class)->revoke($r->acting_entity,$r->post('expected_entity_id/d',0),$r->post('message_id/d',0));return message('消息已撤回');}
    public function read(\think\Request $r){app(\app\service\ChatMessage::class)->read($r->acting_entity,$r->post('expected_entity_id/d',0),$r->post('conversation/s',''),$r->post('message_id/d',0));return message('已读状态已更新');}
}
