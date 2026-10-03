<?php
declare(strict_types=1);

namespace app\team\controller;

use app\service\PermissionDictionary as Permissions;

final class ChatGroup
{
    protected $middleware = [
        'JwtAuth','Context','EntityType:team,teamMember,teamCustomer,teamVirtual','TeamWorkspaceAuth',
        ['middleware'=>['Permission',[Permissions::CHAT_GROUP_MANAGE]]],
    ];
    public function index(\think\Request $r){return success(app(\app\service\ChatConversation::class)->teamList($r->team_id));}
    public function get(\think\Request $r){return success(app(\app\service\ChatConversation::class)->teamGet($r->team_id,$r->get('uuid/s','')));}
    public function actors(\think\Request $r){return success(app(\app\service\ChatActor::class)->search($r->get('q/s',''),$r->get('slug/s',''),$r->user_id));}
    public function messages(\think\Request $r){return success(app(\app\service\ChatMessage::class)->teamList($r->team_id,$r->get('uuid/s',''),$r->get('before_id/d',0),$r->get('limit/d',50)));}
    public function create(\think\Request $r){$result=app(\app\service\ChatConversation::class)->teamCreate($r->team_id,$r->acting_entity,$r->post('expected_entity_id/d',0),$r->post('title/s',''),$r->post('participants/a',[]));$this->audit($r,'create',$result['uuid']??null);return success($result,'群聊已创建');}
    public function update(\think\Request $r){$uuid=$r->post('uuid/s','');app(\app\service\ChatConversation::class)->teamUpdate($r->team_id,$r->acting_entity,$r->post('expected_entity_id/d',0),$uuid,$r->post('title/s',''));$this->audit($r,'update',$uuid);return message('群聊已更新');}
    public function invite(\think\Request $r){$uuid=$r->post('uuid/s','');app(\app\service\ChatConversation::class)->teamInvite($r->team_id,$r->acting_entity,$r->post('expected_entity_id/d',0),$uuid,$r->post('participants/a',[]));$this->audit($r,'invite',$uuid);return message('邀请已发送');}
    public function cancelInvitation(\think\Request $r){$uuid=$r->post('uuid/s','');app(\app\service\ChatConversation::class)->teamCancelInvitation($r->team_id,$r->acting_entity,$r->post('expected_entity_id/d',0),$uuid,$r->post('entity_slug/s',''));$this->audit($r,'cancelInvitation',$uuid);return message('邀请已撤销');}
    public function removeParticipant(\think\Request $r){$uuid=$r->post('uuid/s','');app(\app\service\ChatConversation::class)->teamRemove($r->team_id,$r->acting_entity,$r->post('expected_entity_id/d',0),$uuid,$r->post('entity_slug/s',''));$this->audit($r,'removeParticipant',$uuid);return message('参与者已移除');}
    public function revokeMessage(\think\Request $r){app(\app\service\ChatMessage::class)->teamRevoke($r->team_id,$r->acting_entity,$r->post('expected_entity_id/d',0),$r->post('message_id/d',0));$this->audit($r,'revokeMessage',null);return message('消息已撤回');}
    public function close(\think\Request $r){$uuid=$r->post('uuid/s','');app(\app\service\ChatConversation::class)->teamClose($r->team_id,$r->acting_entity,$r->post('expected_entity_id/d',0),$uuid);$this->audit($r,'close',$uuid);return message('群聊已关闭');}
    private function audit(\think\Request $r,string $action,?string $uuid):void{app(\app\service\BusinessAudit::class)->record($r,'team',$action,'chatGroup',null,['conversation_uuid'=>$uuid]);}
}
