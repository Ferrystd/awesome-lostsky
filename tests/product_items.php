<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use app\model\{User, Team, TeamProduct, TeamService, BenefitPackage, BenefitPackageService};
use think\App;
use app\service\BenefitPackagePricing;
use think\exception\HttpException;

(new App(dirname(__DIR__)))->initialize();
$grantKey = static function (): string {
    $hex = bin2hex(random_bytes(16));
    return substr($hex, 0, 8) . '-' . substr($hex, 8, 4) . '-' . substr($hex, 12, 4) . '-' . substr($hex, 16, 4) . '-' . substr($hex, 20);
};
$db = app()->db;
$checks = 0;
$check = static function (bool $ok, string $message) use (&$checks): void {
    ++$checks;
    if (!$ok) throw new RuntimeException($message);
};
if (in_array('--migrate', $argv, true)) {
    if (!app()->isDebug() || config('database.connections.mysql.hostname') !== '127.0.0.1'
        || $db->query('SELECT DATABASE() AS db')[0]['db'] !== 'lostsky') {
        throw new RuntimeException('Migration requires the verified local development database');
    }
    $before = $db->query('SELECT id, package_id, service_id, quantity, valid_days, unit_price, unit_cost, unit_handler_cut, unit_sender_cut, unit_cs_cut, sort, create_time, update_time, delete_time FROM benefit_package_service ORDER BY id');
    $entitlements = $db->query('SELECT * FROM team_service_entitlement ORDER BY id');
    $sql = file_get_contents(dirname(__DIR__) . '/sql/patches/20260909_shop_product_items.sql');
    for ($run = 0; $run < 2; ++$run) {
        foreach (explode(';', $sql) as $statement) {
            if (trim($statement) !== '') $db->execute($statement);
        }
    }
    $after = $db->query('SELECT id, package_id, service_id, quantity, valid_days, unit_price, unit_cost, unit_handler_cut, unit_sender_cut, unit_cs_cut, sort, create_time, update_time, delete_time FROM benefit_package_service ORDER BY id');
    $check($before === $after, 'Migration changed historical composition rows');
    $check($entitlements === $db->query('SELECT * FROM team_service_entitlement ORDER BY id'), 'Migration changed granted entitlements');
}
$db->startTrans();
try {
    $suffix = bin2hex(random_bytes(6));
    $user = new User;
    $user->save(['phone' => '14' . str_pad((string) random_int(0, 999999999), 9, '0', STR_PAD_LEFT), 'username' => "items-$suffix", 'password' => password_hash($suffix, PASSWORD_DEFAULT)]);
    $team = new Team;
    $team->save(['slug' => "items-$suffix", 'user_id' => $user->id]);
    $product = new TeamProduct;
    $product->save(['team_id' => $team->id, 'name' => 'Ordinary fixture', 'price' => '10.00']);
    $service = new TeamService;
    $service->save(['team_id' => $team->id, 'name' => 'Service fixture']);
    $package = new BenefitPackage;
    $package->save(['issuer_team_id' => $team->id, 'name' => 'Mixed fixture']);
    $ordinary = new BenefitPackageService;
    $ordinary->save(['package_id' => $package->id, 'product_id' => $product->id, 'service_id' => null, 'quantity' => '2.0000']);
    $legacy = new BenefitPackageService;
    $legacy->save(['package_id' => $package->id, 'service_id' => $service->id, 'product_id' => null, 'quantity' => '0.5000']);
    $read = BenefitPackageService::find($ordinary->id);
    $check($read->service_id === null, 'Null service target must remain null');
    $check((int) $read->product->id === (int) $product->id, 'Product relation');
    $check((int) BenefitPackageService::find($legacy->id)->service->id === (int) $service->id, 'Historical service relation');
    $check((string) BenefitPackageService::find($legacy->id)->quantity === '0.5000', 'Historical fractional service quantity');
    $check($product->compositionReferences()->count() === 1, 'Reverse product relation');
    $pricing = app(BenefitPackagePricing::class);
    $ordinary->save(['unit_price' => '10.00', 'unit_cost' => '2.00', 'unit_handler_cut' => '3.00', 'unit_sender_cut' => '1.00', 'unit_cs_cut' => '0.50']);
    $configuration = $pricing->configuration($package);
    $check($configuration[0]['product_id'] === (int) $product->id && !array_key_exists('service_id', $configuration[0]), 'Product target survives pricing configuration');
    $check($configuration[1]['service_id'] === (int) $service->id && !array_key_exists('product_id', $configuration[1]), 'Historical service configuration unchanged');
    $money = $pricing->itemTotalMoney(BenefitPackageService::find($ordinary->id));
    $check($money === ['total_price' => '20.00', 'cost' => '4.00', 'handler_cut' => '6.00', 'sender_cut' => '2.00', 'cs_cut' => '1.00', 'team_cut' => '7.00'], 'Product item reuses exact item pricing');
    foreach ([
        ['product_id' => $product->id, 'quantity' => '0.5'],
        ['product_id' => $product->id, 'service_id' => $service->id, 'quantity' => 1],
        ['quantity' => 1],
        ['product_id' => 0, 'quantity' => 1],
        ['product_id' => true, 'quantity' => 1],
    ] as $invalid) {
        $rejected = false;
        try { $pricing->normalizeItem($invalid, 0); }
        catch (HttpException $error) { $rejected = $error->getStatusCode() === 422; }
        $check($rejected, 'Invalid product pricing item must be rejected');
    }
    foreach ([['service_id' => null, 'product_id' => null], ['service_id' => $service->id, 'product_id' => $product->id]] as $targets) {
        $rejected = false;
        try {
            (new BenefitPackageService)->save(['package_id' => $package->id] + $targets);
        } catch (\think\db\exception\PDOException $error) {
            $rejected = str_contains($error->getMessage(), 'chk_package_item_target');
        }
        $check($rejected, 'Database must enforce exactly one target');
    }
    $products = app(\app\service\Product::class);
    $redeemableId = $products->create((int) $team->id, [
        'name' => 'Single-step redeemable', 'kind' => 4, 'price' => '10.01', 'cost' => '1.00',
        'handler_cut' => '4.00', 'sender_cut' => '0.00', 'cs_cut' => '0.00',
        'cover_image' => '/fixture.webp',
        'redemption' => ['unit_name' => '小时', 'quantity_step' => '0.5', 'quantity' => '1.5', 'valid_days' => 30],
    ]);
    $redeemable = TeamProduct::find($redeemableId);
    $check($redeemable->enumCase('kind') === \app\enum\ProductKind::Redeemable, 'One-step product kind');
    $check($redeemable->price === '10.01' && $redeemable->team_cut === '5.01', 'Exact full-product price and remainder');
    $items = BenefitPackageService::where('package_id', $redeemable->benefit_package_id)->select();
    $check($items->count() === 1 && $items[0]->quantity === '1.5000', 'Internal configuration created atomically');
    $counts = [TeamProduct::count(), TeamService::count(), BenefitPackage::count()];
    $rejected = false;
    try {
        $products->create((int) $team->id, ['name' => 'Invalid step', 'kind' => 4, 'price' => '10', 'cover_image' => '/fixture.webp', 'redemption' => ['quantity_step' => 1, 'quantity' => '0.5']]);
    } catch (HttpException $error) { $rejected = $error->getStatusCode() === 422; }
    $check($rejected && $counts === [TeamProduct::count(), TeamService::count(), BenefitPackage::count()], 'Invalid configuration rolls back all internal resources');
    $teamEntity = app(\app\service\Entity::class)->claimTeam($team);
    $customer = new \app\model\TeamCustomer;
    $customer->save(['team_id' => $team->id, 'owner_entity_id' => $teamEntity->id, 'is_blocked' => 0]);
    app(\app\service\Entity::class)->claimCustomer((int) $customer->id, "items-customer-$suffix");
    $customer = \app\model\TeamCustomer::find($customer->id);
    $ids = app(\app\service\BenefitFulfillment::class)->grantProduct($redeemable, $customer, 1, null, null);
    $entitlement = \app\model\TeamServiceEntitlement::find($ids[0]);
    $check(count($ids) === 1 && (int) $entitlement->source_product_id === $redeemableId, 'Redeemable product grants existing entitlement type');
    $check((string) $entitlement->total_price === '10.01', 'Grant preserves indivisible cents');
    (new \app\model\TeamCustomerBalance)->save(['customer_id' => $customer->id, 'balance' => '100.00', 'recharged' => '100.00', 'spent' => '0.00']);
    $orders = app(\app\service\Order::class);
    $orderId = $orders->create((int) $team->id, ['product_id' => $redeemableId, 'customer_id' => $customer->id, 'quantity' => 1]);
    $frozenOrder = \app\model\TeamOrder::find($orderId);
    $check(!array_key_exists('fulfillment_snapshot', $frozenOrder->toArray()), 'Internal snapshot is not exposed in order DTO');
    $check($frozenOrder->fulfillment_snapshot['items'][0]['quantity'] === '1.5000', 'Order freezes quota before fulfillment');
    $sourceItem = BenefitPackageService::where('package_id', $redeemable->benefit_package_id)->find();
    $sourceItem->save(['quantity' => '9.0000', 'valid_days' => 1]);
    $sourceItem->service->save(['quantity_step' => '1.0000', 'unit_name' => 'changed', 'is_active' => 0]);
    // Simulate later source changes; purchase promise must survive even a different product type.
    $redeemable->save(['kind' => \app\enum\ProductKind::Standard, 'benefit_package_id' => null]);
    $orders->complete((int) $team->id, $orderId);
    $issued = \app\model\TeamServiceEntitlement::where('source_order_id', $orderId)->select();
    $check($issued->count() === 1 && $issued[0]->total_price === '10.01', 'Purchase and completion grant redeemable entitlement');
    $check($issued[0]->granted_quantity === '1.5000' && $issued[0]->quantity_step === '0.5000' && $issued[0]->unit_name === '小时', 'Old order uses frozen quota and unit despite source changes');
    $check((int) $issued[0]->expire_time > time() + 29 * 86400, 'Old order uses frozen validity');
    $again = app(\app\service\BenefitFulfillment::class)->fulfillOrder(\app\model\TeamOrder::find($orderId));
    $check(count($again['services']) === 1 && \app\model\TeamServiceEntitlement::where('source_order_id', $orderId)->count() === 1, 'Repeated fulfillment does not duplicate entitlement');
    $personal = app(\app\service\ProductSelfManagement::class);
    $actor = ['entity_id' => (int) $teamEntity->id, 'type' => 'team', 'id' => (int) $team->id];
    $ownId = $personal->create((int) $team->id, $actor, (int) $teamEntity->id, [
        'name' => 'Own redeemable', 'kind' => 4, 'price' => '20.00', 'cost' => '0.00', 'cover_image' => '/fixture.webp',
        'redemption' => ['quantity_step' => 1, 'quantity' => 1, 'default_handler_cut' => '0.01'],
    ]);
    $own = TeamProduct::find($ownId);
    $check((int) $own->entity_id === (int) $teamEntity->id && $own->handler_cut === '16.00', 'Personal creation preserves default cuts despite nested money injection');
    $ownItem = BenefitPackageService::where('package_id', $own->benefit_package_id)->find();
    $check((int) $ownItem->service->owner_entity_id === (int) $teamEntity->id, 'Internal service retains personal ownership');
    $oldPackageId = (int) $own->benefit_package_id;
    $oldItemId = (int) $ownItem->id;
    $ownOrderId = $orders->create((int) $team->id, ['product_id' => $ownId, 'customer_id' => $customer->id, 'quantity' => 1]);
    $personal->edit((int) $team->id, $actor, (int) $teamEntity->id, $ownId, [
        'name' => 'Edited redeemable', 'price' => '22.00',
        'redemption' => ['unit_name' => '小时', 'quantity_step' => '0.5', 'quantity' => '2.5', 'valid_days' => 60],
    ]);
    $detail = $personal->get((int) $team->id, $actor, $ownId);
    $check($detail['redemption']['quantity'] === '2.5000' && $detail['redemption']['quantity_step'] === '0.5000', 'Unified edit and detail return quota and step');
    $check($detail['handler_cut'] === '16.00' && $detail['price'] === '22.00', 'Unified edit retains protected personnel cut');
    $check((int) $detail['benefit_package_id'] !== $oldPackageId && BenefitPackageService::find($oldItemId)->quantity === '1.0000', 'Quota edit retains historical item identity');
    $orders->complete((int) $team->id, $ownOrderId);
    $oldIssued = \app\model\TeamServiceEntitlement::where('source_order_id', $ownOrderId)->find();
    $check($oldIssued->granted_quantity === '1.0000' && $oldIssued->total_price === '20.00', 'Pre-edit purchase retains old promise');
    $rejected = false;
    try {
        $personal->edit((int) $team->id, $actor, (int) $teamEntity->id, $ownId, ['name' => 'Must roll back', 'redemption' => ['quantity' => '0.2']]);
    } catch (HttpException $error) { $rejected = $error->getStatusCode() === 422; }
    $check($rejected && TeamProduct::find($ownId)->name === 'Edited redeemable', 'Invalid unified edit rolls back product and service');
    $personal->edit((int) $team->id, $actor, (int) $teamEntity->id, $ownId, ['description' => 'Only description']);
    $check($personal->get((int) $team->id, $actor, $ownId)['redemption']['quantity'] === '2.5000', 'Omitted redemption configuration is preserved');
    $manual = app(\app\service\ManualEntitlementGrant::class);
    $options = $manual->options((int) $team->id, $actor, (int) $teamEntity->id);
    $check(in_array($ownId, array_column($options['products'], 'id'), true), 'Redeemable product appears in direct grant options');
    $ordersBeforeGrant = \app\model\TeamOrder::count();
    $granted = $manual->grant((int) $team->id, (int) $teamEntity->id, ['idempotency_key' => $grantKey(), 'product_id' => $ownId, 'customer_id' => $customer->id, 'quantity' => 1]);
    $manualEntitlement = \app\model\TeamServiceEntitlement::find($granted['entitlement_ids'][0]);
    $check($manualEntitlement->granted_quantity === '2.5000' && $manualEntitlement->total_price === '22.00', 'Direct grant uses current redeemable quota and exact price');
    $check(\app\model\TeamOrder::count() === $ordersBeforeGrant, 'Direct grant does not create a shop order');
    $rejected = false;
    try { $manual->grant((int) $team->id, (int) $teamEntity->id, ['idempotency_key' => $grantKey(), 'product_id' => $product->id, 'customer_id' => $customer->id]); }
    catch (HttpException $error) { $rejected = $error->getStatusCode() === 422; }
    $check($rejected, 'Ordinary product cannot be granted as redeemable entitlement');
    $bundleId = $personal->create((int) $team->id, $actor, (int) $teamEntity->id, [
        'name' => 'Mixed product bundle', 'kind' => 2, 'cover_image' => '/fixture.webp',
        'items' => [['product_id' => (int) $product->id, 'quantity' => 1], ['product_id' => $ownId, 'quantity' => 2]],
    ]);
    $bundleProduct = TeamProduct::find($bundleId);
    $storefrontProjection = new \ReflectionMethod(\app\service\Storefront::class, 'productData');
    $publicBundle = $storefrontProjection->invoke(app(\app\service\Storefront::class), $bundleProduct, true);
    $check($publicBundle['kind'] === 2 && array_column($publicBundle['inclusions'], 'kind') === [4, 4, 1], 'Storefront mixed bundle includes ordinary and redeemable deliveries');
    $check(array_column($publicBundle['handler_groups'], 'product_id') === [(int) $product->id], 'Storefront exposes handler groups only for ordinary child products');
    $check(array_column($publicBundle['inclusions'], 'quantity') === ['2.5000', '2.5000', '1'], 'Storefront keeps redeemable quota distinct from ordinary units');
    foreach ($publicBundle['inclusions'] as $inclusion) {
        $check(array_diff(array_keys($inclusion), ['kind', 'name', 'quantity', 'unit_name', 'quantity_step', 'valid_days']) === [], 'Storefront inclusion projection exposes only public delivery fields');
    }
    $entitlementsBeforeMixedGrant = \app\model\TeamServiceEntitlement::count();
    $rejected = false;
    try { $manual->grant((int) $team->id, (int) $teamEntity->id, ['idempotency_key' => $grantKey(), 'product_id' => $bundleId, 'customer_id' => $customer->id]); }
    catch (HttpException $error) { $rejected = $error->getStatusCode() === 422 && str_contains($error->getMessage(), '通过订单交付'); }
    $check($rejected && \app\model\TeamServiceEntitlement::count() === $entitlementsBeforeMixedGrant, 'Mixed manual grant rejects atomically without turning ordinary products into entitlements');
    $grantBundleId = $personal->create((int) $team->id, $actor, (int) $teamEntity->id, [
        'name' => 'Redeemable grant bundle', 'kind' => 2, 'cover_image' => '/fixture.webp',
        'items' => [['product_id' => $ownId, 'quantity' => 2]],
    ]);
    $bundleGrant = $manual->grant((int) $team->id, (int) $teamEntity->id, ['idempotency_key' => $grantKey(), 'product_id' => $grantBundleId, 'customer_id' => $customer->id, 'quantity' => 2]);
    $check(count($bundleGrant['entitlement_ids']) === 4, 'Manual grant expands redeemable children and bundle copies');
    foreach ($bundleGrant['entitlement_ids'] as $entitlementId) {
        $issued = \app\model\TeamServiceEntitlement::find($entitlementId);
        $check($issued->granted_quantity === '2.5000' && $issued->total_price === '22.00', 'Manual bundle grant preserves child quota and allocated money');
    }
    $check($bundleProduct->price === '54.00', 'Mixed bundle sums ordinary and redeemable prices');
    $check(BenefitPackageService::where('package_id', $bundleProduct->benefit_package_id)->whereNotNull('product_id')->count() === 2, 'Mixed bundle reuses existing composition table');
    $nestedId = $personal->create((int) $team->id, $actor, (int) $teamEntity->id, [
        'name' => 'Nested bundle', 'kind' => 2, 'cover_image' => '/fixture.webp', 'items' => [['product_id' => $bundleId, 'quantity' => 2]],
    ]);
    $check(TeamProduct::find($nestedId)->price === '108.00', 'Nested bundle uses immutable summed amounts');
    \app\model\TeamCustomerBalance::where('customer_id', $customer->id)->update(['balance' => '1000.00']);
    $ordersBeforeOverride = \app\model\TeamOrder::count();
    foreach (['handler_cut', 'sender_cut', 'cs_cut', 'team_cut'] as $field) {
        $rejected = false;
        try {
            $orders->create((int) $team->id, ['product_id' => $nestedId, 'customer_id' => $customer->id, $field => '0.00']);
        } catch (HttpException $error) {
            $rejected = $error->getStatusCode() === 422;
        }
        $check($rejected, 'Nested order rejects explicit split overrides: ' . $field);
    }
    $check(\app\model\TeamOrder::count() === $ordersBeforeOverride, 'Rejected nested overrides create no orders');
    $check(\app\model\TeamCustomerBalance::where('customer_id', $customer->id)->value('balance') === '1000.00', 'Rejected nested overrides do not consume balance');
    foreach ([[$bundleId, 2, '44.00'], [$nestedId, 4, '88.00']] as [$saleProductId, $expectedCount, $expectedAmount]) {
        $mixedOrderId = $orders->create((int) $team->id, ['product_id' => $saleProductId, 'customer_id' => $customer->id, 'quantity' => 1]);
        $orders->complete((int) $team->id, $mixedOrderId);
        $mixedEntitlements = \app\model\TeamServiceEntitlement::where('source_order_id', $mixedOrderId)->select();
        $check($mixedEntitlements->count() === $expectedCount, 'Only redeemable children generate entitlements in mixed and nested bundles');
        $sum = 0;
        foreach ($mixedEntitlements as $entry) {
            $check($entry->granted_quantity === '2.5000', 'Each redeemable child preserves its quota');
            $sum += app(BenefitPackagePricing::class)->toCents($entry->total_price);
        }
        $check(app(BenefitPackagePricing::class)->fromCents($sum) === $expectedAmount, 'Ordinary item price is not allocated into redeemable entitlements');
    }
    (new \app\model\TeamAbility)->save(['team_id' => (int) $team->id, 'ability_key' => 'transaction', 'level' => 1, 'expire_time' => 0]);
    $balanceBeforeSplit = \app\model\TeamCustomerBalance::where('customer_id', $customer->id)->value('balance');
    $splitOrderId = $orders->create((int) $team->id, ['product_id' => $nestedId, 'customer_id' => $customer->id, 'quantity' => 2, 'sender_entity_id' => (int) $teamEntity->id]);
    $splitOrder = \app\model\TeamOrder::find($splitOrderId);
    $splitIds = $splitOrder->fulfillment_snapshot['transaction_ids'];
    $splitRows = \app\model\TeamTransaction::whereIn('id', $splitIds)->select();
    $receiptTotal = 0;
    $ordinaryTotal = 0;
    foreach ($splitRows as $row) {
        $receiptTotal += app(BenefitPackagePricing::class)->toCents($row->prepaid);
        if ($row->enumCase('type') === \app\enum\TransactionType::ShopOrder) {
            $ordinaryTotal += app(BenefitPackagePricing::class)->toCents($row->total_price);
            $check((int) $row->handler_entity_id === (int) $teamEntity->id, 'Ordinary child uses existing default handler');
            $check($row->service_credit === '0.00', 'Ordinary child is not a redemption credit');
        }
    }
    $check($receiptTotal === 21600 && $ordinaryTotal === 4000, 'Mixed nested sale splits ordinary performance without duplicating receipts');
    $stats = app(\app\service\TransactionStats::class);
    $personalStats = $stats->personal((int) $team->id, (int) $teamEntity->id, 0, time() + 1);
    $check((int) $personalStats['sender_count'] === 1, 'Personal stats count a split bundle purchase only once');
    $peopleStats = $stats->byPerson((int) $team->id, 0, time() + 1);
    $teamPerson = array_values(array_filter($peopleStats['list'], static fn ($row) => (int) $row['entity_id'] === (int) $teamEntity->id))[0];
    $check((int) $teamPerson['sender_count'] === 1, 'Person stats use the same split-purchase sender count');
    $check(app(BenefitPackagePricing::class)->toCents($balanceBeforeSplit) - app(BenefitPackagePricing::class)->toCents(\app\model\TeamCustomerBalance::where('customer_id', $customer->id)->value('balance')) === 21600, 'Split transactions consume exactly the order total');
    $orders->cancel((int) $team->id, $splitOrderId);
    $orders->cancel((int) $team->id, $splitOrderId);
    $check(\app\model\TeamCustomerBalance::where('customer_id', $customer->id)->value('balance') === $balanceBeforeSplit, 'Repeated cancellation refunds split order exactly once');
    $check(\app\model\TeamTransaction::whereIn('id', $splitIds)->count() === 0, 'Cancellation removes every associated split transaction');
    $check(\app\model\TeamServiceEntitlement::where('source_order_id', $splitOrderId)->count() === 0, 'Cancelled mixed sale creates no redemption entitlements');
    foreach ([
        ['name' => 'Bad shared pricing', 'kind' => 2, 'cover_image' => '/fixture.webp', 'items' => [['product_id' => (int) $product->id, 'quantity' => 1, 'unit_price' => '11.00']]],
        ['name' => 'Bad nested pricing', 'kind' => 2, 'cover_image' => '/fixture.webp', 'price' => '1.00', 'items' => [['product_id' => $bundleId, 'quantity' => 1]]],
        ['name' => 'Bad nested item pricing', 'kind' => 2, 'cover_image' => '/fixture.webp', 'items' => [['product_id' => $bundleId, 'quantity' => 1, 'unit_price' => '55.00']]],
    ] as $invalid) {
        $rejected = false;
        try { $personal->create((int) $team->id, $actor, (int) $teamEntity->id, $invalid); }
        catch (HttpException $error) { $rejected = $error->getStatusCode() === 422; }
        $check($rejected, 'Composition cannot bypass shared or nested pricing locks');
    }
    $rejected = false;
    try { $products->create((int) $team->id, ['name' => 'Public leakage', 'kind' => 2, 'cover_image' => '/fixture.webp', 'items' => [['product_id' => $ownId, 'quantity' => 1]]]); }
    catch (HttpException $error) { $rejected = $error->getStatusCode() === 422; }
    $check($rejected, 'Public bundle cannot contain private product');
    $cardCampaign = new \app\model\RedemptionCampaign;
    $cardCampaign->save(['issuer_team_id' => (int) $team->id, 'owner_entity_id' => (int) $teamEntity->id,
        'package_id' => TeamProduct::find($ownId)->benefit_package_id, 'name' => 'Frozen card fixture', 'mode' => 1, 'claim_group' => '']);
    $cardId = $products->create((int) $team->id, ['name' => 'Frozen card', 'entity_id' => (int) $teamEntity->id,
        'kind' => 3, 'redemption_campaign_id' => (int) $cardCampaign->id, 'price' => '22.00', 'cover_image' => '/fixture.webp']);
    $cardOrderId = $orders->create((int) $team->id, ['product_id' => $cardId, 'customer_id' => $customer->id]);
    $directPackage = BenefitPackage::find((int) $cardCampaign->package_id);
    $savedPricingMode = $directPackage->enumCase('pricing_mode')->value;
    BenefitPackage::where('id', $directPackage->id)->update(['pricing_mode' => 1]);
    $directQuotaCard = app(\app\service\Redemption::class)->issue((int) $cardCampaign->id, (int) $customer->root_entity_id);
    BenefitPackage::where('id', $directPackage->id)->update(['pricing_mode' => $savedPricingMode]);
    TeamProduct::where('id', $cardId)->update(['kind' => 1, 'redemption_campaign_id' => null]);
    $cardItem = BenefitPackageService::where('package_id', $cardCampaign->package_id)->find();
    BenefitPackageService::where('id', $cardItem->id)->update(['quantity' => '9.0000']);
    $orders->complete((int) $team->id, $cardOrderId);
    $code = \app\model\RedemptionCode::where('source_order_id', $cardOrderId)->find();
    $check((int) $code->campaign_id === (int) $cardCampaign->id, 'Card issuance uses purchased campaign after product changes');
    $plain = app(\app\service\RedemptionCrypto::class)->decrypt($code->code_ciphertext);
    BenefitPackageService::where('id', $cardItem->id)->update(['delete_time' => time()]);
    $inspection = app(\app\service\Redemption::class)->inspect($plain);
    $check($inspection['services'][0]['quantity'] === '2.5000', 'Card inspection previews the purchased quota after source item deletion');
    $check($code->fulfillment_snapshot['items'][0]['service']['default_total_price'] === (string) $cardItem->service->default_total_price, 'Card snapshot includes service default money for direct issuance settlement');
    $check(!array_key_exists('default_total_price', $inspection['services'][0]['service']) && !array_key_exists('default_handler_cut', $inspection['services'][0]['service']), 'Card inspection excludes nested service settlement defaults');
    $check(array_intersect(['allocated_money', 'unit_cost', 'unit_handler_cut', 'unit_sender_cut', 'unit_cs_cut'], array_keys($inspection['services'][0])) === [], 'Card inspection does not expose snapshot settlement fields');
    $claimId = app(\app\service\Redemption::class)->claimForCustomer($plain, (int) $team->id, (int) $customer->id, (int) $customer->root_entity_id);
    $cardEntitlement = \app\model\TeamServiceEntitlement::where('source_claim_id', $claimId)->find();
    $check($cardEntitlement->granted_quantity === '2.5000', 'Card redemption preserves purchased quota after package changes');
    $check((int) $cardEntitlement->source_package_item_id === (int) $cardItem->id, 'Frozen card remains redeemable after current source item is removed');
    $directQuotaClaim = app(\app\service\Redemption::class)->claimForCustomer(app(\app\service\RedemptionCrypto::class)->decrypt($directQuotaCard->code_ciphertext), (int) $team->id, (int) $customer->id, (int) $customer->root_entity_id);
    $directQuotaEntitlement = \app\model\TeamServiceEntitlement::where('source_claim_id', $directQuotaClaim)->find();
    $expectedDirectCents = intdiv(app(BenefitPackagePricing::class)->toCents((string) $cardItem->service->default_total_price) * 25000 + 5000, 10000);
    $check(app(BenefitPackagePricing::class)->toCents($directQuotaEntitlement->total_price) === $expectedDirectCents && $expectedDirectCents > 0, 'Direct non-itemized card redeems frozen nonzero service defaults after source removal');
    BenefitPackageService::withTrashed()->where('id', $cardItem->id)->update(['quantity' => $cardItem->quantity, 'delete_time' => $cardItem->delete_time]);
    $mixedCardId = $products->create((int) $team->id, ['name' => 'Mixed card', 'entity_id' => (int) $teamEntity->id,
        'kind' => 3, 'items' => [['product_id' => $bundleId, 'quantity' => 1]], 'cover_image' => '/fixture.webp']);
    $check(TeamProduct::find($mixedCardId)->price === '54.00', 'Card target creates internal campaign and derives bundle price');
    $mixedCardOrderId = $orders->create((int) $team->id, ['product_id' => $mixedCardId, 'customer_id' => $customer->id]);
    $orders->complete((int) $team->id, $mixedCardOrderId);
    $mixedCode = \app\model\RedemptionCode::where('source_order_id', $mixedCardOrderId)->find();
    $mixedPlain = app(\app\service\RedemptionCrypto::class)->decrypt($mixedCode->code_ciphertext);
    $mixedClaimId = app(\app\service\Redemption::class)->claimForCustomer($mixedPlain, (int) $team->id, (int) $customer->id, (int) $customer->root_entity_id);
    $mixedClaimEntries = \app\model\TeamServiceEntitlement::where('source_claim_id', $mixedClaimId)->select();
    $check($mixedClaimEntries->count() === 2, 'Mixed card grants only its two redeemable children');
    $claimTotal = 0;
    foreach ($mixedClaimEntries as $entry) {
        $check($entry->granted_quantity === '2.5000', 'Mixed card preserves child quota without treating it as product count');
        $claimTotal += app(BenefitPackagePricing::class)->toCents($entry->total_price);
    }
    $check($claimTotal === 4400, 'Mixed card excludes ordinary amount from redeemable allocation');
    $ordinaryDelivery = \app\model\TeamOrder::where('source_claim_id', $mixedClaimId)->find();
    $check($ordinaryDelivery !== null && $ordinaryDelivery->total_price === '10.00', 'Mixed card records ordinary delivery as an order');
    $check($ordinaryDelivery->cash === '0.00' && $ordinaryDelivery->prepaid === '0.00', 'Ordinary redemption order does not charge again');
    $ordinaryLedger = \app\model\TeamTransaction::find($ordinaryDelivery->trans_id);
    $check($ordinaryLedger->enumCase('type') === \app\enum\TransactionType::ShopOrder && $ordinaryLedger->service_instance_id === null, 'Ordinary redemption uses ordinary ledger without redemption task');
    $check($ordinaryLedger->cash === '0.00' && $ordinaryLedger->prepaid === '0.00' && $ordinaryLedger->service_credit === '10.00', 'Ordinary redemption records performance but no new receipt');
    $ordinaryClaim = \app\model\RedemptionClaim::find($mixedClaimId);
    app(\app\service\BenefitFulfillment::class)->servicesFromClaim($ordinaryClaim, (int) $team->id, (int) $customer->id, (int) $customer->root_entity_id);
    $check(\app\model\TeamOrder::where('source_claim_id', $mixedClaimId)->count() === 1, 'Repeated mixed fulfillment does not duplicate ordinary delivery');
    $ordinaryCardId = $products->create((int) $team->id, ['name' => 'Ordinary card', 'entity_id' => (int) $teamEntity->id,
        'kind' => 3, 'items' => [['product_id' => (int) $product->id, 'quantity' => 2]], 'cover_image' => '/fixture.webp']);
    $ordinaryCardOrderId = $orders->create((int) $team->id, ['product_id' => $ordinaryCardId, 'customer_id' => $customer->id, 'sender_entity_id' => (int) $teamEntity->id]);
    $directCard = app(\app\service\Redemption::class)->issue((int) TeamProduct::find($ordinaryCardId)->redemption_campaign_id, (int) $customer->root_entity_id);
    $check($directCard->fulfillment_snapshot['ordinary'][0]['quantity'] === 2 && (int) $directCard->fulfillment_snapshot['ordinary'][0]['handler_entity_id'] === (int) $teamEntity->id, 'Direct product card issuance freezes ordinary quantity and handler without an order');
    $handlerRows = [];
    foreach ([$teamEntity->id, $customer->root_entity_id] as $handlerEntityId) {
        $handlerRow = new \app\model\TeamProductHandler;
        $handlerRow->save(['product_id' => $product->id, 'entity_id' => $handlerEntityId]);
        $handlerRows[] = $handlerRow;
    }
    $beforeRejectedPurchase = \app\model\TeamOrder::count();
    $beforeRejectedBalance = \app\model\TeamCustomerBalance::where('customer_id', $customer->id)->value('balance');
    $rejected = false;
    try { $orders->create((int) $team->id, ['product_id' => $ordinaryCardId, 'customer_id' => $customer->id]); }
    catch (HttpException $error) { $rejected = $error->getStatusCode() === 422 && $error->getMessage() === '请选择接单人'; }
    $check($rejected && \app\model\TeamOrder::count() === $beforeRejectedPurchase && \app\model\TeamCustomerBalance::where('customer_id', $customer->id)->value('balance') === $beforeRejectedBalance, 'Ambiguous ordinary card handler is rejected before purchase and debit');
    $mappedOrderId = $orders->create((int) $team->id, ['product_id' => $ordinaryCardId, 'customer_id' => $customer->id,
        'product_handlers' => [(int) $product->id => (int) $teamEntity->id]]);
    $check((int) \app\model\TeamOrder::find($mappedOrderId)->fulfillment_snapshot['target']['ordinary'][0]['handler_entity_id'] === (int) $teamEntity->id, 'Per-product handler selection is frozen through a card target');
    $orders->cancel((int) $team->id, $mappedOrderId);
    $rejected = false;
    try { $orders->create((int) $team->id, ['product_id' => $ordinaryCardId, 'customer_id' => $customer->id,
        'product_handlers' => [(int) $product->id => (int) $teamEntity->id, $ownId => (int) $teamEntity->id]]); }
    catch (HttpException $error) { $rejected = $error->getStatusCode() === 422; }
    $check($rejected, 'Per-product handler input rejects products outside ordinary delivery items');
    $orders->complete((int) $team->id, $ordinaryCardOrderId);
    $ordinaryCode = \app\model\RedemptionCode::where('source_order_id', $ordinaryCardOrderId)->find();
    $balanceAtClaim = \app\model\TeamCustomerBalance::where('customer_id', $customer->id)->value('balance');
    $ordinaryPlain = app(\app\service\RedemptionCrypto::class)->decrypt($ordinaryCode->code_ciphertext);
    $sentBeforeClaim = $stats->personal((int) $team->id, (int) $teamEntity->id, 0, time() + 1)['sender_count'];
    $ordinaryClaimId = app(\app\service\Redemption::class)->claimForCustomer($ordinaryPlain, (int) $team->id, (int) $customer->id, (int) $customer->root_entity_id);
    $check((int) $stats->personal((int) $team->id, (int) $teamEntity->id, 0, time() + 1)['sender_count'] === (int) $sentBeforeClaim, 'Ordinary card delivery does not count another sent order');
    $check((int) \app\model\TeamOrder::where('source_claim_id', $ordinaryClaimId)->value('handler_entity_id') === (int) $teamEntity->id, 'Purchased ordinary card keeps its frozen handler after candidate pool changes');
    $directPlain = app(\app\service\RedemptionCrypto::class)->decrypt($directCard->code_ciphertext);
    $directClaimId = app(\app\service\Redemption::class)->claimForCustomer($directPlain, (int) $team->id, (int) $customer->id, (int) $customer->root_entity_id);
    $check((int) \app\model\TeamOrder::where('source_claim_id', $directClaimId)->value('handler_entity_id') === (int) $teamEntity->id && \app\model\TeamServiceEntitlement::where('source_claim_id', $directClaimId)->count() === 0, 'Direct ordinary card uses issued handler snapshot and creates no entitlement');
    foreach ($handlerRows as $handlerRow) $handlerRow->delete();
    app(\app\service\BenefitFulfillment::class)->servicesFromClaim(\app\model\RedemptionClaim::find($ordinaryClaimId), (int) $team->id, (int) $customer->id, (int) $customer->root_entity_id);
    $check(\app\model\TeamOrder::where('source_claim_id', $ordinaryClaimId)->count() === 1, 'Ordinary-only card delivery is idempotent without any entitlements');
    $check(\app\model\TeamServiceEntitlement::where('source_claim_id', $ordinaryClaimId)->count() === 0, 'Ordinary-only card creates no redemption entitlement');
    $check(\app\model\TeamCustomerBalance::where('customer_id', $customer->id)->value('balance') === $balanceAtClaim, 'Ordinary card claim leaves prepaid balance unchanged');
    $innerCardId = $products->create((int) $team->id, ['name' => 'Inner card', 'entity_id' => (int) $teamEntity->id,
        'kind' => 3, 'items' => [['product_id' => $ownId, 'quantity' => 1]], 'cover_image' => '/fixture.webp']);
    $outerCardId = $products->create((int) $team->id, ['name' => 'Outer card', 'entity_id' => (int) $teamEntity->id,
        'kind' => 3, 'items' => [['product_id' => $innerCardId, 'quantity' => 2]], 'cover_image' => '/fixture.webp']);
    $innerPackageId = \app\model\RedemptionCampaign::find(TeamProduct::find($innerCardId)->redemption_campaign_id)->package_id;
    $outerPackageId = \app\model\RedemptionCampaign::find(TeamProduct::find($outerCardId)->redemption_campaign_id)->package_id;
    $innerItem = BenefitPackageService::where('package_id', $innerPackageId)->find();
    $outerItem = BenefitPackageService::where('package_id', $outerPackageId)->find();
    // 模拟已保存来源后来变化，购买快照必须重新检查，不能只依赖创建时校验。
    BenefitPackageService::where('id', $innerItem->id)->update(['product_id' => $product->id, 'quantity' => '100.0000']);
    BenefitPackageService::where('id', $outerItem->id)->update(['quantity' => '100.0000']);
    $boundedSnapshot = app(\app\service\BenefitFulfillment::class)->snapshotProduct(TeamProduct::find($outerCardId));
    $check($boundedSnapshot['target']['cards'][0]['quantity'] === 100, 'Exactly 10000 ordinary units through nested cards remains valid');
    BenefitPackageService::where('id', $outerItem->id)->update(['quantity' => '101.0000']);
    $rejected = false;
    try { app(\app\service\BenefitFulfillment::class)->snapshotProduct(TeamProduct::find($outerCardId)); }
    catch (HttpException $error) { $rejected = $error->getStatusCode() === 422; }
    $check($rejected, 'Snapshot rejects nested card quantities expanding to over 10000 ordinary units');
    BenefitPackageService::where('id', $innerItem->id)->update(['product_id' => $ownId, 'quantity' => '1.0000']);
    BenefitPackageService::where('id', $outerItem->id)->update(['quantity' => '2.0000']);
    $outerOrderId = $orders->create((int) $team->id, ['product_id' => $outerCardId, 'customer_id' => $customer->id, 'cs_entity_id' => (int) $teamEntity->id]);
    $orders->complete((int) $team->id, $outerOrderId);
    $originalAssignee = $customer->assignee_entity_id;
    \app\model\TeamCustomer::where('id', $customer->id)->update(['assignee_entity_id' => $teamEntity->id]);
    $outerCode = \app\model\RedemptionCode::where('source_order_id', $outerOrderId)->find();
    $outerPlain = app(\app\service\RedemptionCrypto::class)->decrypt($outerCode->code_ciphertext);
    $outerClaimId = app(\app\service\Redemption::class)->claimForCustomer($outerPlain, (int) $team->id, (int) $customer->id, (int) $customer->root_entity_id);
    $innerCodes = \app\model\RedemptionCode::where('source_claim_id', $outerClaimId)->select();
    $check($innerCodes->count() === 2, 'Outer card issues the configured inner card quantity');
    $check(\app\model\TeamServiceEntitlement::where('source_claim_id', $outerClaimId)->count() === 0, 'Outer redemption stops at inner card boundary');
    $innerPlain = app(\app\service\RedemptionCrypto::class)->decrypt($innerCodes[0]->code_ciphertext);
    $innerClaimId = app(\app\service\Redemption::class)->claimForCustomer($innerPlain, (int) $team->id, (int) $customer->id, (int) $customer->root_entity_id);
    $innerEntitlement = \app\model\TeamServiceEntitlement::where('source_claim_id', $innerClaimId)->find();
    $check((int) $innerEntitlement->cs_entity_id === (int) $teamEntity->id, 'Nested card retains original order customer service entity');
    $check(empty($innerEntitlement->sender_entity_id), 'Nested card preserves absent order sender despite reassignment before claim');
    $check((int) $innerEntitlement->source_product_id === $outerCardId, 'Nested entitlement retains the original purchased product source');
    \app\model\TeamCustomer::where('id', $customer->id)->update(['assignee_entity_id' => $originalAssignee]);
    $check($innerEntitlement->granted_quantity === '2.5000' && $innerEntitlement->total_price === '22.00', 'Inner card separately redeems its frozen quota and money');
    $check(!array_key_exists('fulfillment_snapshot', $innerCodes[0]->toArray()), 'Card internal snapshot is not exposed');
    $legacyInnerId = $products->create((int) $team->id, ['name' => 'Legacy inner card', 'entity_id' => (int) $teamEntity->id,
        'kind' => 3, 'redemption_campaign_id' => (int) $cardCampaign->id, 'price' => '22.00', 'cover_image' => '/fixture.webp']);
    $legacyOuterId = $products->create((int) $team->id, ['name' => 'Legacy nested card', 'entity_id' => (int) $teamEntity->id,
        'kind' => 3, 'items' => [['product_id' => $legacyInnerId, 'quantity' => 2]], 'cover_image' => '/fixture.webp']);
    $legacyOrderId = $orders->create((int) $team->id, ['product_id' => $legacyOuterId, 'customer_id' => $customer->id]);
    $orders->complete((int) $team->id, $legacyOrderId);
    $legacyOuterCode = \app\model\RedemptionCode::where('source_order_id', $legacyOrderId)->find();
    $legacyOuterClaim = app(\app\service\Redemption::class)->claimForCustomer(
        app(\app\service\RedemptionCrypto::class)->decrypt($legacyOuterCode->code_ciphertext), (int) $team->id, (int) $customer->id, (int) $customer->root_entity_id);
    $legacyInnerCodes = \app\model\RedemptionCode::where('source_claim_id', $legacyOuterClaim)->select();
    $legacyTotal = 0;
    foreach ($legacyInnerCodes as $legacyCode) {
        $legacyClaim = app(\app\service\Redemption::class)->claimForCustomer(
            app(\app\service\RedemptionCrypto::class)->decrypt($legacyCode->code_ciphertext), (int) $team->id, (int) $customer->id, (int) $customer->root_entity_id);
        $legacyEntitlement = \app\model\TeamServiceEntitlement::where('source_claim_id', $legacyClaim)->find();
        $legacyTotal += app(BenefitPackagePricing::class)->toCents($legacyEntitlement->total_price);
    }
    $check($legacyTotal === 4400, 'Nested legacy card allocations conserve purchased amount instead of using service defaults');
    $editableId = $products->create((int) $team->id, ['name' => 'Editable bundle', 'kind' => 2,
        'entity_id' => (int) $teamEntity->id, 'items' => [['product_id' => $ownId, 'quantity' => 1]], 'cover_image' => '/fixture.webp']);
    $oldPackageId = TeamProduct::find($editableId)->benefit_package_id;
    $oldOrderId = $orders->create((int) $team->id, ['product_id' => $editableId, 'customer_id' => $customer->id]);
    $products->edit((int) $team->id, $editableId, ['items' => [['product_id' => $ownId, 'quantity' => 2]]]);
    $edited = $products->get((int) $team->id, $editableId);
    $check($edited['price'] === '44.00' && $edited['items'][0]['quantity'] === 2, 'Composition edit retains product and exposes current item quantity');
    $check((int) $edited['benefit_package_id'] !== (int) $oldPackageId && BenefitPackageService::where('package_id', $oldPackageId)->count() === 1, 'Composition edit preserves old internal rows');
    $orders->complete((int) $team->id, $oldOrderId);
    $check(\app\model\TeamServiceEntitlement::where('source_order_id', $oldOrderId)->count() === 1, 'Pre-edit order delivers original composition');
    $rejected = false;
    try { $products->edit((int) $team->id, $bundleId, ['items' => [['product_id' => $nestedId, 'quantity' => 1]]]); }
    catch (HttpException $error) { $rejected = $error->getStatusCode() === 422; }
    $check($rejected, 'Composition edit rejects indirect self reference');
    $rejected = false;
    try { $personal->edit((int) $team->id, $actor, (int) $teamEntity->id, $editableId, ['items' => [['product_id' => (int) $product->id, 'quantity' => 1, 'unit_price' => '1.00']]]); }
    catch (HttpException $error) { $rejected = $error->getStatusCode() === 422; }
    $check($rejected, 'Personal composition edit retains public item pricing protection');
    $savedAmounts = $products->get((int) $team->id, $editableId)['items'][0];
    $originalCut = TeamProduct::find($ownId)->handler_cut;
    TeamProduct::where('id', $ownId)->update(['handler_cut' => '1.00']);
    $personal->edit((int) $team->id, $actor, (int) $teamEntity->id, $editableId, ['items' => [['product_id' => $ownId, 'quantity' => 3]]]);
    $preservedItem = $products->get((int) $team->id, $editableId)['items'][0];
    $check($preservedItem['unit_handler_cut'] === $savedAmounts['unit_handler_cut'], 'Composition edit does not inherit changed source split without permission');
    $check($preservedItem['unit_price'] === $savedAmounts['unit_price'], 'Omitted composition price preserves saved unit price');
    TeamProduct::where('id', $ownId)->update(['handler_cut' => $originalCut]);
    $publicCardId = $products->create((int) $team->id, ['name' => 'Public ownership fixture', 'kind' => 3,
        'items' => [['product_id' => (int) $product->id, 'quantity' => 1]], 'cover_image' => '/fixture.webp']);
    $publicCard = TeamProduct::find($publicCardId);
    $publicCampaign = \app\model\RedemptionCampaign::find($publicCard->redemption_campaign_id);
    \app\model\RedemptionCampaign::where('id', $publicCampaign->id)->update(['owner_entity_id' => $teamEntity->id]);
    $rejected = false;
    try { $products->create((int) $team->id, ['name' => 'Must reject private campaign', 'kind' => 2,
        'items' => [['product_id' => $publicCardId, 'quantity' => 1]], 'cover_image' => '/fixture.webp']); }
    catch (HttpException $error) { $rejected = $error->getStatusCode() === 422; }
    $check($rejected, 'Public composition cannot indirectly use a private campaign');
    \app\model\RedemptionCampaign::where('id', $publicCampaign->id)->update(['owner_entity_id' => null]);
    BenefitPackage::where('id', $publicCampaign->package_id)->update(['owner_entity_id' => $teamEntity->id]);
    $rejected = false;
    try { app(\app\service\BenefitFulfillment::class)->snapshotProduct($publicCard); }
    catch (HttpException $error) { $rejected = $error->getStatusCode() === 422; }
    $check($rejected, 'Purchase snapshot rejects a private package under a public product');
    BenefitPackage::where('id', $publicCampaign->package_id)->update(['owner_entity_id' => null]);
    $ownProduct = TeamProduct::find($ownId);
    $ownServiceId = BenefitPackageService::where('package_id', $ownProduct->benefit_package_id)->value('service_id');
    $originalServiceOwner = TeamService::find($ownServiceId)->owner_entity_id;
    TeamService::where('id', $ownServiceId)->update(['owner_entity_id' => $customer->root_entity_id]);
    $rejected = false;
    try { app(\app\service\BenefitFulfillment::class)->snapshotProduct($ownProduct); }
    catch (HttpException $error) { $rejected = $error->getStatusCode() === 422; }
    $check($rejected, 'Purchase snapshot rejects another entity service inside a redeemable product');
    TeamService::where('id', $ownServiceId)->update(['owner_entity_id' => $originalServiceOwner]);
    $beforeAtomic = TeamProduct::count();
    foreach ([[$editableId, 'benefit_package_id', $cardCampaign->package_id], [$innerCardId, 'redemption_campaign_id', $cardCampaign->id]] as [$composedId, $relation, $replacement]) {
        $originalRelation = TeamProduct::find($composedId)->{$relation};
        $rejected = false;
        try { $products->edit((int) $team->id, $composedId, [$relation => $replacement]); }
        catch (HttpException $error) { $rejected = $error->getStatusCode() === 422; }
        $check($rejected && TeamProduct::find($composedId)->{$relation} === $originalRelation, 'Internal resource replacement cannot bypass composition validation');
    }
    foreach ([(int) $product->id, $ownId, $editableId, $innerCardId] as $immutableId) {
        $original = TeamProduct::find($immutableId);
        foreach ([1, 2, 3, 4] as $newKind) {
            if ($newKind === $original->enumCase('kind')->value) continue;
            $rejected = false;
            try { $products->edit((int) $team->id, $immutableId, ['name' => 'Must not change', 'kind' => $newKind]); }
            catch (HttpException $error) { $rejected = $error->getStatusCode() === 422; }
            $unchanged = TeamProduct::find($immutableId);
            $check($rejected && $unchanged->name === $original->name && $unchanged->enumCase('kind') === $original->enumCase('kind'),
                'All product kind conversions are rejected atomically, including referenced ordinary items');
        }
    }
    $rejected = false;
    try { $products->create((int) $team->id, ['name' => 'Invalid handler atomic', 'price' => '10.00', 'cover_image' => '/fixture.webp', 'handler_entity_ids' => [PHP_INT_MAX]]); }
    catch (HttpException $error) { $rejected = true; }
    $check($rejected && TeamProduct::count() === $beforeAtomic, 'Invalid handler rolls back product creation');
    $oldName = TeamProduct::find($editableId)->name;
    $rejected = false;
    try { $products->edit((int) $team->id, $editableId, ['name' => 'Must rollback', 'handler_entity_ids' => [PHP_INT_MAX]]); }
    catch (HttpException $error) { $rejected = true; }
    $check($rejected && TeamProduct::find($editableId)->name === $oldName, 'Invalid handler rolls back product edit');
    $products->edit((int) $team->id, $editableId, ['handler_entity_ids' => [(int) $teamEntity->id]]);
    $check(\app\model\TeamProductHandler::where('product_id', $editableId)->where('entity_id', $teamEntity->id)->count() === 1, 'Valid handler configuration is saved with product');
    $otherProduct = new TeamProduct;
    $otherProduct->save(['team_id' => (int) $team->id, 'entity_id' => (int) $customer->root_entity_id, 'name' => 'Other entity product', 'price' => '1.00']);
    $productCandidates = app(\app\service\EntitlementManagement::class)->personalOptions((int) $team->id, (int) $teamEntity->id)['products'];
    $candidateIds = array_column($productCandidates, 'id');
    $check(in_array($ownId, $candidateIds, true) && in_array((int) $product->id, $candidateIds, true), 'Personal candidates include own and public products');
    $check(count(array_filter($productCandidates, fn ($row) => $row['entity_id'] !== null && (int) $row['entity_id'] !== (int) $teamEntity->id)) === 0, 'Personal candidates exclude other entity ownership');
    $check(!in_array((int) $otherProduct->id, $candidateIds, true), 'Other existing private product is not leaked in personal options');
    TeamProduct::where('id', $editableId)->update(['is_active' => 0]);
    $activeCandidates = app(\app\service\EntitlementManagement::class)->personalOptions((int) $team->id, (int) $teamEntity->id)['products'];
    $check(!in_array($editableId, array_column($activeCandidates, 'id'), true), 'Composition candidates omit inactive products');
    foreach ([new \app\shop\controller\Product, new \app\shop\controller\PersonalProduct] as $controller) {
        $request = (new \think\Request)->withPost([
            'name' => 'Controller redeemable', 'kind' => 4, 'price' => '12.00', 'cost' => '0.00', 'cover_image' => '/fixture.webp',
            'expected_entity_id' => (int) $teamEntity->id,
            'redemption' => ['unit_name' => '次', 'quantity_step' => '1', 'quantity' => '2'],
        ]);
        $request->team_id = (int) $team->id;
        $request->entity_id = (int) $teamEntity->id;
        $request->acting_entity = $actor;
        $request->authenticated_user_id = (int) $user->id;
        $response = $controller->create($request)->getData();
        $created = TeamProduct::find($response['data']['id']);
        $check($created->enumCase('kind') === \app\enum\ProductKind::Redeemable, 'Controller forwards redemption configuration');
        $check(BenefitPackageService::where('package_id', $created->benefit_package_id)->find()->quantity === '2.0000', 'Controller preserves configured quota');
        $request->withRoute(['id' => (int) $created->id])->withPost([
            'expected_entity_id' => (int) $teamEntity->id,
            'redemption' => ['quantity' => '3'],
        ]);
        $controller->edit($request);
        $check($products->get((int) $team->id, (int) $created->id)['redemption']['quantity'] === '3.0000', 'Controller forwards partial redemption edit');
        $request->withPost(['name' => 'Controller bundle', 'kind' => 2, 'cover_image' => '/fixture.webp',
            'entity_id' => (int) $teamEntity->id, 'expected_entity_id' => (int) $teamEntity->id,
            'items' => [['product_id' => $ownId, 'quantity' => 1]]]);
        $response = $controller->create($request)->getData();
        $controllerBundleId = (int) $response['data']['id'];
        $check(TeamProduct::find($controllerBundleId)->price === '22.00', 'Controller creates composition without caller supplied price');
        $request->withRoute(['id' => $controllerBundleId])->withPost(['expected_entity_id' => (int) $teamEntity->id,
            'items' => [['product_id' => $ownId, 'quantity' => 2]]]);
        $controller->edit($request);
        $check($products->get((int) $team->id, $controllerBundleId)['items'][0]['quantity'] === 2, 'Controller forwards composition replacement');
    }
} finally {
    $db->rollback();
}
echo "Product items: {$checks} assertions passed; fixtures rolled back.\n";
