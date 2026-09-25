<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';
(new \think\App(dirname(__DIR__)))->initialize();
$db = app()->db;
if (!app()->isDebug() || config('database.connections.mysql.hostname') !== '127.0.0.1'
    || $db->query('SELECT DATABASE() AS db')[0]['db'] !== 'lostsky') {
    throw new RuntimeException('Requires the verified local development database');
}
$checks = 0;
$check = static function (bool $ok, string $message) use (&$checks): void {
    ++$checks;
    if (!$ok) throw new RuntimeException($message);
};
if (in_array('--migrate', $argv, true)) {
    $before = $db->query('SELECT id, name, kind, price, benefit_package_id, redemption_campaign_id FROM team_product ORDER BY id');
    $sql = file_get_contents(dirname(__DIR__) . '/sql/patches/20260915_shop_product_variants.sql');
    for ($run = 0; $run < 2; ++$run) {
        foreach (explode(';', $sql) as $statement) if (trim($statement) !== '') $db->execute($statement);
    }
    $check($before === $db->query('SELECT id, name, kind, price, benefit_package_id, redemption_campaign_id FROM team_product ORDER BY id'), 'Migration preserves existing products');
}
$db->startTrans();
try {
    $suffix = bin2hex(random_bytes(6));
    $user = new \app\model\User;
    $user->save(['phone' => '14' . str_pad((string) random_int(0, 999999999), 9, '0', STR_PAD_LEFT), 'username' => 'variants-' . $suffix, 'password' => password_hash($suffix, PASSWORD_DEFAULT)]);
    $team = new \app\model\Team;
    $team->save(['slug' => 'variants-' . $suffix, 'user_id' => $user->id]);
    $products = app(\app\service\Product::class);
    $id = $products->create((int) $team->id, ['name' => 'Parent', 'kind' => 5, 'cover_image' => '/fixture.webp', 'variants' => [
        ['name' => 'Standard', 'kind' => 1, 'price' => '10.00'],
        ['name' => 'Redeemable', 'kind' => 4, 'price' => '25.00', 'redemption' => ['unit_name' => '次', 'quantity_step' => 1, 'quantity' => 2]],
    ]]);
    $detail = $products->get((int) $team->id, $id);
    $check(count($detail['variants']) === 2, 'Creates both variants atomically');
    $check($products->list((int) $team->id, [])['total'] === 1, 'Hidden variants excluded from management list');
    $variant = \app\model\TeamProduct::find($detail['variants'][0]['id']);
    $check((int) $variant->parent_product_id === $id && $variant->price === '10.00', 'Variant owns price and parent');
    $check(app(\app\service\ProductVariant::class)->displayName($variant) === 'Parent · Standard', 'Order display identifies parent and variant');
    $rejected = false;
    try { app(\app\service\BenefitFulfillment::class)->snapshotProduct(\app\model\TeamProduct::find($id)); }
    catch (\think\exception\HttpException $error) { $rejected = $error->getStatusCode() === 422; }
    $check($rejected, 'Container cannot be fulfilled without variant selection');
    $products->edit((int) $team->id, $id, ['is_active' => 0]);
    $rejected = false;
    try { app(\app\service\ProductVariant::class)->assertAvailable($variant); }
    catch (\think\exception\HttpException $error) { $rejected = $error->getStatusCode() === 422; }
    $check($rejected, 'Inactive parent blocks direct variant purchase');
    $products->edit((int) $team->id, $id, ['is_active' => 1]);
    $counts = [\app\model\TeamProduct::count(), \app\model\TeamService::count()];
    $rejected = false;
    try {
        $products->edit((int) $team->id, $id, ['name' => 'Must roll back', 'variants' => [
            ['name' => 'Duplicate', 'kind' => 1, 'price' => '12.00'],
            ['name' => 'Duplicate', 'kind' => 1, 'price' => '14.00'],
        ]]);
    } catch (\think\exception\HttpException $error) { $rejected = $error->getStatusCode() === 422; }
    $check($rejected && $counts === [\app\model\TeamProduct::count(), \app\model\TeamService::count()], 'Invalid replacement rolls back new resources');
    $rejected = false;
    try {
        $products->create((int) $team->id, ['name' => 'Invalid money', 'kind' => 5, 'cover_image' => '/fixture.webp', 'variants' => [[
            'name' => 'Overallocated', 'kind' => 1, 'price' => '10.00', 'cost' => '2.00', 'handler_cut' => '9.00',
        ]]]);
    } catch (\think\exception\HttpException $error) { $rejected = $error->getStatusCode() === 422; }
    $check($rejected && $counts === [\app\model\TeamProduct::count(), \app\model\TeamService::count()], 'Invalid new variant money rolls back container and variant');
    $check(\app\model\TeamProduct::find($id)->name === 'Parent', 'Invalid replacement rolls back parent edit');
    $options = app(\app\service\EntitlementManagement::class)->productOptions((int) $team->id)['products'];
    $check(count($options) === 2 && !in_array($id, array_column($options, 'id'), true), 'Composition candidates contain variants, not container');
    $packageId = $products->create((int) $team->id, ['name' => 'Both variants', 'cover_image' => '/fixture.webp', 'kind' => 2, 'items' => [
        ['product_id' => $detail['variants'][0]['id'], 'quantity' => 1],
        ['product_id' => $detail['variants'][1]['id'], 'quantity' => 1],
    ]]);
    $check(count($products->get((int) $team->id, $packageId)['items']) === 2, 'Same container can supply different concrete variants');
    $redeemableId = $detail['variants'][1]['id'];
    $oldProduct = \app\model\TeamProduct::find($redeemableId);
    $oldItem = \app\model\BenefitPackageService::where('package_id', $oldProduct->benefit_package_id)->find();
    $oldServiceId = (int) $oldItem->service_id;
    $fields = app(\app\service\ServiceRedemptionField::class);
    $oldFields = $fields->sync((int) $team->id, $oldServiceId, [[
        'name' => '原账号', 'value_type' => 'string', 'input_type' => 'text',
        'fill_stage' => 'customer', 'is_customer_visible' => 1, 'is_required' => 1,
    ]]);
    $changedField = $oldFields[0];
    $changedField['name'] = '新账号';
    $products->edit((int) $team->id, $id, ['variants' => [
        ['id' => $variant->id],
        ['id' => $redeemableId, 'redemption' => ['unit_name' => '小时', 'redemption_fields' => [$changedField]]],
    ]]);
    $newProduct = \app\model\TeamProduct::find($redeemableId);
    $newItem = \app\model\BenefitPackageService::where('package_id', $newProduct->benefit_package_id)->find();
    $check((int) $newItem->service_id !== $oldServiceId, 'Variant update versions internal redemption definition');
    $check(\app\model\TeamService::find($oldServiceId)->unit_name === '次', 'Historical redemption definition remains unchanged');
    $check(\app\model\TeamService::find($newItem->service_id)->unit_name === '小时', 'New purchases use updated definition');
    $historicalFields = $fields->fieldsForService((int) $team->id, $oldServiceId, true);
    $currentFields = $fields->fieldsForService((int) $team->id, (int) $newItem->service_id, true);
    $check($historicalFields[0]['name'] === '原账号' && $historicalFields[0]['id'] === $oldFields[0]['id'], 'Historical field identity and label preserved');
    $check($currentFields[0]['name'] === '新账号' && $currentFields[0]['id'] !== $oldFields[0]['id'], 'New version owns separate field identity');
    foreach ([null, [array_merge($currentFields[0], ['id' => true])], [
        $currentFields[0], array_merge($currentFields[0], ['name' => '不同名称但重复 ID']),
    ]] as $invalidFields) {
        $rejected = false;
        try {
            $products->edit((int) $team->id, $id, ['variants' => [
                ['id' => $variant->id],
                ['id' => $redeemableId, 'redemption' => ['redemption_fields' => $invalidFields]],
            ]]);
        } catch (\think\exception\HttpException $error) { $rejected = $error->getStatusCode() === 422; }
        $check($rejected, 'Reject invalid or duplicated historical field identity');
    }
    $products->edit((int) $team->id, $id, ['variants' => [['id' => $variant->id, 'name' => 'Updated', 'price' => '11.00']]]);
    $check(count($products->get((int) $team->id, $id)['variants']) === 1, 'Replacement soft deletes omitted variant');
    $products->edit((int) $team->id, $id, ['variants' => [[
        'id' => $variant->id, 'price' => '20.00', 'cost' => '2.00',
        'handler_cut' => '5.00', 'sender_cut' => '1.00', 'cs_cut' => '0.00',
    ]]]);
    $check(\app\model\TeamProduct::find($variant->id)->team_cut === '12.00', 'Standard variant recalculates team remainder after editing');
    $check(\app\model\TeamProduct::withTrashed()->find($detail['variants'][1]['id'])->trashed(), 'Removed variant remains available to historical relations');
    $products->edit((int) $team->id, $id, ['variants' => [
        ['id' => $variant->id],
        ['name' => 'Sibling bundle', 'kind' => 2, 'items' => [['product_id' => $variant->id, 'quantity' => 1]]],
    ]]);
    $siblings = $products->get((int) $team->id, $id)['variants'];
    $bundleId = $siblings[1]['id'];
    $rejected = false;
    try {
        $products->edit((int) $team->id, $id, ['variants' => [['id' => $bundleId]]]);
    } catch (\think\exception\HttpException $error) { $rejected = $error->getStatusCode() === 422; }
    $check($rejected, 'Atomic replacement cannot remove a referenced sibling variant');
    $check(count($products->get((int) $team->id, $id)['variants']) === 2, 'Invalid final graph rolls back sibling removal');
    $purchaseParent = $products->create((int) $team->id, ['name' => 'Purchase fields', 'kind' => 5, 'cover_image' => '/fixture.webp', 'variants' => [[
        'name' => 'With fields', 'kind' => 4, 'price' => '20.00', 'redemption' => ['unit_name' => '次', 'quantity' => 1, 'quantity_step' => 1],
        'purchase_fields' => [['name' => '购买账号', 'value_type' => 'string', 'input_type' => 'text', 'is_required' => 1]],
    ]]]);
    $purchaseVariant = $products->get((int) $team->id, $purchaseParent)['variants'][0];
    $purchaseField = $purchaseVariant['purchase_fields'][0];
    $check(is_int($purchaseField['id']) && $purchaseField['id'] > 0, 'Purchase field receives stable identity');
    $orders = app(\app\service\Order::class);
    $orderCount = \app\model\TeamOrder::count();
    foreach ([[], [$purchaseField['id'] => []], [0 => 'unexpected']] as $invalidValues) {
        $rejected = false;
        try { $orders->create((int) $team->id, ['product_id' => $purchaseVariant['id'], 'purchase_values' => $invalidValues]); }
        catch (\think\exception\HttpException $error) { $rejected = $error->getStatusCode() === 422; }
        $check($rejected && \app\model\TeamOrder::count() === $orderCount, 'Invalid purchase values never create an order');
    }
    $purchaseOrder = $orders->create((int) $team->id, ['product_id' => $purchaseVariant['id'], 'purchase_values' => [$purchaseField['id'] => 'original-account']]);
    $snapshot = $orders->get((int) $team->id, $purchaseOrder)['purchase_fields'];
    $fulfillmentSnapshot = \app\model\TeamOrder::find($purchaseOrder)->fulfillment_snapshot;
    $check($snapshot[0]['name'] === '购买账号' && $snapshot[0]['value'] === 'original-account', 'Order freezes purchase definition and value');
    $products->edit((int) $team->id, $purchaseParent, ['variants' => [[
        'id' => $purchaseVariant['id'], 'purchase_fields' => [array_merge($purchaseField, ['name' => '修改后的账号'])],
    ]]]);
    $currentPurchaseField = $products->get((int) $team->id, $purchaseParent)['variants'][0]['purchase_fields'][0];
    $check($currentPurchaseField['id'] === $purchaseField['id'] && $currentPurchaseField['name'] === '修改后的账号', 'Editing purchase field retains identity');
    $check($orders->get((int) $team->id, $purchaseOrder)['purchase_fields'] === $snapshot, 'Product edits do not change purchase history');
    $rejected = false;
    try { $products->edit((int) $team->id, $purchaseParent, ['variants' => [['id' => $purchaseVariant['id'], 'purchase_fields' => [array_merge($purchaseField, ['id' => true])]]]]); }
    catch (\think\exception\HttpException $error) { $rejected = $error->getStatusCode() === 422; }
    $check($rejected, 'Malformed purchase field identity is rejected');
    $products->delete((int) $team->id, $purchaseParent);
    $check($orders->get((int) $team->id, $purchaseOrder)['purchase_fields'] === $snapshot, 'Deleted variant retains order purchase history');
    $check(\app\model\TeamOrder::find($purchaseOrder)->fulfillment_snapshot === $fulfillmentSnapshot, 'Variant edit and deletion preserve fulfillment snapshot');
    $historicalServiceId = $fulfillmentSnapshot['items'][0]['service_id'];
    $check((bool) \app\model\TeamService::find($historicalServiceId), 'Deleted variant retains historical redemption service');
    echo "Product variants: {$checks} assertions passed\n";
} finally {
    $db->rollback();
}
