<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use app\enum\TeamMemberStatus;
use app\exception\AccessDeniedException;
use app\model\EntitySession;
use app\model\Entity;
use app\model\Team;
use app\model\TeamAbility;
use app\model\TeamCustomer;
use app\model\TeamCustomerBalance;
use app\model\TeamOrder;
use app\model\TeamProduct;
use app\model\User;
use app\model\UserDevice;
use app\service\CustomerBinding;
use app\service\CustomerProfile as CustomerProfileService;
use app\service\Balance as BalanceService;
use app\service\Entity as EntityService;
use app\service\EntitlementManagement;
use app\service\IdentitySession;
use app\service\Jwt;
use app\service\Product;
use app\service\Storefront;
use app\service\TeamSetting;
use app\service\TeamCustomer as CustomerService;
use think\App;
use think\exception\HttpException;

(new App(dirname(__DIR__)))->initialize();

$failures = [];
$assert = static function (bool $condition, string $case) use (&$failures): void {
    if (!$condition) $failures[] = $case;
};
$assertThrows = static function (callable $callback, int $status, string $case) use (&$failures): void {
    try {
        $callback();
        $failures[] = "{$case}: expected HttpException {$status}";
    } catch (HttpException $exception) {
        if ($exception->getStatusCode() !== $status) {
            $failures[] = "{$case}: expected {$status}, got {$exception->getStatusCode()}";
        }
    } catch (Throwable $exception) {
        $failures[] = "{$case}: expected HttpException {$status}, got " . $exception::class;
    }
};

$jwt = config('jwt');
$jwt['secret'] = str_repeat('s', 64);
app()->config->set($jwt, 'jwt');

