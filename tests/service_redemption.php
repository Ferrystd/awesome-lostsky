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
use app\model\TeamCustomerSender;
use app\model\TeamEntityRole;
use app\model\TeamMember;
use app\model\TeamRole;
use app\model\TeamRolePermission;
use app\model\TeamService;
use app\model\TeamServiceAdjustment;
use app\model\TeamServiceAssignmentOffer;
use app\model\TeamServiceEntitlement;
use app\model\TeamServiceEvent;
use app\model\TeamServiceHandler;
use app\model\TeamServiceInstance;
use app\model\TeamServiceRedemptionField;
use app\model\TeamTransaction;
use app\model\TeamOrder;
use app\model\TeamProduct;
use app\model\TeamVirtual;
use app\model\User;
use app\service\Entity as EntityService;
use app\service\EntitlementManagement;
use app\service\EntitlementSelfManagement;
use app\service\ManualEntitlementGrant;
use app\service\Order;
use app\service\PermissionDictionary;
use app\service\Product;
use app\service\ServiceRedemptionField;
use app\service\Redemption;
use app\service\RedemptionCrypto;
use app\service\ServiceAdjustment;
use app\service\ServiceQuantity;
use app\service\ServiceRedemption;
use app\service\TeamSetting;
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
    $foreignTeam = new Team;
    $foreignTeam->save(['slug' => "service-foreign-{$suffix}", 'user_id' => $owner->id, 'is_banned' => 0, 'is_cancelled' => 0]);
    $foreignTeamEntity = app(EntityService::class)->claimTeam($foreignTeam);
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

    $quantityRules = app(ServiceQuantity::class);
    foreach (['1' => 0, '0.5' => 1, '0.25' => 2, '0.0001' => 4] as $step => $expectedScale) {
        $assert(
            $quantityRules->scaleForStep($step) === $expectedScale,
            "service quantity scale is derived from step {$step}"
        );
    }
    $assert(
        $quantityRules->normalize('0.75', '0.25') === '0.7500',
        'quarter-unit service quantity accepts exact step multiples'
    );
    foreach (['0', '-0.5', '0.00001'] as $invalidStep) {
        $throws(
            fn () => $quantityRules->scaleForStep($invalidStep),
            422,
            "service quantity rejects invalid derived step {$invalidStep}"
        );
    }
    $throws(
        fn () => $quantityRules->normalize('0.3', '0.25'),
        422,
        'service quantity still rejects values that are not step multiples'
    );
    $serviceDefaults = app(TeamSetting::class)->internalTyped((int) $team->id, 'service');
    $assert(
        !array_key_exists('default_quantity_scale', $serviceDefaults)
            && !array_key_exists('assignment_offer_timeout_minutes', $serviceDefaults)
            && array_key_exists('default_auto_complete_after_minutes', $serviceDefaults)
            && $serviceDefaults['default_auto_complete_after_minutes'] === null,
        'service settings no longer expose configurable quantity scale or assignment timeout'
    );
    $teamSettings = app(TeamSetting::class);
    $teamSettings->batch((int) $team->id, 'service', [
        'default_handler_rate_percent' => 60,
        'default_sender_rate_percent' => 25,
        'default_cs_rate_percent' => 5,
    ]);
    $serviceOptionDefaults = app(EntitlementManagement::class)->teamOptions((int) $team->id)['service_defaults'];
    $productOptionDefaults = app(EntitlementManagement::class)->productOptions((int) $team->id)['service_defaults'];
    $assert(
        $serviceOptionDefaults['default_handler_rate_percent'] === 60
            && $serviceOptionDefaults['default_sender_rate_percent'] === 25
            && $serviceOptionDefaults['default_cs_rate_percent'] === 5
            && $serviceOptionDefaults['allow_customer_open_dispatch'] === true,
        'manage options expose configured service defaults using their declared API types'
    );
    $assert(
        $productOptionDefaults['default_handler_rate_percent'] === 60
            && $productOptionDefaults['default_sender_rate_percent'] === 25
            && $productOptionDefaults['default_cs_rate_percent'] === 5,
        'team and personal product options expose the same configured distribution defaults'
    );
    $teamSettings->batch((int) $team->id, 'service', [
        'default_handler_rate_percent' => 80,
        'default_sender_rate_percent' => 15,
        'default_cs_rate_percent' => 0,
    ]);

    $selfRole = new TeamRole;
    $selfRole->save(['team_id' => $team->id, 'role_key' => "self-product-{$suffix}", 'name' => '本人商品管理']);
    (new TeamRolePermission)->save([
        'team_id' => $team->id,
        'role_id' => $selfRole->id,
        'permission_key' => PermissionDictionary::SHOP_PRODUCT_SELF_MANAGE,
    ]);
    (new TeamEntityRole)->save([
        'team_id' => $team->id,
        'entity_id' => $handlerA->id,
        'role_id' => $selfRole->id,
    ]);
    $selfManagement = app(EntitlementSelfManagement::class);
    $sharedServiceId = app(EntitlementManagement::class)->saveService((int) $team->id, null, [
        'name' => '团队公用咨询', 'unit_name' => '次', 'quantity_step' => '1',
        'default_total_price' => 10, 'default_cost' => 2,
        'default_handler_cut' => 4, 'default_sender_cut' => 2, 'default_cs_cut' => 1,
    ]);
    $ownServiceId = $selfManagement->saveService(
        (int) $team->id,
        $subjectHandlerA + ['entity_id' => (int) $handlerA->id],
        (int) $handlerA->id,
        null,
        ['name' => '本人咨询', 'unit_name' => '次', 'quantity_step' => '1']
    );
    $otherServiceId = app(EntitlementManagement::class)->saveService((int) $team->id, null, [
        'owner_entity_id' => (int) $handlerB->id,
        'name' => '他人咨询', 'unit_name' => '次', 'quantity_step' => '1',
    ]);
    $personalServiceIds = array_map('intval', array_column(
        $selfManagement->options((int) $team->id, $subjectHandlerA + ['entity_id' => (int) $handlerA->id])['services'],
        'id'
    ));
    $assert(
        in_array($sharedServiceId, $personalServiceIds, true)
            && in_array($ownServiceId, $personalServiceIds, true)
            && !in_array($otherServiceId, $personalServiceIds, true),
        'personal entitlement options expose shared and own services but never another Entity service'
    );
    $personalPackageId = $selfManagement->savePackage(
        (int) $team->id,
        $subjectHandlerA + ['entity_id' => (int) $handlerA->id],
        (int) $handlerA->id,
        null,
        ['name' => '本人组合包', 'pricing_mode' => 2, 'services' => [[
            'service_id' => $sharedServiceId, 'quantity' => 1, 'valid_days' => 30,
            'unit_price' => 10, 'unit_cost' => 2,
            'unit_handler_cut' => 4, 'unit_sender_cut' => 2, 'unit_cs_cut' => 1,
        ], [
            'service_id' => $ownServiceId, 'quantity' => 1, 'valid_days' => 30,
        ]]],
    );
    $throws(
        fn () => $selfManagement->savePackage(
            (int) $team->id,
            $subjectHandlerA + ['entity_id' => (int) $handlerA->id],
            (int) $handlerA->id,
            $personalPackageId,
            ['name' => '本人组合包', 'pricing_mode' => 2, 'services' => [[
                'service_id' => $sharedServiceId, 'quantity' => 1, 'valid_days' => 30,
                'unit_price' => 11, 'unit_cost' => 2,
                'unit_handler_cut' => 4, 'unit_sender_cut' => 2, 'unit_cs_cut' => 1,
            ]]]
        ),
        403,
        'self management permission does not implicitly allow repricing a shared service'
    );
    $repriceRole = new TeamRole;
    $repriceRole->save(['team_id' => $team->id, 'role_key' => "self-reprice-{$suffix}", 'name' => '本人权益调价']);
    (new TeamRolePermission)->save([
        'team_id' => $team->id,
        'role_id' => $repriceRole->id,
        'permission_key' => PermissionDictionary::SHOP_PRODUCT_SELF_REPRICE,
    ]);
    (new TeamEntityRole)->save([
        'team_id' => $team->id,
        'entity_id' => $handlerA->id,
        'role_id' => $repriceRole->id,
    ]);
    $selfManagement->savePackage(
        (int) $team->id,
        $subjectHandlerA + ['entity_id' => (int) $handlerA->id],
        (int) $handlerA->id,
        $personalPackageId,
        ['name' => '本人组合包', 'pricing_mode' => 2, 'services' => [[
            'service_id' => $sharedServiceId, 'quantity' => 1, 'valid_days' => 30,
            'unit_price' => 11, 'unit_cost' => 2,
            'unit_handler_cut' => 4, 'unit_sender_cut' => 2, 'unit_cs_cut' => 1,
        ]]],
    );
    $assert(
        (int) BenefitPackage::find($personalPackageId)->owner_entity_id === (int) $handlerA->id,
        'personal package remains immutably owned by the acting Entity'
    );
    $throws(
        fn () => app(EntitlementManagement::class)->savePackage((int) $team->id, null, [
            'name' => '非法团队组合', 'pricing_mode' => 2,
            'services' => [['service_id' => $ownServiceId, 'quantity' => 1, 'valid_days' => 30]],
        ]),
        422,
        'shared packages cannot reference an Entity-owned service'
    );
    $personalCampaignId = $selfManagement->saveCampaign(
        (int) $team->id,
        $subjectHandlerA + ['entity_id' => (int) $handlerA->id],
        (int) $handlerA->id,
        null,
        ['name' => '本人服务卡', 'package_id' => $personalPackageId, 'mode' => 1]
    );
    $issuedPersonalCodes = $selfManagement->issueCodes(
        (int) $team->id,
        $subjectHandlerA + ['entity_id' => (int) $handlerA->id],
        (int) $handlerA->id,
        $personalCampaignId,
        ['quantity' => 1]
    );
    $assert(
        count($issuedPersonalCodes) === 1 && (int) RedemptionCampaign::find($personalCampaignId)->owner_entity_id === (int) $handlerA->id,
        'personal card campaign and issued code inherit the acting Entity ownership boundary'
    );
    $throws(
        fn () => $selfManagement->service(
            (int) $team->id,
            $subjectHandlerA + ['entity_id' => (int) $handlerA->id],
            $otherServiceId
        ),
        404,
        'personal entitlement detail hides another Entity resource'
    );
    $throws(
        fn () => $selfManagement->saveService(
            (int) $team->id,
            $subjectHandlerA + ['entity_id' => (int) $handlerA->id],
            (int) $handlerB->id,
            $ownServiceId,
            ['name' => '身份切换写入']
        ),
        409,
        'personal entitlement writes reject a stale expected Entity'
    );

    // 一份 3 小时权益不预拆实例；顾客可按 0.5 小时步长分给不同接单人。
    $service = new TeamService;
    $service->save([
        'team_id' => $team->id,
        'name' => '计时服务',
        'unit_name' => '小时',
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

    $balancedServiceId = app(EntitlementManagement::class)->saveService((int) $team->id, null, [
        'name' => '自动团队余额',
        'unit_name' => '次',
        'quantity_step' => '0.25',
        'default_total_price' => '12.00',
        'default_cost' => '2.00',
        'default_handler_cut' => '3.00',
        'default_sender_cut' => '1.00',
        'default_cs_cut' => '0.50',
        'default_team_cut' => '99.00',
        'redemption_fields' => [[
            'name' => '服务说明', 'value_type' => 'text',
            'input_type' => 'textarea', 'fill_stage' => 'customer', 'is_customer_visible' => 1,
        ]],
    ]);
    $balancedService = TeamService::find($balancedServiceId);
    $balancedServiceDetail = app(EntitlementManagement::class)->service((int) $team->id, $balancedServiceId);
    $assert(
        (string) $balancedService->quantity_step === '0.2500'
            && (string) $balancedService->default_team_cut === '5.50'
            && ($balancedServiceDetail['redemption_fields'][0]['name'] ?? null) === '服务说明',
        'service save persists the normalized step, derived team cut and service fields'
    );
    $throws(
        fn () => app(EntitlementManagement::class)->saveService((int) $team->id, $balancedServiceId, [
            'name' => '不应提交的服务名',
            'redemption_fields' => [
                ['name' => '重复字段', 'value_type' => 'string'],
                ['name' => '重复字段', 'value_type' => 'string'],
            ],
        ]),
        409,
        'duplicate service field keys reject the whole service save'
    );
    $assert(
        TeamService::find($balancedServiceId)->name === '自动团队余额',
        'invalid service fields roll back service changes atomically'
    );
    $throws(
        fn () => app(EntitlementManagement::class)->saveService((int) $team->id, $balancedServiceId, [
            'name' => '自动团队余额',
            'unit_name' => '次',
            'quantity_step' => 1,
            'default_total_price' => '10.00',
            'default_cost' => '2.00',
            'default_handler_cut' => '8.00',
            'default_sender_cut' => '1.00',
            'default_cs_cut' => '0.00',
        ]),
        422,
        'service save rejects personnel cuts that leave a negative team balance'
    );

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
        && (string) $defaultItem->unit_handler_cut === '7.20'
        && (string) $defaultItem->unit_sender_cut === '1.35'
        && (string) $defaultItem->unit_cs_cut === '0.00',
        'custom package prices use fixed personnel amounts calculated from team defaults'
    );
    $serviceDefaultPackageId = app(EntitlementManagement::class)->savePackage((int) $team->id, null, [
        'name' => '服务金额默认值验证',
        'pricing_mode' => 2,
        'services' => [[
            'service_id' => $balancedServiceId,
            'quantity' => '1',
        ]],
    ]);
    $serviceDefaultItem = BenefitPackageService::where('package_id', $serviceDefaultPackageId)->find();
    $assert(
        (string) $serviceDefaultItem->unit_price === '12.00'
        && (string) $serviceDefaultItem->unit_cost === '2.00'
        && (string) $serviceDefaultItem->unit_handler_cut === '3.00'
        && (string) $serviceDefaultItem->unit_sender_cut === '1.00'
        && (string) $serviceDefaultItem->unit_cs_cut === '0.50',
        'package items inherit the selected service price, cost and fixed personnel allocations'
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
    $savedFields = app(ServiceRedemptionField::class)->sync((int) $team->id, (int) $service->id, [[
        'name' => '联系方式',
        'value_type' => 'string',
        'input_type' => 'text',
        'fill_stage' => 'customer',
        'is_customer_visible' => 1,
        'is_required' => 1,
    ], [
        'name' => '履约结果',
        'value_type' => 'text',
        'input_type' => 'textarea',
        'fill_stage' => 'manager',
        'is_customer_visible' => 0,
        'is_required' => 1,
    ], [
        'name' => '需求截图',
        'value_type' => 'image',
        'input_type' => 'upload',
        'fill_stage' => 'customer',
        'is_customer_visible' => 1,
        'is_required' => 0,
    ]]);
    $customerField = (int) $savedFields[0]['id'];
    $managerField = (int) $savedFields[1]['id'];
    $imageField = (int) $savedFields[2]['id'];
    $assert(
        (int) TeamServiceRedemptionField::find($customerField)->service_id === (int) $service->id,
        'redemption fields belong to the service definition'
    );
    $assert(
        TeamServiceRedemptionField::find($imageField)->value_type === 'image',
        'redemption fields support image uploads'
    );
    $throws(
        fn () => app(ServiceRedemptionField::class)->sync((int) $team->id, (int) $service->id, [[
            'name' => '不合规图片字段', 'value_type' => 'image', 'input_type' => 'text',
        ]]),
        422,
        'image redemption fields require the upload input control'
    );
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

    $withdrawnOfferId = app(ServiceRedemption::class)->createOffer(
        (int) $team->id, (int) $customer->id, (int) $entitlement->id, '0.5',
        (int) $handlerB->id, '', [$customerField => 'cancel-me'], (int) $customerEntity->id, 'offer-withdraw'
    );
    app(ServiceRedemption::class)->withdrawOffer(
        (int) $team->id, (int) $customer->id, (int) $customerEntity->id, $withdrawnOfferId
    );
    $assert(TeamServiceAssignmentOffer::find($withdrawnOfferId)->enumCase('status') === ServiceAssignmentOfferStatus::Withdrawn, 'customer can cancel a pending assignment offer');
    $assert((string) TeamServiceEntitlement::find($entitlement->id)->reserved_quantity === '0.0000', 'customer cancellation releases reserved quantity');

    $removedOfferId = app(ServiceRedemption::class)->createOffer(
        (int) $team->id, (int) $customer->id, (int) $entitlement->id, '0.5',
        (int) $handlerB->id, '', [$customerField => 'pool-change'], (int) $customerEntity->id, 'offer-pool-removal'
    );
    app(EntitlementManagement::class)->saveServiceHandlers((int) $team->id, (int) $service->id, [(int) $handlerA->id]);
    $assert(TeamServiceAssignmentOffer::find($removedOfferId)->enumCase('status') === ServiceAssignmentOfferStatus::Invalidated, 'removing a handler invalidates its pending offers');
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
    TeamServiceAssignmentOffer::where('id', $offerAId)->update(['create_time' => time() - 86400 * 30]);
    $agedDetail = app(ServiceRedemption::class)->customerGet((int) $team->id, (int) $customer->id, (int) $entitlement->id);
    $agedOffer = array_values(array_filter(
        $agedDetail['assignment_offers'],
        static fn (array $offer): bool => (int) $offer['id'] === $offerAId
    ))[0] ?? [];
    $assert(
        TeamServiceAssignmentOffer::find($offerAId)->enumCase('status') === ServiceAssignmentOfferStatus::Pending
            && !array_key_exists('expire_time', $agedOffer),
        'pending assignment offer remains valid without exposing a timeout'
    );
    $offerDetail = app(ServiceRedemption::class)->assignmentOffer((int) $team->id, (int) $handlerA->id, $offerAId);
    $assert(($offerDetail['redemption_fields'][0]['value'] ?? null) === 'wx-a', 'target handler sees full customer fields before accepting');
    $throws(fn () => app(ServiceRedemption::class)->acceptOffer((int) $team->id, (int) $handlerA->id, $offerAId), 422, 'required manager field blocks accepting an offer');
    $sliceAId = app(ServiceRedemption::class)->acceptOffer((int) $team->id, (int) $handlerA->id, $offerAId, [$managerField => '邀请接单确认']);
    $assert(app(ServiceRedemption::class)->acceptOffer((int) $team->id, (int) $handlerA->id, $offerAId) === $sliceAId, 'accepting the same offer is idempotent');
    $assert(TeamServiceInstance::find($sliceAId)->enumCase('status') === ServiceStatus::Processing, 'accepting an offer creates a processing slice');
    $sliceBId = app(ServiceRedemption::class)->start(
        (int) $team->id,
        (int) $customer->id,
        (int) $entitlement->id,
        '2.5',
        0,
        '',
        [
            [$customerField => 'wx-b-1'],
            [$customerField => 'wx-b-2'],
            [$customerField => 'wx-b-3'],
            [$customerField => 'wx-b-4'],
            [$customerField => 'wx-b-5'],
        ],
        (int) $customerEntity->id
    );
    $openSlice = TeamServiceInstance::find($sliceBId);
    $assert($openSlice->handler_entity_id === null && $openSlice->enumCase('status') === ServiceStatus::Processing, 'open dispatch creates an unassigned processing slice');
    $openDetail = app(ServiceRedemption::class)->claimableGet((int) $team->id, (int) $handlerB->id, $sliceBId);
    $assert(($openDetail['redemption_fields'][0]['value']['value_string'] ?? $openDetail['redemption_fields'][0]['value'] ?? null) === 'wx-b-1', 'pool handler sees the first resource fields before claiming open task');
    $assert(
        array_map(
            static fn (array $resource): mixed => $resource['redemption_fields'][0]['value']['value_string'] ?? null,
            $openDetail['redemption_resources']
        ) === ['wx-b-1', 'wx-b-2', 'wx-b-3', 'wx-b-4', 'wx-b-5'],
        'each minimum-step fulfillment resource keeps distinct customer fields'
    );
    $throws(fn () => app(ServiceRedemption::class)->claim((int) $team->id, (int) $handlerB->id, $sliceBId, '0.5'), 422, 'required manager field blocks claiming an open task');
    app(ServiceRedemption::class)->claim((int) $team->id, (int) $handlerB->id, $sliceBId, '0.5', [$managerField => '首份接单确认']);
    app(ServiceRedemption::class)->claim((int) $team->id, (int) $handlerB->id, $sliceBId, '0.5', [$managerField => '首份接单确认']);
    $remainderSliceId = (int) TeamServiceInstance::where('entitlement_id', $entitlement->id)
        ->where('id', '<>', $sliceAId)->where('id', '<>', $sliceBId)->whereNull('handler_entity_id')->value('id');
    $assert($remainderSliceId > 0 && (string) TeamServiceInstance::find($remainderSliceId)->quantity === '2.0000', 'partial claim leaves the unclaimed quantity in the public pool');
    $assert((string) TeamServiceInstance::find($sliceBId)->quantity === '0.5000', 'partial claim keeps the original task id for the claimed slice');
    $assert((string) TeamServiceEntitlement::find($entitlement->id)->reserved_quantity === '3.0000', 'partial claim does not change the reserved entitlement quantity');
    $throws(fn () => app(ServiceRedemption::class)->claim((int) $team->id, (int) $handlerA->id, $sliceBId), 409, 'only one handler can claim an open task');
    app(ServiceRedemption::class)->returnToPool((int) $team->id, (int) $handlerB->id, $sliceBId, '交接给其他同事');
    app(ServiceRedemption::class)->returnToPool((int) $team->id, (int) $handlerB->id, $sliceBId, '交接给其他同事');
    $assert(TeamServiceInstance::find($sliceBId)->handler_entity_id === null, 'handler can return an unfinished task without changing processing status');
    app(ServiceRedemption::class)->claim((int) $team->id, (int) $handlerA->id, $sliceBId, '0.5', [$managerField => '重新接单确认']);
    app(ServiceRedemption::class)->claim((int) $team->id, (int) $handlerA->id, $remainderSliceId, '2', [
        [$managerField => '第2份接单确认'],
        [$managerField => '第3份接单确认'],
        [$managerField => '第4份接单确认'],
        [$managerField => '第5份接单确认'],
    ]);
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
    $replacementSliceAId = app(ServiceRedemption::class)->acceptOffer((int) $team->id, (int) $handlerA->id, $replacementOfferId, [$managerField => '替补邀请接单确认']);
    $assert(TeamServiceInstance::find($sliceAId)->enumCase('status') === ServiceStatus::Unredeemed, 'cancelled historical slice remains unchanged');
    $assert(TeamServiceInstance::find($replacementSliceAId)->enumCase('status') === ServiceStatus::Processing, 'new invitation creates a fresh replacement slice');
    app(ServiceRedemption::class)->reject(
        (int) $team->id,
        $subjectManager,
        (int) $teamEntity->id,
        $replacementSliceAId,
        '逐份资料不完整'
    );
    $assert(
        TeamServiceInstance::find($replacementSliceAId)->enumCase('status') === ServiceStatus::Unredeemed
            && (string) TeamServiceEntitlement::find($entitlement->id)->available_quantity === '0.5000',
        'manager rejection returns the slice to unredeemed and releases its reservation'
    );
    app(ServiceRedemption::class)->restart(
        (int) $team->id,
        (int) $customer->id,
        $replacementSliceAId,
        (int) $handlerA->id,
        '逐份资料已修正',
        [[$customerField => 'wx-a-revised']],
        (int) $customerEntity->id
    );

    // 加价先由管理方提出，顾客单独确认并扣款，完成时再形成加价业绩。
    $beforeBalance = (float) TeamCustomerBalance::where('customer_id', $customer->id)->value('balance');
    $adjustmentId = app(ServiceAdjustment::class)->create(
        (int) $team->id,
        $subjectManager,
        (int) $teamEntity->id,
        $remainderSliceId,
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
        $remainderSliceId,
        $adjustmentId
    );
    $adjustment = TeamServiceAdjustment::find($adjustmentId);
    $afterBalance = (float) TeamCustomerBalance::where('customer_id', $customer->id)->value('balance');
    $assert(abs(($beforeBalance - $afterBalance) - 20.0) < 0.001, 'accepted adjustment is charged separately');
    $assert(
        TeamTransaction::find((int) $adjustment->receipt_trans_id)?->enumCase('type') === TransactionType::ServiceAdjustmentReceipt,
        'accepted adjustment creates a separate receipt transaction'
    );
    $throws(fn () => app(ServiceRedemption::class)->completeOwn(
        (int) $team->id,
        (int) $handlerB->id,
        $remainderSliceId,
        [$managerField => '越权完成']
    ), 403, 'handler cannot complete another entity task');
    app(ServiceRedemption::class)->completeOwn(
        (int) $team->id,
        (int) $handlerA->id,
        $remainderSliceId
    );
    app(ServiceRedemption::class)->completeOwn((int) $team->id, (int) $handlerA->id, $sliceBId);
    app(ServiceRedemption::class)->confirmCompletion((int) $team->id, (int) $customer->id, (int) $customerEntity->id, $remainderSliceId);
    app(ServiceRedemption::class)->confirmCompletion((int) $team->id, (int) $customer->id, (int) $customerEntity->id, $sliceBId);
    $assert(TeamServiceInstance::find($remainderSliceId)->enumCase('status') === ServiceStatus::Redeemed, 'handler completes own task with fields collected at claim time');
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

    // 发单人可从 Transaction 直接赋予商品权益，不创建 Shop 订单；流水由独立 TeamSetting 控制。
    $manualOptions = app(ManualEntitlementGrant::class)->options((int) $team->id, $subjectManager, (int) $teamEntity->id);
    $assert(
        in_array($productId, array_map(static fn (array $row): int => (int) $row['id'], $manualOptions['products']), true)
            && $manualOptions['sync_transaction'] === false,
        'manual grant options expose active service products and the default-disabled ledger setting'
    );
    $orderCount = TeamOrder::where('team_id', $team->id)->count();
    $transactionCount = TeamTransaction::where('team_id', $team->id)->count();
    $manualGrant = app(ManualEntitlementGrant::class)->grant((int) $team->id, (int) $handlerA->id, [
        'product_id' => $productId,
        'customer_id' => (int) $customer->id,
        'quantity' => 2,
        'sender_entity_id' => (int) $handlerA->id,
    ]);
    $manualRows = TeamServiceEntitlement::whereIn('id', $manualGrant['entitlement_ids'])->select()->all();
    $assert(
        count($manualRows) === 2
            && $manualGrant['transaction_id'] === null
            && TeamOrder::where('team_id', $team->id)->count() === $orderCount
            && TeamTransaction::where('team_id', $team->id)->count() === $transactionCount,
        'manual grant creates independent entitlements without an order or receipt while sync is disabled'
    );
    $assert(
        array_reduce($manualRows, static fn (bool $carry, TeamServiceEntitlement $row): bool => $carry
            && $row->source_order_id === null
            && (int) $row->source_product_id === $productId
            && (int) $row->holder_entity_id === (int) $customerEntity->id, true),
        'manual entitlements retain product provenance and Customer root ownership without order provenance'
    );
    $externalDefaultGrant = app(ManualEntitlementGrant::class)->grant(
        (int) $team->id,
        (int) $foreignTeamEntity->id,
        [
            'product_id' => $productId,
            'customer_id' => (int) $customer->id,
            'quantity' => 1,
        ]
    );
    $externalDefaultRow = TeamServiceEntitlement::find((int) $externalDefaultGrant['entitlement_ids'][0]);
    $assert(
        (int) $externalDefaultRow->sender_entity_id === (int) $teamEntity->id,
        'external operators are audited as actors but never become a target-team entitlement owner by default'
    );

    $senderBinding = new TeamCustomerSender;
    $senderBinding->save([
        'team_id' => (int) $team->id,
        'customer_id' => (int) $customer->id,
        'entity_id' => (int) $handlerA->id,
    ]);
    $personalOptions = app(ManualEntitlementGrant::class)->options(
        (int) $team->id,
        $subjectHandlerA,
        (int) $handlerA->id,
        true
    );
    $foreignOptions = app(ManualEntitlementGrant::class)->options(
        (int) $team->id,
        ['type' => 'teamMember', 'id' => (int) $memberB->id],
        (int) $handlerB->id,
        true
    );
    $assert(
        in_array((int) $customer->id, array_map(static fn (array $row): int => (int) $row['id'], $personalOptions['customers']), true)
            && !in_array((int) $customer->id, array_map(static fn (array $row): int => (int) $row['id'], $foreignOptions['customers']), true),
        'personal grant options expose only customers served by the current sender entity'
    );
    $personalGrant = app(ManualEntitlementGrant::class)->grant((int) $team->id, (int) $handlerA->id, [
        'product_id' => $productId,
        'customer_id' => (int) $customer->id,
        'quantity' => 1,
        'sender_entity_id' => (int) $handlerB->id,
    ], true);
    $personalRow = TeamServiceEntitlement::find((int) $personalGrant['entitlement_ids'][0]);
    $assert(
        (int) $personalRow->sender_entity_id === (int) $handlerA->id,
        'personal grant forces the current entity as sender and ignores submitted sender overrides'
    );
    $personalHistory = app(ManualEntitlementGrant::class)->personalHistory(
        (int) $team->id,
        (int) $handlerA->id
    );
    $directGrantCount = TeamServiceEntitlement::where('team_id', $team->id)
        ->where('sender_entity_id', $handlerA->id)
        ->whereNotNull('source_product_id')
        ->whereNull('source_order_id')
        ->whereNull('source_claim_id')
        ->count();
    $assert(
        (int) $personalHistory['total'] === $directGrantCount
            && in_array((int) $personalRow->id, array_map(static fn (array $row): int => (int) $row['id'], $personalHistory['list']), true)
            && (int) ($personalHistory['list'][0]['customer']['id'] ?? 0) === (int) $customer->id
            && (int) ($personalHistory['list'][0]['product']['id'] ?? 0) === $productId,
        'personal entitlement history returns only direct grants made by the current sender with readable relations'
    );
    $historySearch = app(ManualEntitlementGrant::class)->personalHistory(
        (int) $team->id,
        (int) $handlerA->id,
        (string) TeamProduct::find($productId)?->name
    );
    $foreignHistory = app(ManualEntitlementGrant::class)->personalHistory(
        (int) $team->id,
        (int) $handlerB->id
    );
    $assert(
        (int) $historySearch['total'] === $directGrantCount && (int) $foreignHistory['total'] === 0,
        'personal entitlement history supports product search without exposing another sender records'
    );
    $throws(
        fn () => app(ManualEntitlementGrant::class)->grant((int) $team->id, (int) $handlerB->id, [
            'product_id' => $productId,
            'customer_id' => (int) $customer->id,
            'quantity' => 1,
        ], true),
        403,
        'personal grant rejects customers outside the current sender relationship'
    );

    app(TeamSetting::class)->set((int) $team->id, 'shop', 'sync_manual_entitlement_transaction', true);
    $syncedGrant = app(ManualEntitlementGrant::class)->grant((int) $team->id, (int) $handlerA->id, [
        'product_id' => $productId,
        'customer_id' => (int) $customer->id,
        'quantity' => 1,
        'sender_entity_id' => (int) $handlerA->id,
    ]);
    $manualReceipt = TeamTransaction::find((int) $syncedGrant['transaction_id']);
    $assert(
        $manualReceipt?->enumCase('type') === TransactionType::ServicePackageReceipt
            && (int) $manualReceipt->customer_id === (int) $customer->id
            && TeamOrder::where('team_id', $team->id)->count() === $orderCount,
        'enabled manual grant sync creates a service-package receipt and still no Shop order'
    );

    // 一个套餐可含两个计量权益，各自保留不同价格与分成规则。
    $recruitA = new TeamService;
    $recruitA->save([
        'team_id' => $team->id, 'name' => 'A类服务', 'unit_name' => '人', 'quantity_step' => '1.0000',
        'default_total_price' => '0.00', 'default_cost' => '0.00', 'default_handler_cut' => '0.00',
        'default_sender_cut' => '0.00', 'default_cs_cut' => '0.00', 'default_team_cut' => '0.00', 'is_active' => 1,
    ]);
    $recruitB = new TeamService;
    $recruitB->save([
        'team_id' => $team->id, 'name' => 'B类服务', 'unit_name' => '人', 'quantity_step' => '1.0000',
        'default_total_price' => '0.00', 'default_cost' => '0.00', 'default_handler_cut' => '0.00',
        'default_sender_cut' => '0.00', 'default_cs_cut' => '0.00', 'default_team_cut' => '0.00', 'is_active' => 1,
    ]);
    $mixedPackageId = app(EntitlementManagement::class)->savePackage((int) $team->id, null, [
        'name' => '混合计量套餐',
        'pricing_mode' => 2,
        'services' => [
            [
                'service_id' => (int) $recruitA->id, 'quantity' => 20, 'valid_days' => 30,
                'unit_price' => '5.00', 'unit_cost' => '1.00',
                'unit_handler_cut' => '1.50', 'unit_sender_cut' => '0.25', 'unit_cs_cut' => '0.00',
            ],
            [
                'service_id' => (int) $recruitB->id, 'quantity' => 10, 'valid_days' => 30,
                'unit_price' => '8.00', 'unit_cost' => '2.00',
                'unit_handler_cut' => '1.50', 'unit_sender_cut' => '0.60', 'unit_cs_cut' => '0.00',
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
    $assert($sumCents([$mixed[0]], 'handler_cut') === 3000 && $sumCents([$mixed[1]], 'handler_cut') === 1500, 'mixed entitlements preserve independent fixed distributions');
    $mixedFieldsA = app(ServiceRedemptionField::class)->sync((int) $team->id, (int) $recruitA->id, [[
        'name' => '候选人资料', 'value_type' => 'text',
        'input_type' => 'textarea', 'fill_stage' => 'customer', 'is_customer_visible' => 1,
    ]]);
    $mixedFieldsB = app(ServiceRedemptionField::class)->sync((int) $team->id, (int) $recruitB->id, [[
        'name' => '交付渠道', 'value_type' => 'string',
        'input_type' => 'text', 'fill_stage' => 'customer', 'is_customer_visible' => 1,
    ]]);
    $mixedDetailA = app(ServiceRedemption::class)->customerGet((int) $team->id, (int) $customer->id, (int) $mixed[0]->id);
    $mixedDetailB = app(ServiceRedemption::class)->customerGet((int) $team->id, (int) $customer->id, (int) $mixed[1]->id);
    $assert(
        array_column($mixedDetailA['redemption_fields'], 'name') === ['候选人资料']
            && array_column($mixedDetailB['redemption_fields'], 'name') === ['交付渠道']
            && (int) $mixedFieldsA[0]['id'] !== (int) $mixedFieldsB[0]['id'],
        'different services in one product expose their own redemption fields'
    );
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
        [$customerField => 'card-open'],
        (int) $customerEntity->id
    );
    $openSlice = TeamServiceInstance::find($noLedgerId);
    $claimable = app(ServiceRedemption::class)->claimable((int) $team->id, (int) $handlerA->id, 1, 20);
    $assert($openSlice->enumCase('status') === ServiceStatus::Processing && $openSlice->handler_entity_id === null, 'open dispatch enters processing without binding a handler');
    $assert(in_array($noLedgerId, array_map(static fn (array $row): int => (int) $row['id'], $claimable['list']), true), 'eligible handler sees the open task');
    app(ServiceRedemption::class)->claim((int) $team->id, (int) $handlerA->id, $noLedgerId, null, [$managerField => '卡密接单确认']);
    $assert((int) TeamServiceInstance::find($noLedgerId)->handler_entity_id === (int) $handlerA->id, 'eligible handler can atomically claim an open task');
    $throws(fn () => app(ServiceRedemption::class)->claim((int) $team->id, (int) $handlerB->id, $noLedgerId), 409, 'claimed task cannot be claimed twice');

    $unrestrictedOfferId = app(ServiceRedemption::class)->createOffer(
        (int) $team->id, (int) $customer->id, (int) $cardEntitlement->id,
        '0.5', (int) $handlerB->id, '', [$customerField => 'card-offer'], (int) $customerEntity->id, 'unrestricted-pool-offer'
    );
    app(EntitlementManagement::class)->saveServiceHandlers((int) $team->id, (int) $service->id, []);
    $savedUnrestrictedPool = app(EntitlementManagement::class)->serviceHandlers((int) $team->id, (int) $service->id);
    $assert(
        $savedUnrestrictedPool === [],
        'an empty handler pool persists without explicit rows: ' . json_encode(array_column($savedUnrestrictedPool, 'entity_id'))
    );
    $assert(
        TeamServiceAssignmentOffer::find($unrestrictedOfferId)->enumCase('status') === ServiceAssignmentOfferStatus::Pending,
        'switching to an unrestricted handler pool keeps eligible pending offers valid'
    );
    $unrestrictedHandlers = app(ServiceRedemption::class)->handlers(
        (int) $team->id, (int) $customer->id, (int) $cardEntitlement->id
    );
    $unrestrictedHandlerIds = array_map('intval', array_column($unrestrictedHandlers, 'entity_id'));
    $assert(
        in_array((int) $handlerA->id, $unrestrictedHandlerIds, true)
            && in_array((int) $handlerB->id, $unrestrictedHandlerIds, true)
            && in_array((int) $teamEntity->id, $unrestrictedHandlerIds, true)
            && in_array((int) $virtualEntity->id, $unrestrictedHandlerIds, true)
            && !in_array((int) $customerEntity->id, $unrestrictedHandlerIds, true),
        'unrestricted services expose every valid team, member and virtual handler but not customers'
    );
    app(ServiceRedemption::class)->withdrawOffer(
        (int) $team->id, (int) $customer->id, (int) $customerEntity->id, $unrestrictedOfferId
    );
    $unrestrictedOpenId = app(ServiceRedemption::class)->start(
        (int) $team->id, (int) $customer->id, (int) $cardEntitlement->id,
        '0.5', 0, '', [$customerField => 'card-unrestricted'], (int) $customerEntity->id
    );
    $unrestrictedClaimable = app(ServiceRedemption::class)->claimable((int) $team->id, (int) $handlerB->id, 1, 20);
    $assert(
        in_array($unrestrictedOpenId, array_map(static fn (array $row): int => (int) $row['id'], $unrestrictedClaimable['list']), true),
        'every eligible handler sees open tasks when the service pool is empty'
    );
    app(ServiceRedemption::class)->claim((int) $team->id, (int) $handlerB->id, $unrestrictedOpenId, null, [$managerField => '开放池接单确认']);
    $assert((int) TeamServiceInstance::find($unrestrictedOpenId)->handler_entity_id === (int) $handlerB->id, 'an eligible handler can claim from an unrestricted service');
    $throws(
        fn () => app(ServiceRedemption::class)->claimable((int) $team->id, (int) $customerEntity->id, 1, 20),
        422,
        'customer entities remain ineligible when the service pool is unrestricted'
    );

    $ability->delete();
    $missingAbilityOpenId = app(ServiceRedemption::class)->start(
        (int) $team->id, (int) $customer->id, (int) $cardEntitlement->id,
        '0.5', 0, '', [$customerField => 'ability-missing-open'], (int) $customerEntity->id
    );
    $missingAbilityOfferId = app(ServiceRedemption::class)->createOffer(
        (int) $team->id, (int) $customer->id, (int) $cardEntitlement->id,
        '0.5', (int) $handlerA->id, '', [$customerField => 'ability-missing-offer'], (int) $customerEntity->id, 'ability-missing'
    );
    $assert($missingAbilityOpenId > 0 && $missingAbilityOfferId > 0, 'missing transaction ability no longer blocks customer dispatch');
    $serviceController = file_get_contents(dirname(__DIR__) . '/app/transaction/controller/Service.php');
    $assert(
        !str_contains((string) $serviceController, "'Ability:transaction'") ,
        'transaction redemption management remains reachable after ability expiry'
    );
    app(ServiceRedemption::class)->complete(
        (int) $team->id,
        $subjectManager,
        (int) $teamEntity->id,
        $noLedgerId,
        [$managerField => '卡密服务完成']
    );
    $noLedger = TeamServiceInstance::find($noLedgerId);
    $assert($noLedger->enumCase('status') === ServiceStatus::Redeemed && $noLedger->trans_id === null, 'missing ability completes without creating transaction');

    // 自动结单冻结发起时配置，但只从实际接单开始计时。
    $autoProductId = app(Product::class)->create((int) $team->id, [
        'name' => '自动结单核销',
        'cover_image' => 'https://assets.lostsky.work/auto-complete-service.webp',
        'price' => '0.01',
        'cost' => '0.00',
        'handler_cut' => '0.00',
        'sender_cut' => '0.00',
        'cs_cut' => '0.00',
        'kind' => 4,
        'redemption' => [
            'unit_name' => '次',
            'quantity_step' => '1',
            'quantity' => '2',
            'valid_days' => 30,
            'auto_complete_after_minutes' => 10,
            'handler_entity_ids' => [],
            'redemption_fields' => [[
                'name' => '人工结单结果',
                'value_type' => 'text',
                'input_type' => 'textarea',
                'fill_stage' => 'manager',
                'is_required' => 1,
            ]],
        ],
    ]);
    foreach ([true, false] as $hasTransactionAbility) {
        $autoAbility = null;
        if ($hasTransactionAbility) {
            $autoAbility = TeamAbility::withTrashed()->where('team_id', $team->id)->where('ability_key', 'transaction')->find();
            $autoAbility->restore();
        }
        $case = $hasTransactionAbility ? 'with transaction ability' : 'without transaction ability';
        $clockOrderId = app(Order::class)->create((int) $team->id, [
            'product_id' => $autoProductId,
            'customer_id' => $customer->id,
            'quantity' => 2,
        ]);
        app(Order::class)->complete((int) $team->id, $clockOrderId);
        $clockEntitlement = TeamServiceEntitlement::where('source_order_id', $clockOrderId)->find();
        $clockFieldId = (int) TeamServiceRedemptionField::where('service_id', $clockEntitlement->service_id)->value('id');
        $clockOpenId = app(ServiceRedemption::class)->start(
            (int) $team->id, (int) $customer->id, (int) $clockEntitlement->id,
            '2', 0, '', [], (int) $customerEntity->id
        );
        $assert(TeamServiceInstance::find($clockOpenId)->started_at === null, "public dispatch has no clock {$case}");
        // 升级前公开任务可能已经带有到期时间，必须同样排除。
        TeamServiceInstance::where('id', $clockOpenId)->update(['started_at' => time() - 601]);
        $waitingRun = app(ServiceRedemption::class)->autoCompleteDue(time());
        $clockEntitlement = TeamServiceEntitlement::find($clockEntitlement->id);
        $assert(
            $waitingRun['failed'] === 0
                && TeamServiceInstance::find($clockOpenId)->enumCase('status') === ServiceStatus::Processing
                && (string) $clockEntitlement->consumed_quantity === '0.0000'
                && (string) $clockEntitlement->reserved_quantity === '2.0000'
                && TeamServiceInstance::find($clockOpenId)->trans_id === null
                && TeamServiceEvent::where('service_instance_id', $clockOpenId)->where('event_type', 'auto_completed')->count() === 0,
            "cleanup excludes legacy unassigned tasks without consuming entitlement or writing events {$case}"
        );
        $claimBefore = time();
        app(ServiceRedemption::class)->claim((int) $team->id, (int) $handlerA->id, $clockOpenId, '1', [$clockFieldId => '部分接单']);
        $clockRemainder = TeamServiceInstance::where('entitlement_id', $clockEntitlement->id)->whereNull('handler_entity_id')->find();
        $assert(
            (int) TeamServiceInstance::find($clockOpenId)->started_at >= $claimBefore
                && $clockRemainder->started_at === null
                && (string) $clockRemainder->quantity === '1.0000',
            "partial claim starts only the claimed portion's clock {$case}"
        );
        $oldClock = time() - 601;
        TeamServiceInstance::where('id', $clockOpenId)->update(['started_at' => $oldClock]);
        app(ServiceRedemption::class)->claim((int) $team->id, (int) $handlerA->id, $clockOpenId);
        app(ServiceRedemption::class)->reassign((int) $team->id, $subjectManager, (int) $teamEntity->id, $clockOpenId, (int) $handlerB->id, '交接');
        $assert((int) TeamServiceInstance::find($clockOpenId)->started_at === $oldClock, "idempotent claim and assigned reassignment preserve the clock {$case}");
        app(ServiceRedemption::class)->returnToPool((int) $team->id, (int) $handlerB->id, $clockOpenId, '退回公开池');
        $assert(TeamServiceInstance::find($clockOpenId)->started_at === null, "returning to the pool clears the clock {$case}");
        app(ServiceRedemption::class)->autoCompleteDue(time());
        $assert(TeamServiceInstance::find($clockOpenId)->enumCase('status') === ServiceStatus::Processing, "returned task cannot automatically complete {$case}");
        $reclaimBefore = time();
        app(ServiceRedemption::class)->claim((int) $team->id, (int) $handlerA->id, $clockOpenId, null, [$clockFieldId => '重新接单']);
        TeamServiceInstance::where('id', $clockRemainder->id)->update(['started_at' => $oldClock]);
        app(ServiceRedemption::class)->reassign((int) $team->id, $subjectManager, (int) $teamEntity->id, (int) $clockRemainder->id, (int) $handlerB->id, '公开池派单');
        $assert(
            (int) TeamServiceInstance::find($clockOpenId)->started_at >= $reclaimBefore
                && (int) TeamServiceInstance::find($clockRemainder->id)->started_at >= $reclaimBefore,
            "reclaim and assignment from public pool establish a fresh clock {$case}"
        );
        app(ServiceRedemption::class)->autoCompleteDue(time());
        $assert(
            TeamServiceInstance::find($clockOpenId)->enumCase('status') === ServiceStatus::Processing
                && TeamServiceInstance::find($clockRemainder->id)->enumCase('status') === ServiceStatus::Processing,
            "newly assigned portions do not inherit overdue public clocks {$case}"
        );
        app(ServiceRedemption::class)->requestCancel((int) $team->id, (int) $customer->id, $clockOpenId, '取消后重启', (int) $customerEntity->id);
        app(ServiceRedemption::class)->approveCancel((int) $team->id, $subjectManager, (int) $teamEntity->id, $clockOpenId);
        $assert(TeamServiceInstance::find($clockOpenId)->started_at === null, "approved cancellation clears the clock {$case}");
        $restartBefore = time();
        app(ServiceRedemption::class)->restart((int) $team->id, (int) $customer->id, $clockOpenId, (int) $handlerA->id, '', [], (int) $customerEntity->id);
        $assert((int) TeamServiceInstance::find($clockOpenId)->started_at >= $restartBefore, "restart with an actual handler starts a fresh clock {$case}");
        app(ServiceRedemption::class)->completeOwn((int) $team->id, (int) $handlerA->id, $clockOpenId, [$clockFieldId => '请求结单']);
        $requestedAt = (int) TeamServiceInstance::find($clockOpenId)->completion_requested_at;
        $assert(TeamServiceInstance::find($clockOpenId)->enumCase('status') === ServiceStatus::Processing, "request waits for customer confirmation {$case}");
        $assert((int) TeamServiceInstance::find($clockOpenId)->completion_due_at === $requestedAt + 600, "confirmation deadline uses request time {$case}");
        app(ServiceRedemption::class)->completeOwn((int) $team->id, (int) $handlerA->id, $clockOpenId);
        $assert((int) TeamServiceInstance::find($clockOpenId)->completion_requested_at === $requestedAt, "duplicate request preserves confirmation clock {$case}");
        $throws(fn () => app(ServiceRedemption::class)->requestCancel((int) $team->id, (int) $customer->id, $clockOpenId, '取消', (int) $customerEntity->id), 409, "customer must reject completion before cancelling {$case}");
        $throws(fn () => app(ServiceRedemption::class)->returnToPool((int) $team->id, (int) $handlerA->id, $clockOpenId, '退回'), 409, "pending completion prevents returning to pool {$case}");
        $throws(fn () => app(ServiceRedemption::class)->reassign((int) $team->id, $subjectManager, (int) $teamEntity->id, $clockOpenId, (int) $handlerB->id, '转派'), 409, "pending completion prevents reassignment {$case}");
        $throws(fn () => app(ServiceRedemption::class)->rejectCompletion((int) $team->id, (int) $customer->id, (int) $customerEntity->id, $clockOpenId, ''), 422, "completion rejection requires a reason {$case}");
        $throws(fn () => app(ServiceRedemption::class)->confirmCompletion((int) $team->id, (int) $customer->id, (int) $handlerB->id, $clockOpenId), 403, "completion confirmation checks customer ownership {$case}");
        app(ServiceRedemption::class)->rejectCompletion((int) $team->id, (int) $customer->id, (int) $customerEntity->id, $clockOpenId, '服务尚未完成');
        $assert(TeamServiceInstance::find($clockOpenId)->completion_requested_at === null, "rejection clears confirmation clock {$case}");
        $throws(fn () => app(ServiceRedemption::class)->confirmCompletion((int) $team->id, (int) $customer->id, (int) $customerEntity->id, $clockOpenId), 409, "rejected completion cannot be confirmed {$case}");
        app(ServiceRedemption::class)->completeOwn((int) $team->id, (int) $handlerA->id, $clockOpenId);
        app(ServiceRedemption::class)->completeOwn((int) $team->id, (int) $handlerB->id, (int) $clockRemainder->id, [$clockFieldId => '请求结单']);
        TeamServiceInstance::whereIn('id', [$clockOpenId, $clockRemainder->id])->update(['completion_requested_at' => time() - 601]);
        $assignedRun = app(ServiceRedemption::class)->autoCompleteDue(time());
        $assert($assignedRun['failed'] === 0, "assigned automatic completion succeeds {$case}");
        foreach ([$clockOpenId, (int) $clockRemainder->id] as $clockId) {
            $clockInstance = TeamServiceInstance::find($clockId);
            $assert(
                $clockInstance->enumCase('status') === ServiceStatus::Redeemed
                    && ($hasTransactionAbility ? $clockInstance->trans_id !== null : $clockInstance->trans_id === null),
                "due assigned task completes with the expected transaction behavior {$case}"
            );
            app(ServiceRedemption::class)->confirmCompletion((int) $team->id, (int) $customer->id, (int) $customerEntity->id, $clockId);
            $throws(fn () => app(ServiceRedemption::class)->confirmCompletion((int) $team->id, (int) $customer->id, (int) $handlerB->id, $clockId), 403, "even idempotent confirmation checks ownership {$case}");
        }
        $assert(
            (string) TeamServiceEntitlement::find($clockEntitlement->id)->consumed_quantity === '2.0000'
                && (string) TeamServiceEntitlement::find($clockEntitlement->id)->reserved_quantity === '0.0000',
            "only assigned completed portions consume the entitlement {$case}"
        );
        if ($autoAbility) $db->name('team_ability')->where('team_id', $team->id)->where('ability_key', 'transaction')->update(['delete_time' => time()]);
    }
    // 未使用权益超时结单必须扣除邀请预占金额，释放后再结也不超分配。
    $unusedProductId = app(Product::class)->create((int) $team->id, [
        'name' => '未使用权益结单', 'cover_image' => 'https://assets.lostsky.work/unused-service.webp', 'price' => '10.00', 'cost' => '2.00',
        'handler_cut' => '4.00', 'sender_cut' => '2.00', 'cs_cut' => '1.00', 'kind' => 4,
        'redemption' => ['unit_name' => '次', 'quantity_step' => '1', 'quantity' => '2',
            'valid_days' => 0, 'unused_auto_complete_after_minutes' => 10, 'auto_complete_after_minutes' => null,
            'handler_entity_ids' => [], 'redemption_fields' => []],
    ]);
    $throws(fn () => app(Product::class)->edit((int) $team->id, $unusedProductId, ['redemption' => ['unused_auto_complete_after_minutes' => 0]]), 422, 'unused timeout rejects zero instead of silently disabling');
    foreach (['accepted', 'withdrawn', 'rejected', 'cancelled', 'no_ability'] as $offerOutcome) {
        $unusedAbility = null;
        if ($offerOutcome !== 'no_ability') {
            $unusedAbility = TeamAbility::withTrashed()->where('team_id', $team->id)->where('ability_key', 'transaction')->find();
            $unusedAbility->restore();
        }
        $unusedOrderId = app(Order::class)->create((int) $team->id, [
            'product_id' => $unusedProductId, 'customer_id' => $customer->id, 'quantity' => 1,
            'sender_entity_id' => $handlerA->id, 'cs_entity_id' => $handlerB->id,
        ]);
        $issuedBefore = time();
        app(Order::class)->complete((int) $team->id, $unusedOrderId);
        $unusedEntitlement = TeamServiceEntitlement::where('source_order_id', $unusedOrderId)->find();
        $assert((int) $unusedEntitlement->unused_auto_complete_after_minutes === 10
            && (int) $unusedEntitlement->unused_auto_complete_due_at >= $issuedBefore + 600,
            "unused clock is frozen from entitlement issuance {$offerOutcome}");
        $unusedOfferId = app(ServiceRedemption::class)->createOffer(
            (int) $team->id, (int) $customer->id, (int) $unusedEntitlement->id,
            '1', (int) $virtualEntity->id, '', [], (int) $customerEntity->id, 'unused-' . $offerOutcome
        );
        TeamServiceEntitlement::where('id', $unusedEntitlement->id)->update(['unused_auto_complete_due_at' => time() - 1, 'expire_time' => time() - 1]);
        $beforeUnusedStats = app(TransactionStats::class)->summary((int) $team->id, 0, time() + 60);
        $beforeUnusedPersonal = app(TransactionStats::class)->personal((int) $team->id, (int) $virtualEntity->id, 0, time() + 60);
        $beforeUnusedRoles = app(TransactionStats::class)->byRole((int) $team->id, 0, time() + 60);
        $unusedRun = app(ServiceRedemption::class)->autoCompleteUnusedDue(time());
        $unusedSlice = TeamServiceInstance::where('entitlement_id', $unusedEntitlement->id)->where('settlement_kind', 'unused')->find();
        $assert($unusedRun['failed'] === 0 && $unusedSlice !== null && (string) $unusedSlice->quantity === '1.0000'
            && (string) $unusedSlice->total_price === '5.00' && $unusedSlice->handler_entity_id === null
            && $unusedSlice->settled_handler_cut === '0.00' && $unusedSlice->settled_team_cut === '2.50',
            "unused settlement excludes pending invitation money and transfers handler cut {$offerOutcome}");
        $assert((string) TeamServiceEntitlement::find($unusedEntitlement->id)->reserved_quantity === '1.0000', "unused settlement preserves reserved quantity {$offerOutcome}");
        app(ServiceRedemption::class)->autoCompleteUnusedDue(time());
        $assert(TeamServiceInstance::where('entitlement_id', $unusedEntitlement->id)->where('settlement_kind', 'unused')->count() === 1,
            "repeated unused cleanup is idempotent {$offerOutcome}");
        if ($offerOutcome !== 'no_ability') {
            $unusedTrans = TeamTransaction::find((int) $unusedSlice->trans_id);
            $assert($unusedTrans->enumCase('type') === TransactionType::UnusedServiceSettlement
                && (string) $unusedTrans->cash === '0.00' && (string) $unusedTrans->prepaid === '0.00'
                && (string) $unusedTrans->handler_cut === '0.00' && (string) $unusedTrans->team_cut === '2.50',
                "unused settlement writes a non-receipt team allocation {$offerOutcome}");
            $afterUnusedStats = app(TransactionStats::class)->summary((int) $team->id, 0, time() + 60);
            $afterUnusedPersonal = app(TransactionStats::class)->personal((int) $team->id, (int) $virtualEntity->id, 0, time() + 60);
            $afterUnusedRoles = app(TransactionStats::class)->byRole((int) $team->id, 0, time() + 60);
            $assert(abs((float) $afterUnusedStats['receipt_total'] - (float) $beforeUnusedStats['receipt_total']) < 0.001
                && abs((float) $afterUnusedStats['performance_total'] - (float) $beforeUnusedStats['performance_total'] - 5.0) < 0.001
                && (int) $afterUnusedPersonal['handler_count'] === (int) $beforeUnusedPersonal['handler_count']
                && (float) $afterUnusedPersonal['performance_total'] === (float) $beforeUnusedPersonal['performance_total'],
                "actual team and handler stats avoid duplicate receipts and handler performance {$offerOutcome}");
            $roleAmount = static fn (array $roles, string $role, int $entityId): float => array_sum(array_map(
                static fn (array $row): float => (int) $row['entity_id'] === $entityId ? (float) $row['amount'] : 0.0,
                $roles[$role]
            ));
            $assert(abs($roleAmount($afterUnusedRoles, 'sender', (int) $handlerA->id) - $roleAmount($beforeUnusedRoles, 'sender', (int) $handlerA->id) - 1.0) < 0.001
                && abs($roleAmount($afterUnusedRoles, 'cs', (int) $handlerB->id) - $roleAmount($beforeUnusedRoles, 'cs', (int) $handlerB->id) - 0.5) < 0.001
                && !in_array(0, array_map(static fn (array $row): int => (int) $row['entity_id'], $afterUnusedRoles['handler']), true),
                "actual sender and customer-service statistics retain frozen income without phantom handler {$offerOutcome}");
        } else {
            $assert($unusedSlice->trans_id === null, 'unused settlement consumes without transaction when ability is absent');
        }
        if ($offerOutcome === 'accepted') {
            $acceptedUnusedId = app(ServiceRedemption::class)->acceptOffer((int) $team->id, (int) $virtualEntity->id, $unusedOfferId);
            app(ServiceRedemption::class)->completeOwn((int) $team->id, (int) $virtualEntity->id, $acceptedUnusedId);
            $assert(TeamServiceInstance::find($acceptedUnusedId)->completion_due_at === null, 'null confirmation time disables automatic completion');
            app(ServiceRedemption::class)->confirmCompletion((int) $team->id, (int) $customer->id, (int) $customerEntity->id, $acceptedUnusedId);
            app(ServiceRedemption::class)->confirmCompletion((int) $team->id, (int) $customer->id, (int) $customerEntity->id, $acceptedUnusedId);
        } elseif ($offerOutcome === 'rejected') {
            app(ServiceRedemption::class)->rejectOffer((int) $team->id, (int) $virtualEntity->id, $unusedOfferId, '无法接单');
            app(ServiceRedemption::class)->autoCompleteUnusedDue(time());
        } elseif ($offerOutcome === 'cancelled') {
            app(ServiceRedemption::class)->withdrawOffer((int) $team->id, (int) $customer->id, (int) $customerEntity->id, $unusedOfferId);
            TeamServiceEntitlement::where('id', $unusedEntitlement->id)->update(['expire_time' => 0]);
            $cancelUnusedId = app(ServiceRedemption::class)->start((int) $team->id, (int) $customer->id, (int) $unusedEntitlement->id, '1', 0, '', [], (int) $customerEntity->id);
            app(ServiceRedemption::class)->requestCancel((int) $team->id, (int) $customer->id, $cancelUnusedId, '不再需要', (int) $customerEntity->id);
            app(ServiceRedemption::class)->approveCancel((int) $team->id, $subjectManager, (int) $teamEntity->id, $cancelUnusedId);
            app(ServiceRedemption::class)->autoCompleteUnusedDue(time());
        } else {
            app(ServiceRedemption::class)->withdrawOffer((int) $team->id, (int) $customer->id, (int) $customerEntity->id, $unusedOfferId);
            app(ServiceRedemption::class)->autoCompleteUnusedDue(time());
        }
        $unusedSlices = TeamServiceInstance::where('entitlement_id', $unusedEntitlement->id)->where('status', ServiceStatus::Redeemed->value)->select()->all();
        $assert($sumCents($unusedSlices, 'total_price') === 1000 && $sumCents($unusedSlices, 'sender_cut') === 200
            && $sumCents($unusedSlices, 'cs_cut') === 100
            && (string) TeamServiceEntitlement::find($unusedEntitlement->id)->consumed_quantity === '2.0000',
            "accepted or released invitation never duplicates frozen money {$offerOutcome}");
        if ($unusedAbility) $db->name('team_ability')->where('team_id', $team->id)->where('ability_key', 'transaction')->update(['delete_time' => time()]);
    }
    $autoOrderId = app(Order::class)->create((int) $team->id, [
        'product_id' => $autoProductId,
        'customer_id' => $customer->id,
        'quantity' => 1,
    ]);
    app(Order::class)->complete((int) $team->id, $autoOrderId);
    $autoEntitlement = TeamServiceEntitlement::where('source_order_id', $autoOrderId)->find();
    $autoFirstId = app(ServiceRedemption::class)->start(
        (int) $team->id, (int) $customer->id, (int) $autoEntitlement->id,
        '1', 0, '', [], (int) $customerEntity->id
    );
    $autoSecondId = app(ServiceRedemption::class)->start(
        (int) $team->id, (int) $customer->id, (int) $autoEntitlement->id,
        '1', 0, '', [], (int) $customerEntity->id
    );
    $autoFieldId = (int) TeamServiceRedemptionField::where('service_id', $autoEntitlement->service_id)->value('id');
    app(ServiceRedemption::class)->claim((int) $team->id, (int) $handlerA->id, $autoFirstId, null, [$autoFieldId => '接单确认']);
    app(ServiceRedemption::class)->claim((int) $team->id, (int) $handlerB->id, $autoSecondId, null, [$autoFieldId => '接单确认']);
    $autoStartedAt = time() - 601;
    app(ServiceRedemption::class)->completeOwn((int) $team->id, (int) $handlerA->id, $autoFirstId);
    TeamServiceInstance::whereIn('id', [$autoFirstId, $autoSecondId])->update(['started_at' => $autoStartedAt]);
    TeamServiceInstance::where('id', $autoFirstId)->update(['completion_requested_at' => $autoStartedAt]);
    app(Product::class)->edit((int) $team->id, $autoProductId, [
        'redemption' => ['auto_complete_after_minutes' => 20],
    ]);
    $assert(
        (int) TeamServiceInstance::find($autoFirstId)->auto_complete_after_minutes === 10,
        'started redemption keeps its automatic completion duration snapshot'
    );
    app(ServiceRedemption::class)->requestCancel(
        (int) $team->id, (int) $customer->id, $autoSecondId, '先暂停结单', (int) $customerEntity->id
    );
    $firstAutoRun = app(ServiceRedemption::class)->autoCompleteDue(time());
    $assert(
        $firstAutoRun['completed'] === 1
            && TeamServiceInstance::find($autoFirstId)->enumCase('status') === ServiceStatus::Redeemed
            && TeamServiceInstance::find($autoSecondId)->enumCase('status') === ServiceStatus::Processing,
        'automatic completion skips a redemption with a pending cancellation request'
    );
    $assert(
        TeamServiceEvent::where('service_instance_id', $autoFirstId)
            ->where('event_type', 'auto_completed')->whereNull('actor_entity_id')->find() !== null,
        'automatic completion records a system event without impersonating an Entity'
    );
    app(ServiceRedemption::class)->rejectCancel(
        (int) $team->id, $subjectManager, (int) $teamEntity->id, $autoSecondId, '继续履约'
    );
    $assert(
        (int) TeamServiceInstance::find($autoSecondId)->started_at === $autoStartedAt,
        'rejecting cancellation does not reset or pause the automatic completion clock'
    );
    app(ServiceRedemption::class)->completeOwn((int) $team->id, (int) $handlerB->id, $autoSecondId);
    TeamServiceInstance::where('id', $autoSecondId)->update(['completion_requested_at' => $autoStartedAt]);
    $secondAutoRun = app(ServiceRedemption::class)->autoCompleteDue(time());
    $assert(
        $secondAutoRun['completed'] === 1
            && TeamServiceInstance::find($autoSecondId)->enumCase('status') === ServiceStatus::Redeemed,
        'automatic completion becomes immediately eligible after cancellation rejection'
    );
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
