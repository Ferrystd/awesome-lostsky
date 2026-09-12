<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use app\model\{Team, User, TeamProduct, TeamService, TeamRole, TeamRolePermission, TeamEntityRole, BenefitPackageService};
use app\service\{Entity, ProductSelfManagement, EntitlementSelfManagement, EntitlementManagement, PermissionDictionary, PersonalPricing};
use app\exception\AccessDeniedException;
use think\App;

(new App(dirname(__DIR__)))->initialize();
$count = 0;
$check = static function (bool $ok, string $message) use (&$count): void {
    if (!$ok) throw new RuntimeException($message);
    $count++;
};
$denied = static function (callable $action) use ($check): void {
    try { $action(); } catch (AccessDeniedException $e) {
        $check($e->data()['required_any'] === [PermissionDictionary::SHOP_PRODUCT_SELF_REPRICE], 'wrong required permission');
        return;
    }
    throw new RuntimeException('Unauthorized pricing change was accepted');
};
$db = app()->db;
$db->startTrans();
try {
    $suffix = bin2hex(random_bytes(6));
    $user = new User;
    $user->save(['phone' => '14' . str_pad((string) random_int(0, 999999999), 9, '0', STR_PAD_LEFT), 'username' => "pricing-$suffix", 'password' => password_hash($suffix, PASSWORD_DEFAULT)]);
    $team = new Team;
    $team->save(['slug' => "pricing-$suffix", 'user_id' => $user->id, 'is_banned' => 0, 'is_cancelled' => 0]);
    $entity = app(Entity::class)->claimTeam($team);
    $teamId = (int) $team->id;
    $entityId = (int) $entity->id;
    $actor = ['entity_id' => $entityId, 'type' => 'team', 'id' => $teamId];
    $role = new TeamRole;
    $role->save(['team_id' => $teamId, 'role_key' => 'pricing', 'name' => 'Pricing test']);
    (new TeamEntityRole)->save(['team_id' => $teamId, 'entity_id' => $entityId, 'role_id' => $role->id]);
    (new TeamRolePermission)->save(['team_id' => $teamId, 'role_id' => $role->id, 'permission_key' => PermissionDictionary::SHOP_PRODUCT_SELF_MANAGE]);
    $products = app(ProductSelfManagement::class);
    $resources = app(EntitlementSelfManagement::class);
    $input = ['name' => 'Own product', 'cover_image' => '/pricing.webp', 'price' => 100, 'cost' => 10];
    $id = $products->create($teamId, $actor, $entityId, $input);
    $defaults = app(PersonalPricing::class)->defaults($teamId, 100, 10);
    $check((string) TeamProduct::find($id)->handler_cut === $defaults['handler_cut'], 'product creation must use server defaults');
    foreach (['handler_cut', 'sender_cut', 'cs_cut'] as $field) {
        $denied(fn () => $products->create($teamId, $actor, $entityId, $input + [$field => 0.01]));
        $denied(fn () => $products->edit($teamId, $actor, $entityId, $id, [$field => 0.01]));
        $denied(fn () => $products->edit($teamId, $actor, $entityId, $id, [$field => null]));
    }
    $products->edit($teamId, $actor, $entityId, $id, ['price' => 120, 'team_cut' => 999]);
    $product = TeamProduct::find($id);
    $check((string) $product->handler_cut === $defaults['handler_cut'] && (float) $product->team_cut < 120, 'own price change preserves personnel and derives team remainder');
    $resourcesInput = ['name' => 'Own service', 'default_total_price' => 100, 'default_cost' => 10];
    $serviceId = $resources->saveService($teamId, $actor, $entityId, null, $resourcesInput);
    foreach (['handler', 'sender', 'cs'] as $person) {
        $field = 'default_' . $person . '_cut';
        $denied(fn () => $resources->saveService($teamId, $actor, $entityId, $serviceId, $resourcesInput + [$field => 0.01]));
        $denied(fn () => $resources->saveService($teamId, $actor, $entityId, null, $resourcesInput + [$field => 0.01]));
    }
    $resources->saveService($teamId, $actor, $entityId, $serviceId, ['name' => 'Renamed service', 'default_total_price' => 120]);
    $check((float) TeamService::find($serviceId)->default_total_price === 120.0 && (string) TeamService::find($serviceId)->default_handler_cut === $defaults['handler_cut'], 'service partial update preserves omitted personnel amounts');
    $sharedId = app(EntitlementManagement::class)->saveService($teamId, null, ['name' => 'Shared', 'default_total_price' => 50, 'default_cost' => 5, 'default_handler_cut' => 11, 'default_sender_cut' => 7, 'default_cs_cut' => 2]);
    $item = ['service_id' => $sharedId, 'quantity' => 1, 'valid_days' => 30];
    $packageId = $resources->savePackage($teamId, $actor, $entityId, null, ['name' => 'Package', 'services' => [$item]]);
    $stored = BenefitPackageService::where('package_id', $packageId)->find();
    $check((float) $stored->unit_handler_cut === 11.0, 'omitted shared cuts inherit service, not team rates');
    $denied(fn () => $resources->savePackage($teamId, $actor, $entityId, $packageId, ['name' => 'Package', 'pricing_mode' => 1, 'services' => [$item]]));
    $denied(fn () => $resources->savePackage($teamId, $actor, $entityId, null, ['name' => 'Package', 'pricing_mode' => 1, 'services' => [$item]]));
    foreach (['unit_price', 'unit_cost', 'unit_handler_cut', 'unit_sender_cut', 'unit_cs_cut'] as $field) {
        $denied(fn () => $resources->savePackage($teamId, $actor, $entityId, $packageId, ['name' => 'Package', 'services' => [$item + [$field => 0.01]]]));
    }
    // 上游修改后省略字段必须保留已保存金额，不能偷偷重新套用上游金额。
    app(EntitlementManagement::class)->saveService($teamId, $sharedId, ['name' => 'Shared', 'default_total_price' => 60, 'default_handler_cut' => 30]);
    $resources->savePackage($teamId, $actor, $entityId, $packageId, ['name' => 'Package', 'services' => [array_merge($item, ['quantity' => 2])]]);
    $stored = BenefitPackageService::where('package_id', $packageId)->find();
    $check((float) $stored->unit_price === 50.0 && (float) $stored->unit_handler_cut === 11.0 && (float) $stored->quantity === 2.0, 'shared frozen baseline survives omission and quantity edit');
    $ownItem = ['service_id' => $serviceId, 'quantity' => 1, 'unit_price' => 150];
    $ownPackage = $resources->savePackage($teamId, $actor, $entityId, null, ['name' => 'Own package', 'services' => [$ownItem]]);
    $check((float) BenefitPackageService::where('package_id', $ownPackage)->find()->unit_price === 150.0, 'own package item price is editable');
    $denied(fn () => $resources->savePackage($teamId, $actor, $entityId, $ownPackage, ['name' => 'Own package', 'services' => [$ownItem + ['unit_handler_cut' => 1]]]));
    (new TeamRolePermission)->save(['team_id' => $teamId, 'role_id' => $role->id, 'permission_key' => PermissionDictionary::SHOP_PRODUCT_SELF_REPRICE]);
    $products->edit($teamId, $actor, $entityId, $id, ['handler_cut' => 1]);
    $resources->saveService($teamId, $actor, $entityId, $serviceId, $resourcesInput + ['default_handler_cut' => 1]);
    $resources->savePackage($teamId, $actor, $entityId, $packageId, ['name' => 'Package', 'services' => [$item + ['unit_price' => 70, 'unit_handler_cut' => 1]]]);
    $check((float) TeamProduct::find($id)->handler_cut === 1.0 && (float) TeamService::find($serviceId)->default_handler_cut === 1.0 && (float) BenefitPackageService::where('package_id', $packageId)->find()->unit_price === 70.0, 'unified grant unlocks product, service and shared package repricing');
    $check(!PermissionDictionary::contains('shop.product.self.package.reprice'), 'old permission is not an alias');
    (new TeamRolePermission)->save(['team_id' => $teamId, 'role_id' => $role->id, 'permission_key' => 'shop.product.self.package.reprice']);
    $legacyRole = new TeamRole;
    $legacyRole->save(['team_id' => $teamId, 'role_key' => 'legacy', 'name' => 'Legacy pricing']);
    (new TeamRolePermission)->save(['team_id' => $teamId, 'role_id' => $legacyRole->id, 'permission_key' => 'shop.product.self.package']);
    $statements = array_filter(array_map('trim', explode(';', file_get_contents(dirname(__DIR__) . '/sql/patches/20260909_shop_personal_reprice.sql'))));
    foreach ([1, 2] as $run) {
        foreach ($statements as $sql) $db->execute($sql);
        $check(TeamRolePermission::where('team_id', $teamId)->where('permission_key', PermissionDictionary::SHOP_PRODUCT_SELF_REPRICE)->count() === 2, 'migration preserves grants and is idempotent');
        $check(TeamRolePermission::withTrashed()->where('team_id', $teamId)->whereIn('permission_key', ['shop.product.self.package', 'shop.product.self.package.reprice'])->count() === 0, 'migration removes obsolete keys');
    }
} finally {
    $db->rollback();
}
echo "personal pricing: {$count} assertions passed (rolled back)\n";
