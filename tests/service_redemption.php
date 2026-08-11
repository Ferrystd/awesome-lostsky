<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use app\enum\RedemptionMode;
use app\enum\ServiceAssignmentOfferStatus;
use app\enum\ServiceStatus;
use app\enum\TeamMemberStatus;
use app\enum\TransactionType;
use app\model\BenefitPackage;
use app\model\BenefitPackageAbility;
use app\model\BenefitPackageService;
use app\model\RedemptionCampaign;
use app\model\Team;
use app\model\TeamAbility;
use app\model\TeamAbilityGrant;
use app\model\TeamCustomer;
use app\model\TeamCustomerBalance;
use app\model\TeamEntityRole;
use app\model\TeamMember;
use app\model\TeamRole;
use app\model\TeamRolePermission;
use app\model\TeamService;
use app\model\TeamServiceAdjustment;
use app\model\TeamServiceAssignmentOffer;
use app\model\TeamServiceEntitlement;
use app\model\TeamServiceHandler;
use app\model\TeamServiceInstance;
use app\model\TeamTransaction;
use app\model\TeamVirtual;
use app\model\User;
use app\service\Entity as EntityService;
use app\service\EntitlementManagement;
use app\service\Order;
use app\service\PermissionDictionary;
use app\service\Product;
use app\service\ProductRedemptionField;
use app\service\Redemption;
use app\service\RedemptionCrypto;
use app\service\ServiceAdjustment;
use app\service\ServiceRedemption;
use app\service\TransactionStats;
use think\App;
use think\exception\HttpException;

(new App(dirname(__DIR__)))->initialize();
$failures = [];
$assert = static function (bool $condition, string $case) use (&$failures): void {
    if (!$condition) $failures[] = $case;
};
$throws = static function (callable $callback, int $status, string $case) use (&$failures): void {
    try {
        $callback();
        $failures[] = "{$case}: expected {$status}";
    } catch (HttpException $exception) {
        if ($exception->getStatusCode() !== $status) $failures[] = "{$case}: got {$exception->getStatusCode()}";
    }
};
$sumCents = static function (array $rows, string $field): int {
    return (int) round(array_sum(array_map(static fn ($row): float => (float) $row->{$field}, $rows)) * 100);
};

