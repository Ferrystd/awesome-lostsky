<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';
(new \think\App(dirname(__DIR__)))->initialize();
$db = app()->db;
if (!app()->isDebug() || config('database.connections.mysql.hostname') !== '127.0.0.1'
    || $db->query('SELECT DATABASE() AS name')[0]['name'] !== 'lostsky') {
    throw new RuntimeException('Only the verified local development database is allowed');
}
// 只清理旧服务链；普通商品、新核销商品和商品组合不在范围内。保留原行以便人工恢复。
$packages = array_column($db->query("SELECT b.id FROM benefit_package b WHERE b.issuer_team_id IS NOT NULL AND COALESCE(b.delete_time,0)=0
    AND EXISTS(SELECT 1 FROM benefit_package_service i WHERE i.package_id=b.id AND i.service_id IS NOT NULL)
    AND NOT EXISTS(SELECT 1 FROM benefit_package_service i WHERE i.package_id=b.id AND i.product_id IS NOT NULL)
    AND NOT EXISTS(SELECT 1 FROM team_product p WHERE p.benefit_package_id=b.id AND p.kind=4)
    AND NOT EXISTS(SELECT 1 FROM redemption_campaign c WHERE c.package_id=b.id)"), 'id');
$services = array_column($db->query("SELECT s.id FROM team_service s WHERE COALESCE(s.delete_time,0)=0
    AND NOT EXISTS(SELECT 1 FROM benefit_package_service i JOIN team_product p ON p.benefit_package_id=i.package_id
        WHERE i.service_id=s.id AND p.kind=4)"), 'id');
$list = static fn (array $ids): string => implode(',', array_map('intval', $ids)) ?: '0';
$products = array_column($db->query('SELECT id FROM team_product WHERE kind=2 AND COALESCE(delete_time,0)=0 AND benefit_package_id IN (' . $list($packages) . ')'), 'id');
if ($db->query('SELECT id FROM benefit_package_service WHERE product_id IN (' . $list($products) . ') LIMIT 1')) {
    throw new RuntimeException('New compositions reference legacy products; manual review required');
}
$conditions = [
    'team_service_instance' => 'service_id IN (' . $list($services) . ')',
    'team_service_entitlement' => 'service_id IN (' . $list($services) . ')',
    'team_order' => 'product_id IN (' . $list($products) . ')',
    'team_product' => 'id IN (' . $list($products) . ')',
    'benefit_package' => 'id IN (' . $list($packages) . ')',
    'team_service' => 'id IN (' . $list($services) . ')',
];
$plan = [];
foreach ($conditions as $table => $where) {
    $plan[$table] = array_column($db->query("SELECT id FROM `$table` WHERE ($where) AND COALESCE(delete_time,0)=0"), 'id');
}
echo json_encode(['mode' => in_array('--apply', $argv, true) ? 'apply' : 'dry-run', 'ids' => $plan], JSON_PRETTY_PRINT), "\n";
if (!in_array('--apply', $argv, true)) exit;
$db->transaction(function () use ($db, $plan, $list): void {
    $now = time();
    foreach ($plan as $table => $ids) {
        if (!$ids) continue;
        $db->execute("UPDATE `$table` SET delete_time=$now WHERE id IN (" . $list($ids) . ') AND COALESCE(delete_time,0)=0');
        if ($db->query("SELECT id FROM `$table` WHERE id IN (" . $list($ids) . ') AND COALESCE(delete_time,0)=0')) {
            throw new RuntimeException("Cleanup verification failed: $table");
        }
    }
});
echo "Legacy resources removed from active data; accounts, teams, ordinary products, balances and ledger rows unchanged. Original rows retained for recovery.\n";
