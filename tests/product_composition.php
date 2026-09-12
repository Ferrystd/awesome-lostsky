<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use app\enum\ProductKind;
use app\service\ProductComposition;
use think\exception\HttpException;

$checks = 0;
$assert = static function (bool $ok, string $message) use (&$checks): void {
    ++$checks;
    if (!$ok) throw new RuntimeException($message);
};
$reject = static function (callable $run, string $message) use ($assert): void {
    try {
        $run();
    } catch (HttpException $error) {
        $assert($error->getStatusCode() === 422, $message);
        return;
    }
    $assert(false, $message);
};
$node = static fn (int $id, int $kind, array $items = [], ?int $owner = 8): array => [
    'id' => $id, 'team_id' => 1, 'entity_id' => $owner, 'kind' => $kind,
    'is_active' => 1, 'items' => $items,
];
$item = static fn (int $id, int $quantity = 1): array => ['product_id' => $id, 'quantity' => $quantity];
$service = new ProductComposition;
$catalog = [1 => $node(1, 1), 2 => $node(2, 4), 3 => $node(3, 3, [$item(1)]), 4 => $node(4, 2, [$item(2)])];
$inspect = static fn (array $root, array $rows): array => $service->inspect($root, static fn (int $id) => $rows[$id] ?? null);

foreach ([2, 3] as $kind) {
    foreach ([1, 2, 3, 4] as $target) {
        $tree = $inspect($node(0, $kind, [$item($target, 2)]), $catalog);
        $assert($tree['children'][0]['product_id'] === $target, 'all four target kinds accepted');
        $assert($tree['pricing_locked'] === in_array($target, [3, 4], true), 'nested lock boundary');
    }
}
$assert($inspect($node(0, 1), [])['children'] === [], 'ordinary product has no fulfillment children');
$assert(ProductKind::Redeemable->value() === '核销商品', 'redeemable kind');
$reject(fn () => $inspect($node(0, 1, [$item(1)]), $catalog), 'ordinary cannot contain items');
$reject(fn () => $inspect($node(0, 4, [$item(1)]), $catalog), 'redeemable cannot contain items');
$reject(fn () => $inspect($node(0, 2), []), 'empty bundle');
$reject(fn () => $inspect($node(0, 3, [$item(1), $item(2)]), $catalog), 'card has one target');
$reject(fn () => $inspect($node(0, 2, [$item(99)]), $catalog), 'missing target');
$reject(fn () => $inspect($node(1, 2, [$item(1)]), $catalog), 'direct cycle');
$cycle = [5 => $node(5, 2, [$item(6)]), 6 => $node(6, 3, [$item(5)])];
$reject(fn () => $inspect($cycle[5], $cycle), 'mixed indirect cycle');
$public = [1 => $node(1, 1, [], null)];
$assert(!$inspect($node(0, 2, [$item(1)]), $public)['pricing_locked'], 'own references public');
$reject(fn () => $inspect($node(0, 2, [$item(1)], null), $catalog), 'public cannot reference private');
$other = [1 => $node(1, 1, [], 9)];
$reject(fn () => $inspect($node(0, 2, [$item(1)]), $other), 'other owner denied');
$indirect = [1 => $node(1, 2, [$item(2)], null), 2 => $node(2, 1)];
$reject(fn () => $inspect($node(0, 2, [$item(1)]), $indirect), 'public intermediate cannot smuggle own private target');
$foreign = $catalog;
$foreign[1]['team_id'] = 2;
$reject(fn () => $inspect($node(0, 2, [$item(1)]), $foreign), 'foreign team denied');
$inactive = $catalog;
$inactive[1]['is_active'] = 0;
$reject(fn () => $inspect($node(0, 2, [$item(1)]), $inactive), 'inactive target denied');
foreach ([0, -1, 1.5, true, null, '1e2', '9999999999999999999999999999'] as $quantity) {
    $reject(fn () => $inspect($node(0, 2, [['product_id' => 1, 'quantity' => $quantity]]), $catalog), 'invalid quantity');
}
$chain = [1 => $node(1, 2, [$item(2)]), 2 => $node(2, 3, [$item(3)]), 3 => $node(3, 1)];
$assert($inspect($node(0, 2, [$item(1)]), $chain)['pricing_locked'], 'three reference edges accepted');
$chain[3] = $node(3, 3, [$item(4)]);
$chain[4] = $node(4, 1);
$reject(fn () => $inspect($node(0, 2, [$item(1)]), $chain), 'four reference edges rejected');
$reject(fn () => $inspect($node(0, 2, [$item(1, 10001)]), $catalog), 'individual quantity cap');
$reject(fn () => $inspect($node(0, 2, [$item(1, 6000), $item(2, 6000)]), $catalog), 'aggregate quantity cap');
$reject(fn () => $inspect($node(0, 2, array_fill(0, 1000, $item(1))), $catalog), 'node cap');
$diamond = [1 => $node(1, 2, [$item(3, 2)]), 2 => $node(2, 2, [$item(3, 3)]), 3 => $node(3, 1)];
$loads = 0;
$tree = $service->inspect($node(0, 2, [$item(1, 2), $item(2, 3)]), static function (int $id) use ($diamond, &$loads) {
    ++$loads;
    return $diamond[$id] ?? null;
});
$assert($loads === 3, 'shared definition loaded once, not mistaken for cycle');
$assert($tree['children'][0]['children'][0]['quantity'] === 4, 'first path quantity');
$assert($tree['children'][1]['children'][0]['quantity'] === 9, 'second path quantity');
$deliver = static fn (array $root, array $rows, bool $redeem = false): array =>
    $service->deliveries($root, static fn (int $id) => $rows[$id] ?? null, $redeem);
