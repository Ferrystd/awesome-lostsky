<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use app\enum\ServiceStatus;
use app\enum\TeamMemberStatus;
use app\enum\TransactionType;
use app\enum\RedemptionMode;
use app\model\BenefitPackage;
use app\model\BenefitPackageAbility;
use app\model\BenefitPackageService;
use app\model\RedemptionCampaign;
use app\model\RedemptionCode;
use app\model\Team;
use app\model\TeamAbility;
use app\model\TeamCustomer;
use app\model\TeamCustomerBalance;
use app\model\TeamEntityRole;
use app\model\TeamMember;
use app\model\TeamOrder;
use app\model\TeamRole;
use app\model\TeamRolePermission;
use app\model\TeamService;
use app\model\TeamServiceHandler;
use app\model\TeamServiceInstance;
use app\model\TeamTransaction;
use app\model\TeamAbilityGrant;
use app\model\User;
use app\service\Entity as EntityService;
use app\service\EntitlementManagement;
use app\service\Order;
use app\service\PermissionDictionary;
use app\service\Product;
use app\service\ProductRedemptionField;
use app\service\Redemption;
use app\service\RedemptionCrypto;
use app\service\ServiceRedemption;
use app\service\TransactionStats;
use think\App;
use think\exception\HttpException;

(new App(dirname(__DIR__)))->initialize();
$failures = [];
$assert = static function (bool $condition, string $case) use (&$failures): void { if (!$condition) $failures[] = $case; };
$throws = static function (callable $callback, int $status, string $case) use (&$failures): void {
    try { $callback(); $failures[] = "{$case}: expected {$status}"; }
    catch (HttpException $exception) { if ($exception->getStatusCode() !== $status) $failures[] = "{$case}: got {$exception->getStatusCode()}"; }
};

$db = app()->db;
$db->startTrans();
try {
    $suffix = bin2hex(random_bytes(5));
    $owner = new User; $owner->save(['phone' => '18' . random_int(100000000, 999999999), 'username' => "service-owner-{$suffix}", 'password' => 'x']);
    $workerUser = new User; $workerUser->save(['phone' => '17' . random_int(100000000, 999999999), 'username' => "service-worker-{$suffix}", 'password' => 'x']);
    $team = new Team; $team->save(['slug' => "service-{$suffix}", 'user_id' => $owner->id, 'is_banned' => 0, 'is_cancelled' => 0]);
    $teamEntity = app(EntityService::class)->claimTeam($team);
    $member = new TeamMember; $member->save(['team_id' => $team->id, 'user_id' => $workerUser->id, 'status' => TeamMemberStatus::Active]);
    $handlerEntity = app(EntityService::class)->claimMember((int) $team->id, (int) $member->id, "service-handler-{$suffix}");

    // Customer 是由任意 Entity 派生的子实体，资产不归属 User。
    $customer = new TeamCustomer; $customer->save(['team_id' => $team->id, 'user_id' => null, 'owner_entity_id' => $handlerEntity->id, 'is_blocked' => 0]);
    $customerEntity = app(EntityService::class)->claimCustomer((int) $customer->id, "service-customer-{$suffix}");
    $balance = new TeamCustomerBalance; $balance->save(['customer_id' => $customer->id, 'balance' => '200.00', 'recharged' => '200.00', 'spent' => '0.00']);

    $ability = new TeamAbility; $ability->save(['team_id' => $team->id, 'ability_key' => 'transaction', 'level' => 1, 'expire_time' => 0]);
    $service = new TeamService; $service->save([
        'team_id' => $team->id, 'name' => '十次咨询', 'default_total_price' => '0.00', 'default_cost' => '0.00',
        'default_handler_cut' => '0.00', 'default_sender_cut' => '0.00', 'default_cs_cut' => '0.00', 'default_team_cut' => '0.00', 'is_active' => 1,
    ]);
    $pool = new TeamServiceHandler; $pool->save(['service_id' => $service->id, 'entity_id' => $handlerEntity->id]);
    $package = new BenefitPackage; $package->save(['issuer_team_id' => $team->id, 'name' => '十次服务', 'is_active' => 1]);
    $item = new BenefitPackageService; $item->save(['package_id' => $package->id, 'service_id' => $service->id, 'quantity' => 10, 'valid_days' => 30]);
    $productId = app(Product::class)->create((int) $team->id, [
        'name' => '十次服务包', 'cover_image' => 'https://assets.lostsky.work/test.webp', 'price' => '100.01', 'cost' => '20.01',
        'handler_cut' => '10.01', 'sender_cut' => '0.00', 'cs_cut' => '0.00', 'kind' => 2, 'benefit_package_id' => $package->id,
    ]);
    $customerField = app(ProductRedemptionField::class)->create((int) $team->id, $productId, [
        'field_key' => 'appointment', 'name' => '预约时间', 'value_type' => 'datetime', 'input_type' => 'datetime',
        'fill_stage' => 'customer', 'is_customer_visible' => 1, 'is_required' => 1,
    ]);
    $managerField = app(ProductRedemptionField::class)->create((int) $team->id, $productId, [
        'field_key' => 'result', 'name' => '服务结果', 'value_type' => 'text', 'input_type' => 'textarea',
        'fill_stage' => 'manager', 'is_customer_visible' => 0, 'is_required' => 1,
    ]);
    app(Product::class)->get((int) $team->id, $productId);

    $orderId = app(Order::class)->create((int) $team->id, ['product_id' => $productId, 'customer_id' => $customer->id, 'quantity' => 1]);
    app(Order::class)->complete((int) $team->id, $orderId);
    app(Order::class)->complete((int) $team->id, $orderId); // 会拒绝，但不得重复交付
} catch (HttpException $exception) {
    // 第二次 complete 预期被拒绝，继续验证已交付数据。
    if ($exception->getStatusCode() !== 422) $failures[] = 'repeated completion returned unexpected status';
}

