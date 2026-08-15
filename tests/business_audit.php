<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use app\model\BusinessAuditEvent;
use app\model\Entity;
use app\model\Team;
use app\model\User;
use app\service\BusinessAudit;
use app\service\PermissionDictionary;
use app\service\TeamAudit;
use think\App;
use think\exception\HttpException;
use think\Request;

(new App(dirname(__DIR__)))->initialize();

$suffix = bin2hex(random_bytes(5));
$user = new User;
$user->save([
    'phone' => '19' . random_int(100000000, 999999999),
    'username' => "audit-{$suffix}",
    'password' => password_hash('test-only', PASSWORD_DEFAULT),
]);
$team = new Team;
$team->save([
    'slug' => "audit-{$suffix}",
    'user_id' => $user->id,
]);
$entity = app(\app\service\Entity::class)->claimTeam($team);
$request = new Request;
$request->team_id = (int) $team->id;
$request->entity_id = (int) $entity->id;
$request->authenticated_user_id = (int) $user->id;
$request->request_id = "audit-request-{$suffix}";
$eventIds = [];

try {
    $eventId = app(BusinessAudit::class)->record(
        $request,
        'transaction',
        'create',
        'transaction',
        42,
        ['source' => 'test']
    );
    $eventIds[] = $eventId;
    $event = BusinessAuditEvent::find($eventId);
    if (!$event
        || (int) $event->entity_id !== (int) $entity->id
        || (int) $event->authenticated_user_id !== (int) $user->id
        || (int) $event->team_id !== (int) $team->id
        || $event->application !== 'transaction'
        || $event->action !== 'create'
        || $event->resource_type !== 'transaction'
        || (int) $event->resource_id !== 42
        || $event->request_id !== "audit-request-{$suffix}"
        || ($event->context['source'] ?? null) !== 'test') {
        throw new RuntimeException('Business audit event did not preserve the actor and resource context');
    }

    $safeEventId = app(BusinessAudit::class)->record(
        $request,
        'team',
        'update',
        'member',
        43,
        [
            'changed' => false,
            'changed_fields' => ['status', 'email', 'profile_markdown'],
            'changes' => [
                'status' => ['before' => 'active', 'after' => 'active'],
                'email' => ['before' => 'old@example.com', 'after' => 'new@example.com'],
                ['field' => 'contact_wechat', 'before' => 'old-id', 'after' => 'new-id'],
            ],
            'token' => 'must-not-persist',
        ]
    );
    $eventIds[] = $safeEventId;
    $legacyEvent = new BusinessAuditEvent;
    $legacyEvent->save([
        'team_id' => $team->id,
        'entity_id' => $entity->id,
        'authenticated_user_id' => $user->id,
        'application' => 'team',
        'action' => 'legacyAction',
        'resource_type' => 'legacyResource',
        'request_id' => "legacy-{$suffix}",
        'context' => null,
    ]);
    $eventIds[] = (int) $legacyEvent->id;

    $otherTeam = new Team;
    $otherTeam->save(['slug' => "audit-other-{$suffix}", 'user_id' => $user->id]);
    $otherEntity = app(\app\service\Entity::class)->claimTeam($otherTeam);
    $otherRequest = new Request;
    $otherRequest->team_id = (int) $otherTeam->id;
    $otherRequest->entity_id = (int) $otherEntity->id;
    $otherRequest->authenticated_user_id = (int) $user->id;
    $otherEventId = app(BusinessAudit::class)->record(
        $otherRequest, 'team', 'update', 'member', 44
    );
    $eventIds[] = $otherEventId;

    $audit = app(TeamAudit::class);
    $page = $audit->list((int) $team->id, ['page' => 1, 'limit' => 20]);
    if ($page['total'] !== 3 || count($page['list']) !== 3) {
        throw new RuntimeException('Team audit list did not enforce team isolation or legacy compatibility');
    }
    foreach ($page['list'] as $summary) {
        if (array_key_exists('context', $summary)) {
            throw new RuntimeException('Team audit summary must not expose raw context');
        }
    }
    $filtered = $audit->list((int) $team->id, [
        'application' => 'team', 'action' => 'update', 'resource_type' => 'member',
        'actor_entity_id' => (int) $entity->id,
        'q' => "audit-{$suffix}", 'page' => 1, 'limit' => 1,
    ]);
    if ($filtered['total'] !== 1 || $filtered['limit'] !== 1) {
        throw new RuntimeException('Team audit filters or pagination are incorrect');
    }
    $detail = $audit->get((int) $team->id, $safeEventId);
    if (($detail['actor']['authenticated_user_id'] ?? 0) !== (int) $user->id
        || ($detail['actor']['entity_id'] ?? 0) !== (int) $entity->id
        || ($detail['context']['changed'] ?? null) !== false
        || ($detail['context']['token']['redacted'] ?? false) !== true
        || ($detail['context']['changes']['email']['redacted'] ?? false) !== true
        || ($detail['context']['changes'][0]['redacted'] ?? false) !== true
        || array_key_exists('before', $detail['context']['changes'][0] ?? [])
        || ($detail['context']['changes']['status']['before'] ?? null) !== 'active') {
        throw new RuntimeException('Team audit detail attribution or sensitive normalization is incorrect');
    }
    try {
        $audit->get((int) $team->id, $otherEventId);
        throw new RuntimeException('Cross-team audit detail should not be readable');
    } catch (HttpException $exception) {
        if ($exception->getStatusCode() !== 404) {
            throw $exception;
        }
    }

    if (!in_array(PermissionDictionary::TEAM_AUDIT_READ, PermissionDictionary::keys(), true)) {
        throw new RuntimeException('Team audit permission is missing from the permission dictionary');
    }
    $catalog = $audit->catalog();
    $catalogValues = static fn (string $key): array => array_column($catalog[$key] ?? [], 'value');
    foreach (['claim', 'accept', 'restart'] as $action) {
        if (!in_array($action, $catalogValues('actions'), true)) {
            throw new RuntimeException("Team audit catalog is missing action {$action}");
        }
    }
    foreach (['serviceAdjustment', 'entity_visibility'] as $resource) {
        if (!in_array($resource, $catalogValues('resource_types'), true)) {
            throw new RuntimeException("Team audit catalog is missing resource {$resource}");
        }
    }
    $auditController = file_get_contents(dirname(__DIR__) . '/app/team/controller/Audit.php');
    if (!str_contains($auditController, 'Permissions::TEAM_AUDIT_READ')) {
        throw new RuntimeException('Team audit controller is not protected by team.audit.read');
    }
    $permissionPatch = file_get_contents(dirname(__DIR__) . '/sql/patches/20260810_team_audit_permission.sql');
    if (!str_contains($permissionPatch, 'team.audit.read') || !str_contains($permissionPatch, "`role`.`role_key` = 'owner'")) {
        throw new RuntimeException('Existing owner permission patch is incomplete');
    }

    $columns = array_column(
        \think\facade\Db::query('SHOW COLUMNS FROM business_audit_event'),
        'Field'
    );
    foreach (['actor_type', 'member_id'] as $legacyColumn) {
        if (in_array($legacyColumn, $columns, true)) {
            throw new RuntimeException("Business audit must not persist {$legacyColumn}");
        }
    }

    foreach ([
        'app/transaction/controller/Transaction.php',
        'app/transaction/controller/Balance.php',
        'app/shop/controller/Product.php',
        'app/shop/controller/Order.php',
        'app/team/controller/File.php',
        'app/common/controller/Upload.php',
        'app/team/controller/Doc.php',
    ] as $controller) {
        $source = file_get_contents(dirname(__DIR__) . '/' . $controller);
        if (!str_contains($source, 'BusinessAudit::class')) {
            throw new RuntimeException("{$controller} is missing centralized business audit writes");
        }
    }
} finally {
    foreach ($eventIds as $cleanupEventId) {
        BusinessAuditEvent::destroy($cleanupEventId, true);
    }
    if (isset($otherEntity)) {
        app()->db->name('team_entity_profile')->where('entity_id', $otherEntity->id)->delete();
        Entity::destroy($otherEntity->id, true);
    }
    if (isset($otherTeam)) {
        Team::destroy($otherTeam->id, true);
    }
    app()->db->name('team_entity_profile')->where('entity_id', $entity->id)->delete();
    Entity::destroy($entity->id, true);
    Team::destroy($team->id, true);
    User::destroy($user->id, true);
}

fwrite(STDOUT, "Business audit tests passed\n");