$db = app()->db;
$db->startTrans();
try {
    $suffix = bin2hex(random_bytes(5));
    $owner = new User;
    $owner->save(['phone' => '18' . random_int(100000000, 999999999), 'username' => "service-owner-{$suffix}", 'password' => 'x']);
    $workerA = new User;
    $workerA->save(['phone' => '17' . random_int(100000000, 999999999), 'username' => "service-a-{$suffix}", 'password' => 'x']);
    $workerB = new User;
    $workerB->save(['phone' => '16' . random_int(100000000, 999999999), 'username' => "service-b-{$suffix}", 'password' => 'x']);
    $team = new Team;
    $team->save(['slug' => "service-{$suffix}", 'user_id' => $owner->id, 'is_banned' => 0, 'is_cancelled' => 0]);
    $teamEntity = app(EntityService::class)->claimTeam($team);
    $virtual = new TeamVirtual;
    $virtual->save(['team_id' => $team->id, 'name' => '服务机器人', 'is_active' => 1]);
    $virtualEntity = app(EntityService::class)->claimVirtual($virtual, "service-virtual-{$suffix}");
    $memberA = new TeamMember;
    $memberA->save(['team_id' => $team->id, 'user_id' => $workerA->id, 'status' => TeamMemberStatus::Active]);
    $memberB = new TeamMember;
    $memberB->save(['team_id' => $team->id, 'user_id' => $workerB->id, 'status' => TeamMemberStatus::Active]);
    $handlerA = app(EntityService::class)->claimMember((int) $team->id, (int) $memberA->id, "service-handler-a-{$suffix}");
    $handlerB = app(EntityService::class)->claimMember((int) $team->id, (int) $memberB->id, "service-handler-b-{$suffix}");

    // Customer 可由任意 Entity 派生；权益只归 Customer 根 Entity，不归 User。
    $customer = new TeamCustomer;
    $customer->save(['team_id' => $team->id, 'user_id' => null, 'owner_entity_id' => $handlerA->id, 'is_blocked' => 0]);
    $customerEntity = app(EntityService::class)->claimCustomer((int) $customer->id, "service-customer-{$suffix}");
    $balance = new TeamCustomerBalance;
    $balance->save(['customer_id' => $customer->id, 'balance' => '1000.00', 'recharged' => '1000.00', 'spent' => '0.00']);
    $ability = new TeamAbility;
    $ability->save(['team_id' => $team->id, 'ability_key' => 'transaction', 'level' => 1, 'expire_time' => 0]);

    $role = new TeamRole;
    $role->save(['team_id' => $team->id, 'role_key' => "service-manager-{$suffix}", 'name' => '服务管理']);
    $permission = new TeamRolePermission;
    $permission->save(['team_id' => $team->id, 'role_id' => $role->id, 'permission_key' => PermissionDictionary::SERVICE_REDEMPTION_MANAGE]);
    $assignment = new TeamEntityRole;
    $assignment->save(['team_id' => $team->id, 'entity_id' => $teamEntity->id, 'role_id' => $role->id]);
    $subjectManager = ['type' => 'team', 'id' => (int) $team->id];
    $subjectHandlerA = ['type' => 'teamMember', 'id' => (int) $memberA->id];

    // 一份 3 小时权益不预拆实例；客户可按 0.5 小时步长分给不同接单人。
    $service = new TeamService;
    $service->save([
        'team_id' => $team->id,
        'name' => '计时服务',
        'unit_name' => '小时',
        'quantity_scale' => 1,
        'quantity_step' => '0.5000',
        'default_total_price' => '0.00',
        'default_cost' => '0.00',
        'default_handler_cut' => '0.00',
        'default_sender_cut' => '0.00',
        'default_cs_cut' => '0.00',
        'default_team_cut' => '0.00',
        'is_active' => 1,
    ]);
    foreach ([$handlerA, $handlerB, $teamEntity, $virtualEntity] as $handler) {
        $pool = new TeamServiceHandler;
        $pool->save(['service_id' => $service->id, 'entity_id' => $handler->id]);
    }
    $poolIds = array_map('intval', array_column(app(EntitlementManagement::class)->serviceHandlers((int) $team->id, (int) $service->id), 'entity_id'));
    $assert(in_array((int) $teamEntity->id, $poolIds, true) && in_array((int) $virtualEntity->id, $poolIds, true), 'team, team member and team virtual entities can enter the explicit handler pool');
    $defaultPackageId = app(EntitlementManagement::class)->savePackage((int) $team->id, null, [
        'name' => '默认规则验证',
        'pricing_mode' => 2,
        'services' => [[
            'service_id' => (int) $service->id,
            'quantity' => '1.0',
            'unit_price' => '10.00',
            'unit_cost' => '1.00',
        ]],
    ]);
    $defaultItem = BenefitPackageService::where('package_id', $defaultPackageId)->find();
    $assert(
        (int) $defaultItem->valid_days === 30
        && (int) $defaultItem->handler_rate_bp === 8000
        && (int) $defaultItem->sender_rate_bp === 1500
        && (int) $defaultItem->cs_rate_bp === 0,
        'team defaults apply to API-created package items when no override is supplied'
    );
    $packageId = app(EntitlementManagement::class)->savePackage((int) $team->id, null, [
        'name' => '三小时服务',
        'pricing_mode' => 2,
        'services' => [[
            'service_id' => (int) $service->id,
            'quantity' => '3.0',
            'valid_days' => 30,
            'unit_price' => '100.00',
            'unit_cost' => '20.00',
            'distribution_mode' => 1,
            'unit_handler_cut' => '30.00',
            'unit_sender_cut' => '0.00',
            'unit_cs_cut' => '0.00',
        ]],
    ]);
    $productId = app(Product::class)->create((int) $team->id, [
        'name' => '三小时服务',
        'cover_image' => 'https://assets.lostsky.work/timed-service.webp',
        'price' => '0.01',
        'cost' => '0.00',
        'handler_cut' => '0.00',
        'sender_cut' => '0.00',
        'cs_cut' => '0.00',
        'kind' => 2,
        'benefit_package_id' => $packageId,
    ]);
    $customerField = app(ProductRedemptionField::class)->create((int) $team->id, $productId, [
        'field_key' => 'contact',
        'name' => '联系方式',
        'value_type' => 'string',
        'input_type' => 'text',
        'fill_stage' => 'customer',
        'is_customer_visible' => 1,
        'is_required' => 1,
    ]);
    $managerField = app(ProductRedemptionField::class)->create((int) $team->id, $productId, [
        'field_key' => 'result',
        'name' => '履约结果',
        'value_type' => 'text',
        'input_type' => 'textarea',
        'fill_stage' => 'manager',
        'is_customer_visible' => 0,
        'is_required' => 1,
    ]);
    $orderId = app(Order::class)->create((int) $team->id, [
        'product_id' => $productId,
        'customer_id' => $customer->id,
        'quantity' => 1,
    ]);
    app(Order::class)->complete((int) $team->id, $orderId);
    $throws(fn () => app(Order::class)->complete((int) $team->id, $orderId), 422, 'repeat completion is rejected');

    $entitlements = TeamServiceEntitlement::where('source_order_id', $orderId)->select();
    $assert($entitlements->count() === 1, 'order delivers one measurable entitlement');
    $entitlement = $entitlements[0];
    $assert((string) $entitlement->granted_quantity === '3.0000', 'entitlement freezes three hours');
    $assert((int) $entitlement->holder_entity_id === (int) $customerEntity->id, 'entitlement belongs to customer root entity');
    $assert(TeamServiceInstance::where('entitlement_id', $entitlement->id)->count() === 0, 'no slices are created before redemption starts');
    $detail = app(ServiceRedemption::class)->customerGet((int) $team->id, (int) $customer->id, (int) $entitlement->id);
    $visibleIds = array_map(static fn (array $field): int => (int) $field['id'], $detail['redemption_fields']);
    $assert(in_array($customerField, $visibleIds, true) && !in_array($managerField, $visibleIds, true), 'customer receives only visible redemption fields');

    $rejectedOfferId = app(ServiceRedemption::class)->createOffer(
        (int) $team->id, (int) $customer->id, (int) $entitlement->id, '0.5',
        (int) $handlerB->id, '', [$customerField => 'reject-me'], (int) $customerEntity->id, 'offer-reject'
    );
    app(ServiceRedemption::class)->rejectOffer((int) $team->id, (int) $handlerB->id, $rejectedOfferId, '暂时无法接单');
    $assert(TeamServiceAssignmentOffer::find($rejectedOfferId)->enumCase('status') === ServiceAssignmentOfferStatus::Rejected, 'rejected offer keeps history without a slice');
    $assert((string) TeamServiceEntitlement::find($entitlement->id)->reserved_quantity === '0.0000', 'rejecting an offer releases reserved quantity');

    $removedOfferId = app(ServiceRedemption::class)->createOffer(
        (int) $team->id, (int) $customer->id, (int) $entitlement->id, '0.5',
        (int) $handlerB->id, '', [$customerField => 'pool-change'], (int) $customerEntity->id, 'offer-pool-removal'
    );
    app(EntitlementManagement::class)->saveServiceHandlers((int) $team->id, (int) $service->id, [(int) $handlerA->id]);
    $assert(TeamServiceAssignmentOffer::find($removedOfferId)->enumCase('status') === ServiceAssignmentOfferStatus::Expired, 'removing a handler invalidates its pending offers');
    $assert((string) TeamServiceEntitlement::find($entitlement->id)->reserved_quantity === '0.0000', 'pool removal releases pending offer quantity');
    app(EntitlementManagement::class)->saveServiceHandlers((int) $team->id, (int) $service->id, [(int) $handlerA->id, (int) $handlerB->id, (int) $teamEntity->id, (int) $virtualEntity->id]);

    $throws(fn () => app(ServiceRedemption::class)->createOffer(
        (int) $team->id,
        (int) $customer->id,
        (int) $entitlement->id,
        '0.5',
        (int) $handlerA->id,
        '',
        [],
        (int) $customerEntity->id,
        'offer-required-field'
    ), 422, 'required customer field blocks assignment offer');
    $offerAId = app(ServiceRedemption::class)->createOffer(
        (int) $team->id,
        (int) $customer->id,
        (int) $entitlement->id,
        '0.5',
        (int) $handlerA->id,
        '',
        [$customerField => 'wx-a'],
        (int) $customerEntity->id,
        'offer-a'
    );
    $sameOfferAId = app(ServiceRedemption::class)->createOffer(
        (int) $team->id,
        (int) $customer->id,
        (int) $entitlement->id,
        '0.5',
        (int) $handlerA->id,
        '',
        [$customerField => 'wx-a'],
        (int) $customerEntity->id,
        'offer-a'
    );
    $assert($sameOfferAId === $offerAId, 'assignment offer creation is idempotent');
    $assert(TeamServiceInstance::where('entitlement_id', $entitlement->id)->count() === 0, 'pending assignment offer does not create a redemption slice');
    $assert((string) TeamServiceEntitlement::find($entitlement->id)->reserved_quantity === '0.5000', 'pending assignment offer reserves requested quantity');
    $offerDetail = app(ServiceRedemption::class)->assignmentOffer((int) $team->id, (int) $handlerA->id, $offerAId);
    $assert(($offerDetail['redemption_fields'][0]['value'] ?? null) === 'wx-a', 'target handler sees full customer fields before accepting');
    $sliceAId = app(ServiceRedemption::class)->acceptOffer((int) $team->id, (int) $handlerA->id, $offerAId);
    $assert(app(ServiceRedemption::class)->acceptOffer((int) $team->id, (int) $handlerA->id, $offerAId) === $sliceAId, 'accepting the same offer is idempotent');
    $assert(TeamServiceInstance::find($sliceAId)->enumCase('status') === ServiceStatus::Processing, 'accepting an offer creates a processing slice');
    $sliceBId = app(ServiceRedemption::class)->start(
        (int) $team->id,
        (int) $customer->id,
        (int) $entitlement->id,
        '2.5',
        0,
        '',
        [$customerField => 'wx-b'],
        (int) $customerEntity->id
    );
    $openSlice = TeamServiceInstance::find($sliceBId);
    $assert($openSlice->handler_entity_id === null && $openSlice->enumCase('status') === ServiceStatus::Processing, 'open dispatch creates an unassigned processing slice');
    $openDetail = app(ServiceRedemption::class)->claimableGet((int) $team->id, (int) $handlerB->id, $sliceBId);
    $assert(($openDetail['redemption_fields'][0]['value']['value_string'] ?? $openDetail['redemption_fields'][0]['value'] ?? null) === 'wx-b', 'pool handler sees all fields before claiming open task');
    app(ServiceRedemption::class)->claim((int) $team->id, (int) $handlerB->id, $sliceBId);
    app(ServiceRedemption::class)->claim((int) $team->id, (int) $handlerB->id, $sliceBId);
    $throws(fn () => app(ServiceRedemption::class)->claim((int) $team->id, (int) $handlerA->id, $sliceBId), 409, 'only one handler can claim an open task');
    app(ServiceRedemption::class)->returnToPool((int) $team->id, (int) $handlerB->id, $sliceBId, '交接给其他同事');
    app(ServiceRedemption::class)->returnToPool((int) $team->id, (int) $handlerB->id, $sliceBId, '交接给其他同事');
    $assert(TeamServiceInstance::find($sliceBId)->handler_entity_id === null, 'handler can return an unfinished task without changing processing status');
    app(ServiceRedemption::class)->claim((int) $team->id, (int) $handlerA->id, $sliceBId);
    $entitlement = TeamServiceEntitlement::find($entitlement->id);
    $assert((string) $entitlement->available_quantity === '0.0000', 'parallel slices reserve the complete entitlement');
    $throws(fn () => app(ServiceRedemption::class)->start(
        (int) $team->id,
        (int) $customer->id,
        (int) $entitlement->id,
        '0.5',
        0,
        '',
        [$customerField => 'over'],
        (int) $customerEntity->id
    ), 409, 'row-locked reservation rejects oversubscription');
    $slices = TeamServiceInstance::where('entitlement_id', $entitlement->id)->select()->all();
    $assert($sumCents($slices, 'total_price') === 30000 && $sumCents($slices, 'cost') === 6000, 'slice money sums exactly to entitlement totals');
    $assert($sumCents($slices, 'handler_cut') === 9000 && $sumCents($slices, 'team_cut') === 15000, 'slice distributions remain exactly balanced');

    // 取消释放数量；旧联系方式保留，Customer 从权益重新发起邀请。
    app(ServiceRedemption::class)->requestCancel((int) $team->id, (int) $customer->id, $sliceAId, '未通过', (int) $customerEntity->id);
    app(ServiceRedemption::class)->approveCancel((int) $team->id, $subjectHandlerA, (int) $handlerA->id, $sliceAId);
    $cancelled = TeamServiceInstance::find($sliceAId);
    $entitlement = TeamServiceEntitlement::find($entitlement->id);
    $assert($cancelled->enumCase('status') === ServiceStatus::Unredeemed && $cancelled->handler_entity_id === null, 'approved cancellation returns slice to unredeemed');
    $assert((string) $entitlement->available_quantity === '0.5000', 'approved cancellation releases reserved quantity');
    $replacementOfferId = app(ServiceRedemption::class)->createOffer(
        (int) $team->id,
        (int) $customer->id,
        (int) $entitlement->id,
        '0.5',
        (int) $handlerA->id,
        '',
        [$customerField => 'wx-a-next'],
        (int) $customerEntity->id,
        'offer-a-replacement'
    );
    $replacementSliceAId = app(ServiceRedemption::class)->acceptOffer((int) $team->id, (int) $handlerA->id, $replacementOfferId);
    $assert(TeamServiceInstance::find($sliceAId)->enumCase('status') === ServiceStatus::Unredeemed, 'cancelled historical slice remains unchanged');
    $assert(TeamServiceInstance::find($replacementSliceAId)->enumCase('status') === ServiceStatus::Processing, 'new invitation creates a fresh replacement slice');

    // 加价先由管理方提出，客户单独确认并扣款，完成时再形成加价业绩。
    $beforeBalance = (float) TeamCustomerBalance::where('customer_id', $customer->id)->value('balance');
    $adjustmentId = app(ServiceAdjustment::class)->create(
        (int) $team->id,
        $subjectManager,
        (int) $teamEntity->id,
        $sliceBId,
        [
            'name' => '额外时段费用',
            'quantity' => '0.5',
            'unit_price' => '40.00',
            'cost' => '2.00',
            'handler_cut' => '5.00',
        ]
    );
    app(ServiceAdjustment::class)->accept(
        (int) $team->id,
        (int) $customer->id,
        (int) $customerEntity->id,
        $sliceBId,
        $adjustmentId
    );
    $adjustment = TeamServiceAdjustment::find($adjustmentId);
    $afterBalance = (float) TeamCustomerBalance::where('customer_id', $customer->id)->value('balance');
    $assert(abs(($beforeBalance - $afterBalance) - 20.0) < 0.001, 'accepted adjustment is charged separately');
    $assert(
        TeamTransaction::find((int) $adjustment->receipt_trans_id)?->enumCase('type') === TransactionType::ServiceAdjustmentReceipt,
        'accepted adjustment creates a separate receipt transaction'
    );
    $throws(fn () => app(ServiceRedemption::class)->complete(
        (int) $team->id,
        $subjectManager,
        (int) $teamEntity->id,
        $sliceBId
    ), 422, 'required manager field blocks completion');
    app(ServiceRedemption::class)->complete(
        (int) $team->id,
        $subjectManager,
        (int) $teamEntity->id,
        $sliceBId,
        [$managerField => '完成 2.5 小时']
    );
    $adjustment = TeamServiceAdjustment::find($adjustmentId);
    $assert(
        TeamTransaction::find((int) $adjustment->performance_trans_id)?->enumCase('type') === TransactionType::ServiceAdjustmentPerformance,
        'completion creates separate adjustment performance'
    );
    app(ServiceRedemption::class)->complete(
        (int) $team->id,
        $subjectManager,
        (int) $teamEntity->id,
        $replacementSliceAId,
        [$managerField => '完成 0.5 小时']
    );
    $entitlement = TeamServiceEntitlement::find($entitlement->id);
    $assert((string) $entitlement->consumed_quantity === '3.0000' && (string) $entitlement->reserved_quantity === '0.0000', 'completion moves all reserved quantity to consumed');
    $stats = app(TransactionStats::class)->summary((int) $team->id, 0, time() + 60);
    $assert((int) round((float) $stats['receipt_total'] * 100) === 32000, 'package and adjustment receipts are counted once as actual receipts');
    $assert((int) round((float) $stats['performance_total'] * 100) === 32000, 'base and adjustment performance exclude their receipt records');
    $assert((int) $stats['service_adjustment_receipt_count'] === 1 && (int) $stats['service_adjustment_performance_count'] === 1, 'adjustment receipt and performance counts stay separate');

    // 一个套餐可含两个计量权益，各自保留不同价格与分成规则。
    $recruitA = new TeamService;
    $recruitA->save([
        'team_id' => $team->id, 'name' => 'A类服务', 'unit_name' => '人', 'quantity_scale' => 0, 'quantity_step' => '1.0000',
        'default_total_price' => '0.00', 'default_cost' => '0.00', 'default_handler_cut' => '0.00',
        'default_sender_cut' => '0.00', 'default_cs_cut' => '0.00', 'default_team_cut' => '0.00', 'is_active' => 1,
    ]);
    $recruitB = new TeamService;
    $recruitB->save([
        'team_id' => $team->id, 'name' => 'B类服务', 'unit_name' => '人', 'quantity_scale' => 0, 'quantity_step' => '1.0000',
        'default_total_price' => '0.00', 'default_cost' => '0.00', 'default_handler_cut' => '0.00',
        'default_sender_cut' => '0.00', 'default_cs_cut' => '0.00', 'default_team_cut' => '0.00', 'is_active' => 1,
    ]);
    $mixedPackageId = app(EntitlementManagement::class)->savePackage((int) $team->id, null, [
        'name' => '混合计量套餐',
        'pricing_mode' => 2,
        'services' => [
            [
                'service_id' => (int) $recruitA->id, 'quantity' => 20, 'valid_days' => 30,
                'unit_price' => '5.00', 'unit_cost' => '1.00', 'distribution_mode' => 1,
                'unit_handler_cut' => '1.50', 'unit_sender_cut' => '0.25', 'unit_cs_cut' => '0.00',
            ],
            [
                'service_id' => (int) $recruitB->id, 'quantity' => 10, 'valid_days' => 30,
                'unit_price' => '8.00', 'unit_cost' => '2.00', 'distribution_mode' => 2,
                'handler_rate_bp' => 2500, 'sender_rate_bp' => 1000, 'cs_rate_bp' => 0,
            ],
        ],
    ]);
    $mixedProductId = app(Product::class)->create((int) $team->id, [
        'name' => '混合计量订单', 'cover_image' => 'https://assets.lostsky.work/mixed.webp',
        'price' => '0.01', 'cost' => '0.00', 'handler_cut' => '0.00', 'sender_cut' => '0.00', 'cs_cut' => '0.00',
        'kind' => 2, 'benefit_package_id' => $mixedPackageId,
    ]);
    $mixedOrderId = app(Order::class)->create((int) $team->id, [
        'product_id' => $mixedProductId,
        'customer_id' => $customer->id,
        'quantity' => 1,
        'sender_entity_id' => (int) $handlerA->id,
    ]);
    app(Order::class)->complete((int) $team->id, $mixedOrderId);
    $mixed = TeamServiceEntitlement::where('source_order_id', $mixedOrderId)->order('ordinal')->select()->all();
    $assert(count($mixed) === 2, 'mixed package delivers one entitlement per configured service row');
    $assert((string) $mixed[0]->granted_quantity === '20.0000' && (string) $mixed[1]->granted_quantity === '10.0000', 'mixed entitlements preserve independent quantities');
    $assert($sumCents([$mixed[0]], 'total_price') === 10000 && $sumCents([$mixed[1]], 'total_price') === 8000, 'mixed entitlements preserve independent pricing');
    $assert($sumCents([$mixed[0]], 'handler_cut') === 3000 && $sumCents([$mixed[1]], 'handler_cut') === 1500, 'mixed entitlements preserve fixed and percentage distributions');
    $mixedSliceA = app(ServiceRedemption::class)->start(
        (int) $team->id, (int) $customer->id, (int) $mixed[0]->id, '1', 0, '', [], (int) $customerEntity->id
    );
    $mixedSliceB = app(ServiceRedemption::class)->start(
        (int) $team->id, (int) $customer->id, (int) $mixed[1]->id, '1', 0, '', [], (int) $customerEntity->id
    );
    $assert($mixedSliceA !== $mixedSliceB, 'different entitlements from the same order may each create ordinal-one slices');

    // 服务卡密也交付计量权益，不按数量预建履约切片。
    $package = BenefitPackage::find($packageId);
    $cardPackageItem = BenefitPackageService::where('package_id', $packageId)->find();
    $cardPackageItem->unit_sender_cut = '10.00';
    $cardPackageItem->save();
    $customer->assignee_entity_id = (int) $handlerA->id;
    $customer->save();
    $cardCampaign = new RedemptionCampaign;
    $cardCampaign->save([
        'package_id' => $package->id,
        'issuer_team_id' => $team->id,
        'name' => '独立服务卡',
        'claim_group' => '',
        'mode' => (int) RedemptionMode::Unique->value,
        'per_target_limit' => 1,
        'redeem_starts_at' => 0,
        'redeem_ends_at' => 0,
        'is_active' => 1,
    ]);
    $card = app(Redemption::class)->issue((int) $cardCampaign->id, (int) $customerEntity->id);
    $plainCard = app(RedemptionCrypto::class)->decrypt((string) $card->code_ciphertext);
    $claimId = app(Redemption::class)->claimForCustomer($plainCard, (int) $team->id, (int) $customer->id, (int) $customerEntity->id);
    $assert(TeamServiceEntitlement::where('source_claim_id', $claimId)->count() === 1, 'service card delivers one measurable entitlement');
    $claimedEntitlement = TeamServiceEntitlement::where('source_claim_id', $claimId)->find();
    $assert(
        (int) $claimedEntitlement->sender_entity_id === (int) $handlerA->id
            && (string) $claimedEntitlement->sender_cut === '30.00'
            && (string) $claimedEntitlement->team_cut === '120.00',
        'manual service card preserves the current customer assignee sender share'
    );
    $assert(TeamServiceInstance::where('source_claim_id', $claimId)->count() === 0, 'service card does not pre-create slices');
    $throws(fn () => app(Redemption::class)->claimForCustomer($plainCard, (int) $team->id, (int) $customer->id, (int) $customerEntity->id), 409, 'unique card remains globally single-use');

    // 公共 Ability 活动码仍按 claim_group 对 Team 限一次，不同 Team 可复用同一码。
    $abilityPackage = new BenefitPackage;
    $abilityPackage->save(['issuer_team_id' => null, 'name' => '免费一个月', 'is_active' => 1]);
    $abilityItem = new BenefitPackageAbility;
    $abilityItem->save(['package_id' => $abilityPackage->id, 'ability_key' => 'doc', 'level' => 1, 'duration_days' => 30]);
    $publicCampaign = new RedemptionCampaign;
    $publicCampaign->save([
        'package_id' => $abilityPackage->id,
        'issuer_team_id' => null,
        'name' => '团队免费月',
        'claim_group' => 'free-month-test',
        'mode' => (int) RedemptionMode::Campaign->value,
        'per_target_limit' => 1,
        'redeem_starts_at' => 0,
        'redeem_ends_at' => 0,
        'is_active' => 1,
    ]);
    $publicCode = app(Redemption::class)->issue((int) $publicCampaign->id);
    $plainPublic = app(RedemptionCrypto::class)->decrypt((string) $publicCode->code_ciphertext);
    app(Redemption::class)->claimForTeam($plainPublic, (int) $team->id, (int) $teamEntity->id);
    $throws(fn () => app(Redemption::class)->claimForTeam($plainPublic, (int) $team->id, (int) $teamEntity->id), 409, 'campaign code is once per team');
    $secondOwner = new User;
    $secondOwner->save(['phone' => '15' . random_int(100000000, 999999999), 'username' => "service-second-{$suffix}", 'password' => 'x']);
    $secondTeam = new Team;
    $secondTeam->save(['slug' => "service-second-{$suffix}", 'user_id' => $secondOwner->id, 'is_banned' => 0, 'is_cancelled' => 0]);
    $secondTeamEntity = app(EntityService::class)->claimTeam($secondTeam);
    app(Redemption::class)->claimForTeam($plainPublic, (int) $secondTeam->id, (int) $secondTeamEntity->id);
    $assert(TeamAbilityGrant::where('source_type', 'redemption')->where('ability_key', 'doc')->count() === 2, 'same public code grants different teams independently');

    // Ability 失效后仍可完成服务，但不生成或补建流水。
    $cardEntitlement = TeamServiceEntitlement::where('source_claim_id', $claimId)->find();
    $noLedgerId = app(ServiceRedemption::class)->start(
        (int) $team->id,
        (int) $customer->id,
        (int) $cardEntitlement->id,
        '0.5',
        0,
        '',
        [],
        (int) $customerEntity->id
    );
    $openSlice = TeamServiceInstance::find($noLedgerId);
    $claimable = app(ServiceRedemption::class)->claimable((int) $team->id, (int) $handlerA->id, 1, 20);
    $assert($openSlice->enumCase('status') === ServiceStatus::Processing && $openSlice->handler_entity_id === null, 'open dispatch enters processing without binding a handler');
    $assert(in_array($noLedgerId, array_map(static fn (array $row): int => (int) $row['id'], $claimable['list']), true), 'eligible handler sees the open task');
    app(ServiceRedemption::class)->claim((int) $team->id, (int) $handlerA->id, $noLedgerId);
    $assert((int) TeamServiceInstance::find($noLedgerId)->handler_entity_id === (int) $handlerA->id, 'eligible handler can atomically claim an open task');
    $throws(fn () => app(ServiceRedemption::class)->claim((int) $team->id, (int) $handlerB->id, $noLedgerId), 409, 'claimed task cannot be claimed twice');
    $ability->delete();
    $throws(fn () => app(ServiceRedemption::class)->start(
        (int) $team->id, (int) $customer->id, (int) $cardEntitlement->id,
        '0.5', 0, '', [], (int) $customerEntity->id
    ), 422, 'missing transaction ability blocks new open dispatch');
    $throws(fn () => app(ServiceRedemption::class)->createOffer(
        (int) $team->id, (int) $customer->id, (int) $cardEntitlement->id,
        '0.5', (int) $handlerA->id, '', [], (int) $customerEntity->id, 'ability-missing'
    ), 422, 'missing transaction ability blocks new assignment offer');
    $serviceController = file_get_contents(dirname(__DIR__) . '/app/transaction/controller/Service.php');
    $assert(
        str_contains((string) $serviceController, "'Ability:transaction' => ['except' => ['complete']]") ,
        'transaction service completion remains reachable after ability expiry'
    );
    app(ServiceRedemption::class)->complete((int) $team->id, $subjectManager, (int) $teamEntity->id, $noLedgerId);
    $noLedger = TeamServiceInstance::find($noLedgerId);
    $assert($noLedger->enumCase('status') === ServiceStatus::Redeemed && $noLedger->trans_id === null, 'missing ability completes without creating transaction');
} catch (Throwable $exception) {
    $failures[] = (string) $exception;
} finally {
    $db->rollback();
}

if ($failures) {
    fwrite(STDERR, implode(PHP_EOL, $failures) . PHP_EOL);
    exit(1);
}
fwrite(STDOUT, "Service redemption tests passed.\n");
