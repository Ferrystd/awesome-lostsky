<?php
declare(strict_types=1);

require dirname(__DIR__).'/vendor/autoload.php';

use app\enum\TeamMemberStatus;
use app\model\ChatParticipant;
use app\model\ChatConversationAlias;
use app\model\Entity;
use app\model\Team;
use app\model\TeamEntityRole;
use app\model\TeamMember;
use app\model\TeamRole;
use app\model\User;
use app\model\UserDevice;
use app\model\EntitySession;
use app\service\ChatBlock;
use app\service\ChatConversation;
use app\service\ChatMessage;
use app\service\ChatIntegration;
use app\service\ChatOutbox;
use app\service\ChatRealtime;
use app\service\ChatVirtual;
use app\service\Entity as EntityService;
use app\service\EntityProfile;
use app\service\PermissionDictionary;
use app\service\RolePermission;
use app\service\IdentitySession;
use think\App;
use think\exception\HttpException;

(new App(dirname(__DIR__)))->initialize();
$failures=[];
$assert=static function(bool $ok,string $case)use(&$failures){if(!$ok)$failures[]=$case;};
$same=static function(mixed $expected,mixed $actual,string $case)use(&$failures){if($expected!==$actual)$failures[]="$case: expected ".json_encode($expected).", got ".json_encode($actual);};
$throws=static function(callable $callback,int $status,string $case)use(&$failures){try{$callback();$failures[]="$case: expected $status";}catch(HttpException $e){if($e->getStatusCode()!==$status)$failures[]="$case: expected $status, got {$e->getStatusCode()}";}};
$suffix=bin2hex(random_bytes(5));
$db=app()->db;$db->startTrans();
try{
    $makeUser=static function(string $prefix)use($suffix):User{$u=new User;$u->save(['phone'=>'1'.random_int(3000000000,8999999999),'email'=>null,'password'=>password_hash('chat-test',PASSWORD_DEFAULT),'username'=>"$prefix-$suffix"]);return $u;};
    $makeTeamMember=static function(User $user,string $teamPrefix,string $memberPrefix)use($suffix):array{
        $team=new Team;$team->save(['slug'=>"$teamPrefix-$suffix",'user_id'=>$user->id,'is_banned'=>0,'is_cancelled'=>0]);
        app(EntityService::class)->claimTeam($team);
        $member=new TeamMember;$member->save(['team_id'=>$team->id,'user_id'=>$user->id,'status'=>TeamMemberStatus::Active]);
        $entity=app(EntityService::class)->claimMember((int)$team->id,(int)$member->id,"$memberPrefix-$suffix");
        app(EntityProfile::class)->update((int)$team->id,(int)$entity->id,['name'=>$memberPrefix]);
        return [$team,$member,$entity];
    };
    $userA=$makeUser('chat-a');$userB=$makeUser('chat-b');
    [$teamA,$memberA,$entityA]=$makeTeamMember($userA,'chat-team-a','chat-alice');
    [$teamB,$memberB,$entityB]=$makeTeamMember($userB,'chat-team-b','chat-bob');
    $actingA=['entity_id'=>(int)$entityA->id,'type'=>'teamMember','id'=>(int)$memberA->id];
    $actingB=['entity_id'=>(int)$entityB->id,'type'=>'teamMember','id'=>(int)$memberB->id];

    $role=new TeamRole;$role->save(['team_id'=>$teamA->id,'role_key'=>"chat-manager-$suffix",'name'=>'Chat manager','sort'=>0]);
    app(RolePermission::class)->save((int)$teamA->id,(int)$role->id,[PermissionDictionary::CHAT_GROUP_MANAGE]);
    $assignment=new TeamEntityRole;$assignment->save(['team_id'=>$teamA->id,'entity_id'=>$entityA->id,'role_id'=>$role->id]);

    $conversations=app(ChatConversation::class);
    $created=$conversations->create($actingA,(int)$entityA->id,['kind'=>'direct','participants'=>[(string)$entityB->slug]]);
    $same(false,$created['existing'],'first cross-team direct is created');
    $reverse=$conversations->create($actingB,(int)$entityB->id,['kind'=>'direct','participants'=>[(string)$entityA->slug]]);
    $same(true,$reverse['existing'],'direct is globally unique by unordered Entity pair');
    $same($created['uuid'],$reverse['uuid'],'reverse creation returns canonical UUID');
    $direct=$conversations->model($created['uuid'],true);
    $same(null,$direct->team_id,'direct has no owner team');
    $throws(fn()=>$conversations->create($actingA,(int)$entityB->id,['kind'=>'direct','participants'=>[(string)$entityB->slug]]),409,'stale expected Entity is rejected');

    $deviceToken=bin2hex(random_bytes(16));$device=new UserDevice;$device->save([
        'user_id'=>$userA->id,'device_token'=>$deviceToken,'device_name'=>'Chat Backend Test',
        'ua'=>'tests/chat_backend.php','last_active_time'=>time(),
    ]);
    app(IdentitySession::class)->receive((int)$userA->id,$deviceToken,(string)$entityA->slug);
    $entitySession=EntitySession::where('user_id',$userA->id)->where('device_token',$deviceToken)
        ->whereNull('revoked_at')->whereNull('superseded_at')->find();
    $assert((bool)$entitySession,'root EntitySession is issued for realtime');
    $realtime=app(ChatRealtime::class);
    $connection=$realtime->connectionToken((int)$entitySession->id,$actingA,(int)$entityA->id);
    $subscription=$realtime->subscriptionToken((int)$entitySession->id,$actingA,(int)$entityA->id,$created['uuid']);
    $same('/connection/websocket',$connection['url'],'realtime returns the configured client endpoint');
    $same("chat.conversation.{$created['uuid']}.entity.{$entityA->id}.session.{$entitySession->id}",$subscription['channel'],'realtime channel is isolated by EntitySession');
    $aliasUuid='aaaaaaaa-aaaa-4aaa-8aaa-'.substr($suffix.$suffix.$suffix,0,12);
    $alias=new ChatConversationAlias;$alias->save(['alias_uuid'=>$aliasUuid,'conversation_id'=>$direct->id]);
    $aliasSubscription=$realtime->subscriptionToken((int)$entitySession->id,$actingA,(int)$entityA->id,$aliasUuid);
    $same($subscription['channel'],$aliasSubscription['channel'],'legacy UUID subscribes to the canonical realtime channel');
    $assert($connection['token']!==''&&$subscription['token']!=='','realtime issues connection and subscription tokens');
    EntitySession::where('id',$entitySession->id)->update(['revoked_at'=>time()]);
    $activeSessions=new ReflectionMethod(ChatRealtime::class,'activeSessions');
    $same([],array_values($activeSessions->invoke($realtime,(int)$entityA->id)),'revoked EntitySession is excluded from realtime publication');

    $messages=app(ChatMessage::class);
    $sent=$messages->send($actingA,(int)$entityA->id,['conversation'=>$created['uuid'],'content'=>'hello cross team']);
    $same((int)$entityA->id,(int)$sent['sender']['entity_id'],'message author is always current Entity');
    $same($created['uuid'],$sent['conversation'],'message response exposes the conversation UUID');
    $same(1,count($messages->list($created['uuid'],$actingB)),'other participant reads direct messages');

    app(ChatBlock::class)->create($actingB,(int)$entityB->id,(string)$entityA->slug);
    $throws(fn()=>$conversations->create($actingA,(int)$entityA->id,['kind'=>'direct','participants'=>[(string)$entityB->slug],'is_temporary'=>1]),403,'block prevents a new temporary direct');
    $same(1,count($messages->list($created['uuid'],$actingB)),'block preserves existing history');
    $throws(fn()=>$messages->send($actingB,(int)$entityB->id,['conversation'=>$created['uuid'],'content'=>'blocked send']),403,'block prevents either side from continuing the direct conversation');
    $throws(fn()=>$messages->send($actingA,(int)$entityA->id,['conversation'=>$created['uuid'],'content'=>'blocked reverse send']),403,'block prevents the blocked side from sending too');
    app(ChatBlock::class)->delete($actingB,(int)$entityB->id,(string)$entityA->slug);
    $same(false,app(ChatBlock::class)->blockedEitherWay((int)$entityA->id,(int)$entityB->id),'unblock restores contact');

    $group=$conversations->teamCreate((int)$teamA->id,$actingA,(int)$entityA->id,'Cross-team group',[(string)$entityB->slug]);
    $groupModel=$conversations->model($group['uuid'],true);
    $same((int)$teamA->id,(int)$groupModel->team_id,'group belongs to managing Team');
    $pending=ChatParticipant::where('conversation_id',$groupModel->id)->where('entity_id',$entityB->id)->find();
    if (!$pending) throw new RuntimeException('pending invite missing');
    $same('pending',$pending->enumCase('status')->value,'group invite starts pending');
    $invitation=$conversations->invitations($actingB)[0]??[];
    $same(false,array_key_exists('last_message',$invitation),'pending invitation does not expose message history');
    $same(false,array_key_exists('participants',$invitation),'pending invitation does not expose participant details');
    $throws(fn()=>$conversations->get($group['uuid'],$actingB),403,'pending invite cannot read group');
    $conversations->respondInvitation($actingB,(int)$entityB->id,$group['uuid'],true);
    $same('active',ChatParticipant::find($pending->id)->enumCase('status')->value,'accept activates participant');
    $groupMessage=$messages->send($actingB,(int)$entityB->id,['conversation'=>$group['uuid'],'content'=>'group hello']);
    $same(1,count($messages->teamList((int)$teamA->id,$group['uuid'])),'team manager reads messages without joining');
    $conversations->teamRemove((int)$teamA->id,$actingA,(int)$entityA->id,$group['uuid'],(string)$entityB->slug);
    $throws(fn()=>$messages->list($group['uuid'],$actingB),403,'removed participant immediately loses reads');
    $throws(fn()=>$messages->edit($actingB,(int)$entityB->id,(int)$groupMessage['id'],'removed edit'),403,'removed participant cannot edit old messages');
    $throws(fn()=>$messages->revoke($actingB,(int)$entityB->id,(int)$groupMessage['id']),403,'removed participant cannot revoke old messages');

    $removedEvent=\app\model\ChatEventOutbox::where('aggregate_id',$groupModel->id)->where('event_type','conversation.participant.removed')->order('id','desc')->find();
    $same($group['uuid'],$removedEvent?->payload['conversation']??null,'participant removal emits a conversation event');
    $same(false,in_array((int)$entityB->id,$removedEvent?->payload['recipient_entity_ids']??[],true),'removed participant is excluded from event recipients');

    $conversations->teamInvite((int)$teamA->id,$actingA,(int)$entityA->id,$group['uuid'],[(string)$entityB->slug]);
    $conversations->respondInvitation($actingB,(int)$entityB->id,$group['uuid'],true);
    $addedEvent=\app\model\ChatEventOutbox::where('aggregate_id',$groupModel->id)->where('event_type','conversation.participants.added')->order('id','desc')->find();
    $same(true,in_array((int)$entityB->id,$addedEvent?->payload['recipient_entity_ids']??[],true),'accepted participant is included in event recipients');
    $conversations->teamClose((int)$teamA->id,$actingA,(int)$entityA->id,$group['uuid']);
    $throws(fn()=>$messages->send($actingB,(int)$entityB->id,['conversation'=>$group['uuid'],'content'=>'closed send']),409,'closed group rejects new messages');
    $throws(fn()=>$conversations->teamInvite((int)$teamA->id,$actingA,(int)$entityA->id,$group['uuid'],[(string)$entityA->slug]),409,'closed group rejects new invitations');
    $closedEvent=\app\model\ChatEventOutbox::where('aggregate_id',$groupModel->id)->where('event_type','conversation.closed')->order('id','desc')->find();
    $same($group['uuid'],$closedEvent?->payload['conversation']??null,'manual close emits a conversation event');

    $pendingGroup=$conversations->teamCreate((int)$teamA->id,$actingA,(int)$entityA->id,'Pending close group',[(string)$entityB->slug]);
    $conversations->teamClose((int)$teamA->id,$actingA,(int)$entityA->id,$pendingGroup['uuid']);
    $throws(fn()=>$conversations->respondInvitation($actingB,(int)$entityB->id,$pendingGroup['uuid'],true),409,'pending invitation cannot be accepted after close');

    $temporary=$conversations->create($actingA,(int)$entityA->id,['kind'=>'direct','participants'=>[(string)$entityB->slug],'is_temporary'=>1,'expires_at'=>time()+60]);
    \app\model\ChatConversation::where('uuid',$temporary['uuid'])->update(['expires_at'=>time()-1]);
    $throws(fn()=>$conversations->get($temporary['uuid'],$actingA),403,'expired temporary conversation is immediately unreadable');
    $throws(fn()=>$messages->send($actingA,(int)$entityA->id,['conversation'=>$temporary['uuid'],'content'=>'expired send']),409,'expired temporary conversation immediately rejects messages');
    $same(false,in_array($temporary['uuid'],array_column($conversations->list($actingA),'uuid'),true),'expired temporary conversation is omitted from the list');

    $virtualSlug="chat-bot-$suffix";
    app(ChatVirtual::class)->create((int)$teamA->id,['slug'=>$virtualSlug,'name'=>'Chat bot']);
    $integrationService=new class extends ChatIntegration {
        public function endpointResolution(string $url): array { return ['curl_resolve'=>'example.com:443:93.184.216.34']; }
    };
    app()->instance(ChatIntegration::class,$integrationService);
    $credentials=$integrationService->create((int)$teamA->id,$virtualSlug,[
        'name'=>'Chat integration','endpoint_url'=>'https://example.com/hook','events'=>['message.created'],
    ]);
    $integrationActor=$integrationService->authenticateActor($credentials['token']);
    $virtual=$integrationActor['virtual'];
    $virtualEntity=$virtual->identity;
    $same($virtualSlug,(string)$virtualEntity->slug,'integration token remains fixed to its virtual Entity');

    $integrationGroup=$conversations->teamCreate((int)$teamA->id,$actingA,(int)$entityA->id,'Integration group',[$virtualSlug]);
    $actingVirtual=['entity_id'=>(int)$virtualEntity->id,'type'=>'teamVirtual','id'=>(int)$virtual->id];
    $conversations->respondInvitation($actingVirtual,(int)$virtualEntity->id,$integrationGroup['uuid'],true);
    $integrationMessage=$messages->send($actingVirtual,(int)$virtualEntity->id,[
        'conversation'=>$integrationGroup['uuid'],'content'=>'integration hello',
    ],(int)$credentials['id']);
    $same((int)$virtualEntity->id,(int)$integrationMessage['sender']['entity_id'],'integration sends only as its fixed Entity');

    \app\model\ChatWebhookDelivery::where('status','pending')->update(['available_at'=>time()+86400]);
    $event=new \app\model\ChatEventOutbox;
    $event->save(['team_id'=>$teamA->id,'aggregate_type'=>'message','aggregate_id'=>$integrationMessage['id'],
        'event_type'=>'message.created','payload'=>array_merge($integrationMessage,['recipient_entity_ids'=>[(int)$virtualEntity->id]]),
        'attempts'=>0,'available_at'=>time()]);
    $prepare=new ReflectionMethod(ChatOutbox::class,'prepareDeliveries');
    $integrationGroupModel=$conversations->model($integrationGroup['uuid']);
    $prepare->invoke(app(ChatOutbox::class),$event,$integrationGroupModel,null);
    $delivery=\app\model\ChatWebhookDelivery::where('outbox_id',$event->id)->where('integration_id',$credentials['id'])->find();
    $assert((bool)$delivery,'eligible integration receives a webhook delivery');
    $transport=new class extends ChatRealtime {
        public int $requests=0;
        public function request(string $url,string $body,array $headers=[],array $resolve=[]):array{$this->requests++;throw new RuntimeException('test retry');}
    };
    app()->instance(ChatRealtime::class,$transport);
    $deliver=new ReflectionMethod(ChatOutbox::class,'deliverPending');
    $deliver->invoke(app(ChatOutbox::class),20);
    $same('pending',\think\facade\Db::name('chat_webhook_delivery')->where('id',$delivery->id)->value('status'),'failed webhook stays pending for retry');
    $same(1,(int)\app\model\ChatWebhookDelivery::find($delivery->id)->attempts,'failed webhook increments attempts');
    $conversations->teamRemove((int)$teamA->id,$actingA,(int)$entityA->id,$integrationGroup['uuid'],$virtualSlug);
    \app\model\ChatWebhookDelivery::where('id',$delivery->id)->update(['available_at'=>time()]);
    $deliver->invoke(app(ChatOutbox::class),20);
    $same('failed',\think\facade\Db::name('chat_webhook_delivery')->where('id',$delivery->id)->value('status'),'retry revalidates current participation and stops delivery');
    $same(1,$transport->requests,'ineligible retry does not call the webhook endpoint');

    app(ChatVirtual::class)->update((int)$teamA->id,$virtualSlug,['is_active'=>0]);
    $throws(fn()=>$integrationService->authenticateActor($credentials['token']),401,'disabled virtual Entity invalidates its integration token');

    $ownedGroupUuids=array_column($conversations->teamList((int)$teamA->id),'uuid');
    $same(true,in_array((string)$group['uuid'],$ownedGroupUuids,true)&&in_array((string)$integrationGroup['uuid'],$ownedGroupUuids,true),'team group list returns its owned groups');
    $same([],array_column($conversations->teamList((int)$teamB->id),'uuid'),'other team cannot manage the group');
}finally{$db->rollback();}

if($failures){fwrite(STDERR,implode(PHP_EOL,$failures).PHP_EOL);exit(1);}fwrite(STDOUT,"Chat backend tests passed.".PHP_EOL);