$db = app()->db;
$db->startTrans();
try {
    $suffix = bin2hex(random_bytes(5));
    $owner = new User;
    $owner->save([
        'phone' => '15' . random_int(100000000, 999999999),
        'username' => "shop-owner-{$suffix}",
        'password' => password_hash('shop-test', PASSWORD_DEFAULT),
    ]);
    $buyer = new User;
    $buyer->save([
        'phone' => '18' . random_int(100000000, 999999999),
        'username' => "shop-buyer-{$suffix}",
        'password' => password_hash('shop-test', PASSWORD_DEFAULT),
    ]);
    $teamData = app(\app\service\Team::class)->create(
        (int) $owner->id,
        "shop-store-{$suffix}",
        'Storefront Test'
    );
    $team = Team::find((int) $teamData['id']);
    $teamEntity = Entity::where('entityable_type', 'team')
        ->where('entityable_id', (int) $team->id)
        ->find();

    $activeId = app(Product::class)->create((int) $team->id, [
        'name' => 'Visible Product',
        'description' => 'Public summary',
        'cover_image' => 'https://assets.lostsky.work/media/product.webp',
        'introduction_markdown' => '# Public details',
        'price' => '30.00',
        'cost' => '9.00',
        'handler_cut' => '3.00',
    ]);
    $inactiveId = app(Product::class)->create((int) $team->id, [
        'name' => 'Hidden Product',
        'cover_image' => 'https://assets.lostsky.work/media/hidden-product.webp',
        'price' => '88.00',
        'cost' => '1.00',
    ]);
    TeamProduct::where('id', $inactiveId)->update(['is_active' => 0]);

    $closedHome = app(Storefront::class)->home((int) $team->id);
    $closedPage = app(Storefront::class)->products((int) $team->id);
    $assert((int) $closedHome['product_count'] === 0, 'storefront defaults to a closed product count');
    $assert($closedPage['total'] === 0 && $closedPage['list'] === [], 'closed storefront returns a legal empty page');
    $assertThrows(
        fn () => app(Storefront::class)->product((int) $team->id, $activeId),
        403,
        'closed storefront product detail explains that products are unavailable'
    );
    $assertThrows(
        fn () => app(TeamSetting::class)->batch((int) $team->id, 'shop', ['enabled' => true]),
        403,
        'shop setting cannot be enabled without Shop Ability'
    );
    try {
        app(TeamSetting::class)->batch((int) $team->id, 'shop', ['enabled' => true]);
    } catch (AccessDeniedException $exception) {
        $assert(
            $exception->data() === [
                'kind' => 'ability',
                'key' => 'shop',
                'label' => '商城',
                'minimum_level' => 1,
                'reason' => 'missing',
            ],
            'shop setting denial returns the structured Ability requirement'
        );
    }
    app(TeamSetting::class)->batch((int) $team->id, 'shop', ['enabled' => false]);
    $shopAbility = new TeamAbility;
    $shopAbility->save([
        'team_id' => (int) $team->id,
        'ability_key' => 'shop',
        'level' => 1,
        'expire_time' => time() - 1,
    ]);
    $assertThrows(
        fn () => app(TeamSetting::class)->batch((int) $team->id, 'shop', ['enabled' => true]),
        403,
        'shop setting cannot be enabled with an expired Shop Ability'
    );
    $shopAbility->save(['expire_time' => 0]);
    app(TeamSetting::class)->batch((int) $team->id, 'shop', ['enabled' => true]);
    $shopSchema = app(TeamSetting::class)->schema((int) $team->id);
    $shopFields = [];
    foreach ($shopSchema['apps'] as $settingApp) {
        if ($settingApp['app_name'] !== 'shop') continue;
        foreach ($settingApp['settings'] as $field) $shopFields[$field['key']] = $field;
    }
    $assert(
        ($shopFields['enabled']['value'] ?? false) === true
            && ($shopFields['enabled']['ability_requirement']['satisfied'] ?? false) === true,
        'shop setting schema exposes its satisfied Ability requirement'
    );

    $shopAbility->save(['expire_time' => time() - 1]);
    $assert(
        app(Storefront::class)->home((int) $team->id)['product_count'] === 0
            && (bool) app(TeamSetting::class)->internal((int) $team->id, 'shop')['enabled'] === true,
        'public storefront checks Ability in real time before the worker closes the persisted setting'
    );
    $assertThrows(
        fn () => app(Storefront::class)->product((int) $team->id, $activeId),
        403,
        'product detail is gated while an expiration job is delayed'
    );
    $shopAbility->save(['expire_time' => 0]);

    $page = app(Storefront::class)->products((int) $team->id);
    $assert(count($page['list']) === 1 && (int) $page['list'][0]['id'] === $activeId, 'storefront only lists active products');
    $assert(!array_key_exists('cost', $page['list'][0]) && !array_key_exists('handler_cut', $page['list'][0]), 'storefront list excludes internal money fields');
    $detail = app(Storefront::class)->product((int) $team->id, $activeId);
    $assert(($detail['introduction_markdown'] ?? null) === '# Public details', 'storefront detail includes product markdown');
    $entitlements = app(EntitlementManagement::class);
    $serviceId = $entitlements->saveService((int) $team->id, null, [
        'name' => 'Guided Session',
        'description' => 'A private guided session',
        'unit_name' => 'hours',
        'quantity_step' => '0.5',
        'default_total_price' => '20.00',
        'default_cost' => '0.00',
    ]);
    $packageId = $entitlements->savePackage((int) $team->id, null, [
        'name' => 'Guided Package',
        'services' => [[
            'service_id' => $serviceId,
            'quantity' => '1.5',
            'valid_days' => 30,
        ]],
    ]);
    $bundleId = app(Product::class)->create((int) $team->id, [
        'name' => 'Guided Bundle',
        'cover_image' => 'https://assets.lostsky.work/media/bundle.webp',
        'price' => '60.00',
        'kind' => 2,
        'benefit_package_id' => $packageId,
    ]);
    $bundle = app(Storefront::class)->product((int) $team->id, $bundleId);
    $included = $bundle['benefit_package']['services'][0] ?? [];
    $assert(
        ($bundle['benefit_package']['name'] ?? '') === 'Guided Package'
            && ($included['name'] ?? '') === 'Guided Session'
            && ($included['description'] ?? '') === 'A private guided session'
            && ($included['quantity'] ?? '') === '1.5000'
            && ($included['unit_name'] ?? '') === 'hours'
            && ($included['quantity_step'] ?? '') === '0.5000'
            && ($included['valid_days'] ?? 0) === 30,
        'storefront bundle detail exposes customer-facing included service information'
    );
    $assert(
        !array_key_exists('unit_price', $included)
            && !array_key_exists('unit_cost', $included)
            && !array_key_exists('unit_handler_cut', $included),
        'storefront included services exclude internal pricing and share fields'
    );
    $assertThrows(fn () => app(Storefront::class)->product((int) $team->id, $inactiveId), 404, 'inactive product detail is private');

    $deviceToken = bin2hex(random_bytes(16));
    (new UserDevice)->save([
        'user_id' => (int) $buyer->id,
        'device_token' => $deviceToken,
        'device_name' => 'Shop Test',
        'ua' => 'tests/shop_storefront.php',
        'last_active_time' => time(),
    ]);
    $binding = app(CustomerBinding::class);
    $manual = $binding->bind(
        (int) $team->id,
        (int) $buyer->id,
        $deviceToken,
        null,
        "buyer-{$suffix}",
        (string) $teamEntity->slug
    );
    $customerId = (int) $manual['customer']['id'];
    $customer = TeamCustomer::with(['identity', 'balance'])->find($customerId);
    $assert($manual['created'] === true && ($manual['identity']['slug'] ?? '') === "buyer-{$suffix}", 'base user creates a customer with a manual slug');
    $assert($customer->owner_entity_id === null && (int) $customer->user_id === (int) $buyer->id, 'base user binding has exactly one owner');
    $assert((int) $customer->assignee_entity_id === (int) $teamEntity->id, 'valid inviter becomes the initial customer assignee');
    $assert((string) $customer->balance->balance === '0.00' && !$customer->identity->is_searchable, 'binding creates zero balance and a non-searchable entity');

    $decoded = app(Jwt::class)->parseToken((string) $manual['token']);
    $current = app(IdentitySession::class)->session(
        (int) $buyer->id,
        $deviceToken,
        (string) $decoded->jti,
        (string) $decoded->act->type,
        (int) $decoded->act->id
    );
    $again = $binding->bind((int) $team->id, (int) $buyer->id, $deviceToken, $current);
    $assert((int) $again['customer']['id'] === $customerId && $again['created'] === false, 'binding is idempotent for the current shop customer');
    $assert(
        (int) TeamCustomer::find($customerId)->assignee_entity_id === (int) $teamEntity->id,
        'rebinding an existing customer does not replace the initial assignee'
    );
    $customerProfile = app(CustomerProfileService::class);
    $initialProfile = $customerProfile->get((int) $team->id, $customerId);
    $assert(
        ($initialProfile['profile']['name'] ?? '') !== ''
            && ($initialProfile['identity']['slug'] ?? '') === "buyer-{$suffix}"
            && isset($initialProfile['file_upload']['count'], $initialProfile['file_upload']['total_size'])
            && array_key_exists('available', $initialProfile['file_upload']),
        'shop customer profile returns normalized team profile and identity data'
    );
    $customerProfile->update((int) $team->id, $customerId, [
        'nickname' => 'Shop Customer',
        'avatar' => 'https://assets.lostsky.work/customer.webp',
        'description' => 'Merchant-only customer notes',
        'assignee_entity_id' => null,
    ]);
    $updatedProfile = $customerProfile->get((int) $team->id, $customerId);
    $assert(
        ($updatedProfile['profile']['name'] ?? '') === 'Shop Customer'
            && ($updatedProfile['profile']['description'] ?? '') === 'Merchant-only customer notes',
        'shop customer can update their team-local profile'
    );
    $assert($updatedProfile['assignee'] === null, 'shop customer can clear their own assignee');
    $customerProfile->update((int) $team->id, $customerId, [
        'nickname' => 'Shop Customer',
        'avatar' => 'https://assets.lostsky.work/customer.webp',
        'description' => 'Merchant-only customer notes',
        'assignee_entity_id' => (int) $teamEntity->id,
    ]);
    $assert(
        (int) ($customerProfile->get((int) $team->id, $customerId)['assignee']['entity_id'] ?? 0) === (int) $teamEntity->id,
        'shop customer can select an eligible same-team assignee'
    );
    $otherBuyer = new User;
    $otherBuyer->save([
        'phone' => '17' . random_int(100000000, 999999999),
        'username' => "shop-other-buyer-{$suffix}",
        'password' => password_hash('shop-test', PASSWORD_DEFAULT),
    ]);
    $otherDeviceToken = bin2hex(random_bytes(16));
    (new UserDevice)->save([
        'user_id' => (int) $otherBuyer->id,
        'device_token' => $otherDeviceToken,
        'device_name' => 'Shop Invalid Inviter Test',
        'ua' => 'tests/shop_storefront.php',
        'last_active_time' => time(),
    ]);
    $invalidInviter = $binding->bind(
        (int) $team->id,
        (int) $otherBuyer->id,
        $otherDeviceToken,
        null,
        null,
        "buyer-{$suffix}"
    );
    $assert(
        TeamCustomer::find((int) $invalidInviter['customer']['id'])->assignee_entity_id === null,
        'customer entity slug cannot become another customer assignee'
    );
    $assertThrows(
        fn () => $customerProfile->get((int) $team->id + 1, $customerId),
        404,
        'shop customer profile rejects a different team boundary'
    );
    $customer->is_blocked = 1;
    $customer->save();
    $assertThrows(
        fn () => $customerProfile->get((int) $team->id, $customerId),
        404,
        'blocked shop customer cannot read their profile'
    );
    $customer->is_blocked = 0;
    $customer->save();

    $legacyCustomer = new TeamCustomer;
    $legacyCustomer->save([
        'team_id' => (int) $team->id,
        'user_id' => (int) $owner->id,
        'is_blocked' => 0,
    ]);
    $legacyProfile = $customerProfile->get((int) $team->id, (int) $legacyCustomer->id);
    $assert(
        ($legacyProfile['identity']['slug'] ?? null) === null,
        'legacy customer without an identity exposes an empty slug'
    );
    $claimedSlug = $customerProfile->claimSlug(
        (int) $team->id,
        (int) $legacyCustomer->id,
        "legacy-{$suffix}"
    );
    $customerProfile->update((int) $team->id, (int) $legacyCustomer->id, [
        'nickname' => 'Legacy Customer',
        'avatar' => null,
        'description' => null,
    ]);
    $assert(
        ($claimedSlug['slug'] ?? '') === "legacy-{$suffix}"
            && ($customerProfile->get((int) $team->id, (int) $legacyCustomer->id)['profile']['name'] ?? '') === 'Legacy Customer',
        'legacy shop customer can claim their first slug and then maintain a profile'
    );
    $customerService = app(CustomerService::class);
    app(TeamSetting::class)->batch((int) $team->id, 'shop', ['enabled' => false]);
    $assertThrows(
        fn () => $customerService->purchase((int) $team->id, $customerId, [
            'product_id' => $activeId,
            'quantity' => 1,
        ]),
        403,
        'customer cannot forge a purchase while the shop is closed'
    );
    app(TeamSetting::class)->batch((int) $team->id, 'shop', ['enabled' => true]);
    $assertThrows(
        fn () => $customerService->purchase((int) $team->id, $customerId, [
            'product_id' => $activeId,
            'quantity' => 1,
        ]),
        422,
        'customer purchase rejects insufficient balance'
    );
    app(BalanceService::class)->recharge((int) $team->id, $customerId, '100.00', 'storefront test');
    $orderId = $customerService->purchase((int) $team->id, $customerId, [
        'product_id' => $activeId,
        'quantity' => 2,
        'price' => '0.01',
        'cost' => '0.00',
        'team_cut' => '0.00',
    ]);
    $order = TeamOrder::find($orderId);
    $assert((string) $order->total_price === '60.00' && (string) $order->cost === '18.00', 'customer purchase ignores client money fields');
    $customerOrder = $customerService->order((int) $team->id, $customerId, $orderId);
    $assert(
        !array_key_exists('cost', $customerOrder)
            && !array_key_exists('handler_cut', $customerOrder)
            && !array_key_exists('transaction', $customerOrder),
        'customer order DTO excludes internal cost, cuts and transaction'
    );
    $customerService->cancelOrder((int) $team->id, $customerId, $orderId);
    $customerService->cancelOrder((int) $team->id, $customerId, $orderId);
    $assert(
        (string) TeamCustomerBalance::where('customer_id', $customerId)->value('balance') === '100.00',
        'customer cancellation refunds exactly once'
    );

    $otherTeamData = app(\app\service\Team::class)->create(
        (int) $buyer->id,
        "shop-source-{$suffix}",
        'Source Team'
    );
    $sourceTeam = Team::find((int) $otherTeamData['id']);
    $sourceMember = \app\model\TeamMember::where('team_id', $sourceTeam->id)
        ->where('user_id', $buyer->id)
        ->with(['identity'])
        ->find();
    $rootIssue = app(IdentitySession::class)->receive(
        (int) $buyer->id,
        $deviceToken,
        (string) $sourceMember->slug
    );
    $rootDecoded = app(Jwt::class)->parseToken((string) $rootIssue['token']);
    $sourceSession = app(IdentitySession::class)->session(
        (int) $buyer->id,
        $deviceToken,
        (string) $rootDecoded->jti,
        (string) $rootDecoded->act->type,
        (int) $rootDecoded->act->id
    );
    $entityBound = $binding->bind((int) $team->id, (int) $buyer->id, $deviceToken, $sourceSession);
    $entityCustomer = TeamCustomer::find((int) $entityBound['customer']['id']);
    $assert($entityCustomer->user_id === null && (int) $entityCustomer->owner_entity_id === (int) $sourceSession->entity_id, 'external entity binding has exactly one owner');
    $assert((int) $entityBound['customer']['id'] !== $customerId, 'user and external entity receive separate merchant customer accounts');
    $boundDecoded = app(Jwt::class)->parseToken((string) $entityBound['token']);
    $boundSession = static fn () => app(IdentitySession::class)->session(
        (int) $buyer->id,
        $deviceToken,
        (string) $boundDecoded->jti,
        (string) $boundDecoded->act->type,
        (int) $boundDecoded->act->id
    );
    $assert($boundSession() instanceof EntitySession, 'bound customer session validates through its source entity');
    $sourceMember->status = TeamMemberStatus::Blocked;
    $sourceMember->save();
    $assertThrows($boundSession, 401, 'invalid source entity revokes downstream customer session');
    $sourceMember->status = TeamMemberStatus::Active;
    $sourceMember->save();
    $entityCustomer->is_blocked = 1;
    $entityCustomer->save();
    $assertThrows($boundSession, 401, 'blocked customer revokes downstream customer session');
    $entityCustomer->is_blocked = 0;
    $entityCustomer->save();
    EntitySession::where('jti', (string) $boundDecoded->jti)->update(['revoked_at' => time()]);
    $assertThrows($boundSession, 401, 'revoked customer session cannot be reused');
    $assertThrows(
        fn () => $customerService->order(
            (int) $team->id,
            (int) $entityBound['customer']['id'],
            $orderId
        ),
        404,
        'customer cannot read another customer order'
    );
} finally {
    $db->rollback();
}

if ($failures) {
    fwrite(STDERR, implode(PHP_EOL, $failures) . PHP_EOL);
    exit(1);
}

fwrite(STDOUT, "Shop storefront backend tests passed." . PHP_EOL);