$mixed = [1 => $node(1, 1), 2 => $node(2, 4)];
$bundle = $node(10, 2, [$item(1, 2), $item(2, 3)]);
$actions = $deliver($bundle, $mixed);
$assert(array_column($actions, 'action') === ['ordinary', 'entitlement'], 'A ordinary, B redeemable in same bundle');
$assert(array_column($actions, 'quantity') === [2, 3], 'mixed quantities preserved');
$assert(count(array_filter($actions, fn ($action) => $action['action'] === 'entitlement')) === 1, 'only B generates entitlement');
$mixed[10] = $bundle;
$actions = $deliver($node(11, 2, [$item(10, 2)]), $mixed);
$assert(array_column($actions, 'action') === ['ordinary', 'entitlement'], 'nested bundle retains per-item fulfillment');
$assert(array_column($actions, 'quantity') === [4, 6], 'nested bundle scales both types');
$card = $node(12, 3, [$item(10)]);
$actions = $deliver($card, $mixed);
$assert(array_column($actions, 'action') === ['card'], 'selling card does not redeem its contents');
$actions = $deliver($card, $mixed, true);
$assert(array_column($actions, 'action') === ['ordinary', 'entitlement'], 'redeeming mixed bundle applies each item type');
$assert(array_column($actions, 'quantity') === [2, 3], 'redemption preserves item quantities');
$mixed[12] = $card;
$actions = $deliver($node(13, 3, [$item(12, 2)]), $mixed, true);
$assert(array_column($actions, 'action') === ['card'], 'card to card stops after one exchange');
$assert($actions[0]['quantity'] === 2, 'card to card target count');
$actions = $deliver($node(14, 2, [$item(12)]), $mixed);
$assert(array_column($actions, 'action') === ['card'], 'bundle containing card does not redeem it');
$actions = $deliver($node(0, 3, [$item(1)]), $mixed, true);
$assert(array_column($actions, 'action') === ['ordinary'], 'card to ordinary has no entitlement');
$actions = $deliver($node(0, 3, [$item(2)]), $mixed, true);
$assert(array_column($actions, 'action') === ['entitlement'], 'card to redeemable grants entitlement');
$actions = $deliver($node(0, 2, [$item(1), $item(1)]), $mixed);
$assert($actions[0]['path'] !== $actions[1]['path'], 'repeated ordinary references have distinct delivery keys');
$reject(fn () => $deliver($bundle, $mixed, true), 'cannot redeem a non-card');
echo "Product composition: {$checks} assertions passed (no database writes).\n";
