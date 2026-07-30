<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use app\model\Entity;
use app\model\Team;
use app\model\TeamCustomer;
use app\model\TeamEntityRole;
use app\model\TeamNotice;
use app\model\TeamRole;
use app\model\TeamRolePermission;
use app\model\User;
use app\service\Entity as EntityService;
use app\service\Notice;
use app\service\PermissionDictionary;
use think\App;
use think\exception\HttpException;
use think\Request;

(new App(dirname(__DIR__)))->initialize();

$suffix = bin2hex(random_bytes(5));
$owner = new User;
$owner->save([
    'phone' => '17' . random_int(100000000, 999999999),
    'username' => "notice-owner-{$suffix}",
    'password' => password_hash('test-only', PASSWORD_DEFAULT),
]);
$customerUser = new User;
$customerUser->save([
    'phone' => '18' . random_int(100000000, 999999999),
    'username' => "notice-customer-{$suffix}",
    'password' => password_hash('test-only', PASSWORD_DEFAULT),
]);
$otherOwner = new User;
$otherOwner->save([
    'phone' => '19' . random_int(100000000, 999999999),
    'username' => "notice-other-{$suffix}",
    'password' => password_hash('test-only', PASSWORD_DEFAULT),
]);

$team = new Team;
$team->save(['slug' => "notice-{$suffix}", 'user_id' => $owner->id]);
$otherTeam = new Team;
$otherTeam->save(['slug' => "notice-other-{$suffix}", 'user_id' => $otherOwner->id]);
$customer = new TeamCustomer;
$customer->save([
    'team_id' => $team->id,
    'user_id' => $customerUser->id,
    'owner_entity_id' => null,
    'is_blocked' => 0,
]);

$teamEntity = app(EntityService::class)->claimTeam($team);
$otherTeamEntity = app(EntityService::class)->claimTeam($otherTeam);
$customerEntity = app(EntityService::class)->claimCustomer((int) $customer->id, "notice-customer-{$suffix}");
$noticeIds = [];
$roleIds = [];

$assertHttpStatus = static function (callable $callback, int $status, string $case): void {
    try {
        $callback();
    } catch (HttpException $exception) {
        if ($exception->getStatusCode() === $status) {
            return;
        }
        throw new RuntimeException("{$case}: expected {$status}, got {$exception->getStatusCode()}");
    }

    throw new RuntimeException("{$case}: expected HttpException {$status}");
};