try {
    $instances = TeamServiceInstance::where('source_order_id', $orderId)->order('ordinal')->select();
    $serviceOrderDetail = app(Order::class)->get((int) $team->id, $orderId);
    $assert($serviceOrderDetail['handler'] === null, 'service package order detail supports an intentionally empty handler');
    $assert($instances->count() === 10, 'order delivers exactly ten independent instances');
    $assert((int) $instances[0]->holder_entity_id === (int) $customerEntity->id, 'asset belongs to customer root entity, not user or source owner');
    $assert(TeamServiceInstance::where('source_order_id', $orderId)->count() === 10, 'repeat completion does not duplicate delivery');
    $receipt = TeamTransaction::where('team_id', $team->id)->where('type', TransactionType::ServicePackageReceipt->value)->find();
    $assert($receipt !== null, 'purchase creates one receipt transaction');
    app(\app\service\Transaction::class)->get((int) $team->id, (int) $receipt->id);
    $sumRows = static fn (array $rows, string $field): int => (int) round(array_sum(array_map(static fn ($row): float => (float) $row->{$field}, $rows)) * 100);
    $sum = static fn (string $field): int => $sumRows($instances->all(), $field);
    $assert($sum('total_price') === 10001 && $sum('cost') === 2001 && $sum('handler_cut') === 1001, 'cent remainder distribution equals order snapshots');

    $instance = $instances[0];
    $customerDetail = app(ServiceRedemption::class)->customerGet((int) $team->id, (int) $customer->id, (int) $instance->id);
    $customerFieldIds = array_map(static fn (array $field): int => (int) $field['id'], $customerDetail['redemption_fields']);
    $assert(in_array($customerField, $customerFieldIds, true) && !in_array($managerField, $customerFieldIds, true), 'customer only receives visible redemption fields');
    $subjectHandler = ['type' => 'teamMember', 'id' => (int) $member->id];
    $subjectManager = ['type' => 'team', 'id' => (int) $team->id];
    $role = new TeamRole; $role->save(['team_id' => $team->id, 'role_key' => "service-manager-{$suffix}", 'name' => '服务管理']);
    $permission = new TeamRolePermission; $permission->save(['team_id' => $team->id, 'role_id' => $role->id, 'permission_key' => PermissionDictionary::SERVICE_REDEMPTION_MANAGE]);
    $assignment = new TeamEntityRole; $assignment->save(['team_id' => $team->id, 'entity_id' => $teamEntity->id, 'role_id' => $role->id]);

    $throws(fn () => app(ServiceRedemption::class)->start((int) $team->id, (int) $customer->id, (int) $instance->id, (int) $handlerEntity->id, '', [], (int) $customerEntity->id), 422, 'required customer field blocks start');
    app(ServiceRedemption::class)->start((int) $team->id, (int) $customer->id, (int) $instance->id, (int) $handlerEntity->id, '', [$customerField => time() + 3600], (int) $customerEntity->id);
    $assert(TeamServiceInstance::find($instance->id)->enumCase('status') === ServiceStatus::Processing, 'start enters processing immediately');
    app(ServiceRedemption::class)->requestCancel((int) $team->id, (int) $customer->id, (int) $instance->id, '时间冲突', (int) $customerEntity->id);
    app(ServiceRedemption::class)->approveCancel((int) $team->id, $subjectHandler, (int) $handlerEntity->id, (int) $instance->id);
    $returned = TeamServiceInstance::find($instance->id);
    $assert($returned->enumCase('status') === ServiceStatus::Unredeemed && $returned->handler_entity_id === null, 'handler approval returns to unredeemed and clears handler');

    app(ServiceRedemption::class)->start((int) $team->id, (int) $customer->id, (int) $instance->id, (int) $handlerEntity->id, '', [], (int) $customerEntity->id);
    $throws(fn () => app(ServiceRedemption::class)->complete((int) $team->id, $subjectManager, (int) $teamEntity->id, (int) $instance->id), 422, 'required manager field blocks completion');
    app(ServiceRedemption::class)->complete((int) $team->id, $subjectManager, (int) $teamEntity->id, (int) $instance->id, [$managerField => '已完成']);
    $completed = TeamServiceInstance::find($instance->id);
    $transaction = TeamTransaction::find((int) $completed->trans_id);
    $assert($completed->enumCase('status') === ServiceStatus::Redeemed, 'manager completes redemption');
    $assert($transaction?->enumCase('type') === TransactionType::ServiceRedemption && (float) $transaction->cash === 0.0 && (float) $transaction->service_credit > 0, 'redemption transaction records performance without cash');

    $cardCampaign = new RedemptionCampaign; $cardCampaign->save([
        'package_id' => $package->id, 'issuer_team_id' => $team->id, 'name' => '独立服务卡',
        'claim_group' => '', 'mode' => (int) RedemptionMode::Unique->value, 'per_target_limit' => 1, 'redeem_starts_at' => 0, 'redeem_ends_at' => 0, 'is_active' => 1,
    ]);
    $card = app(Redemption::class)->issue((int) $cardCampaign->id, (int) $customerEntity->id);
    $plainCard = app(RedemptionCrypto::class)->decrypt((string) $card->code_ciphertext);
    $claimId = app(Redemption::class)->claimForCustomer($plainCard, (int) $team->id, (int) $customer->id, (int) $customerEntity->id);
    $assert(TeamServiceInstance::where('source_claim_id', $claimId)->count() === 10, 'service card claim delivers exactly ten instances');
    $throws(fn () => app(Redemption::class)->claimForCustomer($plainCard, (int) $team->id, (int) $customer->id, (int) $customerEntity->id), 409, 'unique service card is globally single-use');

    $cardProductId = app(Product::class)->create((int) $team->id, [
        'name' => '十次服务卡', 'cover_image' => 'https://assets.lostsky.work/card.webp', 'price' => '50.03', 'cost' => '10.03',
        'handler_cut' => '5.03', 'sender_cut' => '0.00', 'cs_cut' => '0.00', 'kind' => 3,
        'redemption_campaign_id' => $cardCampaign->id,
    ]);
    $cardOrderId = app(Order::class)->create((int) $team->id, ['product_id' => $cardProductId, 'customer_id' => $customer->id, 'quantity' => 1]);
    app(Order::class)->complete((int) $team->id, $cardOrderId);
    app(\app\service\TeamCustomer::class)->order((int) $team->id, (int) $customer->id, $cardOrderId);
    app(\app\service\TeamCustomer::class)->orders((int) $team->id, (int) $customer->id, [], 1, 20);
    app(\app\service\TeamCustomer::class)->transactions((int) $team->id, (int) $customer->id, [], 1, 20);
    $purchasedCode = RedemptionCode::where('source_order_id', $cardOrderId)->find();
    $assert($purchasedCode !== null, 'card product delivers a held unique code');
    $managedCodes = app(EntitlementManagement::class)->codes((int) $team->id, (int) $cardCampaign->id, 1, 20);
    $assert(
        !array_key_exists('code_ciphertext', $managedCodes['list'][0] ?? [])
        && !array_key_exists('code_hash', $managedCodes['list'][0] ?? [])
        && !array_key_exists('code', $managedCodes['list'][0] ?? []),
        'management code list never exposes secrets'
    );
    $revealedCode = app(EntitlementManagement::class)->revealCode((int) $team->id, (int) $cardCampaign->id, (int) $purchasedCode->id);
    $assert(($revealedCode['code'] ?? '') === app(RedemptionCrypto::class)->decrypt((string) $purchasedCode->code_ciphertext), 'explicit management reveal returns the selected secret');
    $purchasedClaimId = app(Redemption::class)->claimForCustomer(
        app(RedemptionCrypto::class)->decrypt((string) $purchasedCode->code_ciphertext),
        (int) $team->id,
        (int) $customer->id,
        (int) $customerEntity->id
    );
    $purchasedInstances = TeamServiceInstance::where('source_claim_id', $purchasedClaimId)->order('ordinal')->select();
    $assert($purchasedInstances->count() === 10 && $sumRows($purchasedInstances->all(), 'total_price') === 5003, 'purchased service card splits its frozen order amount across all instances');
    $stats = app(TransactionStats::class)->summary((int) $team->id, 0, time() + 60);
    $assert((int) round((float) $stats['receipt_total'] * 100) === 15004, 'receipt basis counts package cash and prepaid exactly once');
    $assert((int) round((float) $stats['performance_total'] * 100) === 1001 && (int) round((float) $stats['total_cost'] * 100) === 201, 'performance basis excludes package receipt amount and cost');

    $abilityPackage = new BenefitPackage; $abilityPackage->save(['issuer_team_id' => null, 'name' => '免费一个月', 'is_active' => 1]);
    $abilityItem = new BenefitPackageAbility; $abilityItem->save(['package_id' => $abilityPackage->id, 'ability_key' => 'doc', 'level' => 1, 'duration_days' => 30]);
    $publicCampaign = new RedemptionCampaign; $publicCampaign->save([
        'package_id' => $abilityPackage->id, 'issuer_team_id' => null, 'name' => '团队免费月',
        'claim_group' => 'free-month-test', 'mode' => (int) RedemptionMode::Campaign->value, 'per_target_limit' => 1, 'redeem_starts_at' => 0, 'redeem_ends_at' => 0, 'is_active' => 1,
    ]);
    $publicCode = app(Redemption::class)->issue((int) $publicCampaign->id);
    $plainPublic = app(RedemptionCrypto::class)->decrypt((string) $publicCode->code_ciphertext);
    app(Redemption::class)->claimForTeam($plainPublic, (int) $team->id, (int) $teamEntity->id);
    $throws(fn () => app(Redemption::class)->claimForTeam($plainPublic, (int) $team->id, (int) $teamEntity->id), 409, 'campaign code is once per team');
    $secondOwner = new User; $secondOwner->save(['phone' => '16' . random_int(100000000, 999999999), 'username' => "service-second-{$suffix}", 'password' => 'x']);
    $secondTeam = new Team; $secondTeam->save(['slug' => "service-second-{$suffix}", 'user_id' => $secondOwner->id, 'is_banned' => 0, 'is_cancelled' => 0]);
    $secondTeamEntity = app(EntityService::class)->claimTeam($secondTeam);
    $throws(fn () => app(EntitlementManagement::class)->codes((int) $secondTeam->id, (int) $cardCampaign->id, 1, 20), 404, 'management endpoints isolate campaign codes by issuer team');
    app(Redemption::class)->claimForTeam($plainPublic, (int) $secondTeam->id, (int) $secondTeamEntity->id);
    $assert(TeamAbilityGrant::where('source_type', 'redemption')->where('ability_key', 'doc')->count() === 2, 'same public code grants different teams independently');

    $noLedger = $instances[1];
    app(ServiceRedemption::class)->start((int) $team->id, (int) $customer->id, (int) $noLedger->id, (int) $handlerEntity->id, '', [$customerField => time() + 7200], (int) $customerEntity->id);
    $ability->delete();
    app(ServiceRedemption::class)->complete((int) $team->id, $subjectManager, (int) $teamEntity->id, (int) $noLedger->id, [$managerField => '已完成']);
    $noLedger = TeamServiceInstance::find($noLedger->id);
    $assert($noLedger->enumCase('status') === ServiceStatus::Redeemed && $noLedger->trans_id === null, 'missing ability still completes and never creates a transaction');
} catch (Throwable $exception) {
    $failures[] = (string) $exception;
} finally {
    $db->rollback();
}

if ($failures) { fwrite(STDERR, implode(PHP_EOL, $failures) . PHP_EOL); exit(1); }
fwrite(STDOUT, "Service redemption tests passed.\n");
