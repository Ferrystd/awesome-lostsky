<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use app\model\BusinessAuditEvent;
use app\model\Entity;
use app\model\Team;
use app\model\User;
use app\service\BusinessAudit;
use think\App;
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

try {
    $eventId = app(BusinessAudit::class)->record(
        $request,
        'transaction',
        'create',
        'transaction',
        42,
        ['source' => 'test']
    );
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
        'app/transaction/controller/Sender.php',
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
    if (isset($eventId)) {
        BusinessAuditEvent::destroy($eventId, true);
    }
    app()->db->name('team_entity_profile')->where('entity_id', $entity->id)->delete();
    Entity::destroy($entity->id, true);
    Team::destroy($team->id, true);
    User::destroy($user->id, true);
}

fwrite(STDOUT, "Business audit tests passed\n");