try {
    $service = app(Notice::class);
    $teamNotice = $service->send(
        (int) $team->id,
        'LostSky 团队通知',
        '保留原有 Team 收件箱',
        false
    );
    $noticeIds[] = (int) $teamNotice['id'];
    if ((int) $teamNotice['team_id'] !== (int) $team->id
        || $teamNotice['sender_team_id'] !== null
        || $teamNotice['entity_id'] !== null) {
        throw new RuntimeException('Legacy send must keep LostSky -> Team recipient semantics');
    }

    $teamInbox = $service->list((int) $team->id);
    if ($teamInbox['total'] !== 1
        || (int) $teamInbox['list'][0]['id'] !== (int) $teamNotice['id']
        || (int) $teamInbox['list'][0]['is_read'] !== 0) {
        throw new RuntimeException('Team must continue receiving LostSky notices');
    }

    $entityNotice = $service->sendToEntity(
        (int) $team->id,
        (int) $customerEntity->id,
        '客户通知',
        '仅客户 Entity 可见',
        true
    );
    $noticeIds[] = (int) $entityNotice['id'];

    if ($entityNotice['team_id'] !== null
        || (int) $entityNotice['sender_team_id'] !== (int) $team->id
        || (int) $entityNotice['entity_id'] !== (int) $customerEntity->id) {
        throw new RuntimeException('Send result must separate sender team and recipient entity');
    }

    $customerInbox = $service->listForEntity((int) $customerEntity->id);
    if ($customerInbox['total'] !== 1
        || (int) $customerInbox['list'][0]['entity_id'] !== (int) $customerEntity->id
        || (int) $customerInbox['list'][0]['is_read'] !== 0) {
        throw new RuntimeException('Customer Entity must receive its targeted notice');
    }

    $teamEntityNotice = $service->sendToEntity(
        (int) $team->id,
        (int) $teamEntity->id,
        'Team 通知',
        'Team 实体收件箱与共享站内通知相互独立',
        false
    );
    $noticeIds[] = (int) $teamEntityNotice['id'];
    $teamEntityInbox = $service->listForEntity((int) $teamEntity->id);
    if ($teamEntityInbox['total'] !== 1
        || (int) $teamEntityInbox['list'][0]['id'] !== (int) $teamEntityNotice['id']
        || (int) $teamEntityInbox['list'][0]['sender_team_id'] !== (int) $team->id) {
        throw new RuntimeException('Team Entity must be allowed to receive an Entity notice');
    }

    $teamInboxAfterEntitySend = $service->list((int) $team->id);
    if ($teamInboxAfterEntitySend['total'] !== 1) {
        throw new RuntimeException(
            'Entity notice must not be copied into the sender Team inbox; got '
            . $teamInboxAfterEntitySend['total']
        );
    }

    $assertHttpStatus(
        fn () => $service->get((int) $otherTeam->id, (int) $teamNotice['id']),
        404,
        'other team cannot read a Team notice'
    );
    $assertHttpStatus(
        fn () => $service->getForEntity((int) $otherTeamEntity->id, (int) $entityNotice['id']),
        404,
        'other entity cannot read a recipient notice'
    );
    $assertHttpStatus(
        fn () => $service->sendToEntity((int) $team->id, (int) $otherTeamEntity->id, 'Invalid'),
        422,
        'recipient must belong to sender team'
    );

    $service->confirm((int) $team->id, (int) $teamNotice['id']);
    if ((int) $service->get((int) $team->id, (int) $teamNotice['id'])['is_read'] !== 1) {
        throw new RuntimeException('Team must retain its original notice confirmation behavior');
    }
    $service->confirmForEntity((int) $customerEntity->id, (int) $entityNotice['id']);
    if ((int) $service->getForEntity((int) $customerEntity->id, (int) $entityNotice['id'])['is_read'] !== 1) {
        throw new RuntimeException('Recipient must be able to mark its notice read');
    }
    $service->confirmForEntity((int) $teamEntity->id, (int) $teamEntityNotice['id']);
    if ((int) $service->getForEntity((int) $teamEntity->id, (int) $teamEntityNotice['id'])['is_read'] !== 1
        || (int) $service->get((int) $team->id, (int) $teamNotice['id'])['is_read'] !== 1) {
        throw new RuntimeException('Team shared inbox and Team Entity inbox must retain independent rows and shared recipient state');
    }

    if ((int) $team->notices()->where('team_notice.id', $teamNotice['id'])->count() !== 1
        || (int) $team->sentNotices()->where('team_notice.id', $entityNotice['id'])->count() !== 1
        || (int) $customerEntity->notices()->where('team_notice.id', $entityNotice['id'])->count() !== 1) {
        throw new RuntimeException('LostSky recipient, Team sender, and Entity recipient relations must stay separate');
    }

    $request = static function (
        array $acting,
        int $entityId,
        int $teamId,
        array $query = []
    ): Request {
        $request = (new Request)->withGet($query);
        $request->acting_entity = $acting;
        $request->entity_id = $entityId;
        $request->team_id = $teamId;

        return $request;
    };
    $responseData = static fn ($response): array =>
        json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR)['data'];
    $controller = new \app\team\controller\Notice;
    $customerRequest = $request(
        ['type' => 'teamCustomer', 'id' => (int) $customer->id],
        (int) $customerEntity->id,
        (int) $team->id
    );
    $capabilities = $responseData($controller->capabilities($customerRequest));
    if ($capabilities !== ['can_read_team' => false, 'can_send' => false, 'default_scope' => 'entity']) {
        throw new RuntimeException('Entity without notice permissions must only receive its own Entity inbox capability');
    }
    if ($responseData($controller->index($customerRequest))['total'] !== 1) {
        throw new RuntimeException('Omitted scope must preserve the non-Team Entity inbox default');
    }
    $assertHttpStatus(
        fn () => $controller->index($request(
            ['type' => 'teamCustomer', 'id' => (int) $customer->id],
            (int) $customerEntity->id,
            (int) $team->id,
            ['scope' => 'team']
        )),
        403,
        'Team shared inbox requires team.notice.read'
    );
    $assertHttpStatus(
        fn () => $controller->index($request(
            ['type' => 'teamCustomer', 'id' => (int) $customer->id],
            (int) $customerEntity->id,
            (int) $team->id,
            ['scope' => 'invalid']
        )),
        422,
        'invalid notice scope is rejected'
    );

    $noticeRole = new TeamRole;
    $noticeRole->save([
        'team_id' => (int) $team->id,
        'role_key' => "notice-reader-{$suffix}",
        'name' => '通知查看者',
        'description' => '',
        'sort' => 0,
        'is_displayed' => 0,
    ]);
    $roleIds[] = (int) $noticeRole->id;
    foreach ([PermissionDictionary::TEAM_NOTICE_READ, PermissionDictionary::TEAM_NOTICE_SEND] as $permissionKey) {
        $permission = new TeamRolePermission;
        $permission->save([
            'team_id' => (int) $team->id,
            'role_id' => (int) $noticeRole->id,
            'permission_key' => $permissionKey,
        ]);
    }
    foreach ([$customerEntity, $teamEntity] as $entity) {
        $binding = new TeamEntityRole;
        $binding->save([
            'team_id' => (int) $team->id,
            'entity_id' => (int) $entity->id,
            'role_id' => (int) $noticeRole->id,
        ]);
    }

    $capabilities = $responseData($controller->capabilities($customerRequest));
    if ($capabilities !== ['can_read_team' => true, 'can_send' => true, 'default_scope' => 'entity']) {
        throw new RuntimeException('Permissioned non-Team Entity capabilities must expose both managed actions');
    }
    $teamScope = $responseData($controller->index($request(
        ['type' => 'teamCustomer', 'id' => (int) $customer->id],
        (int) $customerEntity->id,
        (int) $team->id,
        ['scope' => 'team']
    )));
    if ($teamScope['total'] !== 1 || (int) $teamScope['list'][0]['id'] !== (int) $teamNotice['id']) {
        throw new RuntimeException('Permissioned Entity must be able to read the Team shared inbox explicitly');
    }
    $teamActorCapabilities = $responseData($controller->capabilities($request(
        ['type' => 'team', 'id' => (int) $team->id],
        (int) $teamEntity->id,
        (int) $team->id
    )));
    if ($teamActorCapabilities['default_scope'] !== 'team') {
        throw new RuntimeException('Permissioned Team identity must default to the Team shared inbox');
    }
} finally {
    TeamNotice::destroy($noticeIds, true);
    if ($roleIds) {
        app()->db->name('team_entity_role')->whereIn('role_id', $roleIds)->delete();
        app()->db->name('team_role_permission')->whereIn('role_id', $roleIds)->delete();
        TeamRole::destroy($roleIds, true);
    }
    app()->db->name('team_entity_profile')
        ->whereIn('entity_id', [$teamEntity->id, $otherTeamEntity->id, $customerEntity->id])
        ->delete();
    Entity::destroy([$teamEntity->id, $otherTeamEntity->id, $customerEntity->id], true);
    TeamCustomer::destroy($customer->id, true);
    Team::destroy([$team->id, $otherTeam->id], true);
    User::destroy([$owner->id, $customerUser->id, $otherOwner->id], true);
}

fwrite(STDOUT, "Notice backend tests passed\n");
