<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use app\enum\OrderStatus;
use app\model\Team;
use app\model\TeamAbility;
use app\model\TeamCustomer;
use app\model\TeamCustomerBalance;
use app\model\TeamCustomerBalanceLog;
use app\model\TeamOrder;
use app\model\TeamProduct;
use app\model\TeamProductHandler;
use app\model\TeamTransaction;
use app\model\User;
use app\service\Balance;
use app\service\Entity as EntityService;
use app\service\EntityProfile;
use app\service\Order;
use app\service\Product;
use app\service\ProductSelfManagement;
use app\service\TeamSetting;
use think\App;
use think\exception\HttpException;

(new App(dirname(__DIR__)))->initialize();

set_exception_handler(static function (Throwable $exception): void {
    fwrite(STDERR, $exception::class . ': ' . $exception->getMessage() . PHP_EOL);
    exit(1);
});

$failures = [];
$assert = static function (bool $condition, string $case) use (&$failures): void {
    if (!$condition) {
        $failures[] = $case;
    }
};
$assertFloat = static function (float $expected, mixed $actual, string $case) use (&$failures): void {
    if (abs($expected - (float) $actual) > 0.001) {
        $failures[] = "{$case}: expected {$expected}, got " . json_encode($actual);
    }
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

$db = app()->db;
$db->startTrans();
try {
    $suffix = bin2hex(random_bytes(6));
    $owner = new User;
    $owner->save([
        'phone' => '14' . str_pad((string) random_int(0, 999999999), 9, '0', STR_PAD_LEFT),
        'username' => "order-owner-{$suffix}",
        'password' => password_hash('order-test', PASSWORD_DEFAULT),
    ]);
    $customerUser = new User;
    $customerUser->save([
        'phone' => '13' . str_pad((string) random_int(0, 999999999), 9, '0', STR_PAD_LEFT),
        'username' => "order-customer-{$suffix}",
        'password' => password_hash('order-test', PASSWORD_DEFAULT),
    ]);
    $team = new Team;
    $team->save([
        'slug' => "order-test-{$suffix}",
        'user_id' => $owner->id,
        'is_banned' => 0,
        'is_cancelled' => 0,
    ]);
    $teamEntity = app(EntityService::class)->claimTeam($team);
    $transactionAbility = new TeamAbility;
    $transactionAbility->save([
        'team_id' => (int) $team->id,
        'ability_key' => 'transaction',
        'level' => 1,
        'expire_time' => 0,
    ]);

    $productId = app(Product::class)->create((int) $team->id, [
        'name' => 'Anonymous Product',
        'cover_image' => 'https://assets.lostsky.work/media/order-product.webp',
        'price' => 100,
        'cost' => 20,
        'handler_cut' => 10,
    ]);
    $foreignTeam = new Team;
    $foreignTeam->save(['slug' => "order-foreign-{$suffix}", 'user_id' => $owner->id, 'is_banned' => 0, 'is_cancelled' => 0]);
    $foreignEntity = app(EntityService::class)->claimTeam($foreignTeam);
    $foreignCustomer = new TeamCustomer;
    $foreignCustomer->save(['team_id' => $foreignTeam->id, 'user_id' => $customerUser->id, 'is_blocked' => 0]);
    app(Balance::class)->recharge((int) $foreignTeam->id, (int) $foreignCustomer->id, 500, 'personnel isolation fixture');
    $foreignProduct = app(Product::class)->create((int) $foreignTeam->id, ['name' => 'Foreign product', 'price' => 100, 'cover_image' => 'https://assets.lostsky.work/media/order-product.webp']);
    $teamId = (int) $team->id;
    $personnel = ['handler_entity_id' => (int) $foreignEntity->id, 'sender_entity_id' => (int) $foreignEntity->id, 'cs_entity_id' => (int) $foreignEntity->id];
    $request = ['product_id' => $productId, ...$personnel];
    $customer = new TeamCustomer;
    $customer->save(['team_id' => $teamId, 'user_id' => $customerUser->id, 'is_blocked' => 0]);
    $customerEntity = app(EntityService::class)->claimCustomer((int) $customer->id, "personnel-customer-{$suffix}");
    $campaign = new \app\model\RedemptionCampaign;
    $package = new \app\model\BenefitPackage;
    $package->save(['issuer_team_id' => $teamId, 'name' => 'Personnel fixture']);
    $campaign->save(['package_id' => $package->id, 'issuer_team_id' => $teamId, 'name' => 'Personnel fixture']);
    $code = new \app\model\RedemptionCode;
    $code->save(['campaign_id' => $campaign->id, 'code_hash' => hash('sha256', $suffix), 'code_ciphertext' => 'fixture']);
    $claim = new \app\model\RedemptionClaim;
    $claim->save(['campaign_id' => $campaign->id, 'code_id' => $code->id, 'claim_key' => $suffix, 'target_entity_id' => $customerEntity->id, 'claimed_by_entity_id' => $teamEntity->id]);
    $entry = ['product_id' => $productId, 'quantity' => 1, 'handler_entity_id' => (int) $foreignEntity->id,
        'money' => ['total_price' => '100.00', 'cost' => '20.00', 'handler_cut' => '30.00', 'sender_cut' => '10.00', 'cs_cut' => '10.00', 'team_cut' => '30.00']];
    $ordinal = 0;
    foreach (['enabled', 'disabled', 'missing-ability'] as $mode) {
        app(TeamSetting::class)->set($teamId, 'shop', 'sync_transaction', $mode !== 'disabled');
        if ($mode === 'missing-ability') $transactionAbility->delete();
        $deliveryId = app(Order::class)->deliverClaimProduct($claim, $customer, $entry, ++$ordinal, (int) $foreignEntity->id, (int) $foreignEntity->id);
        $delivery = TeamOrder::find($deliveryId);
        foreach ($personnel as $field => $id) $assert((int) $delivery->$field === $id, "$mode delivery accepts foreign $field");
        $assert(($delivery->trans_id !== null) === ($mode === 'enabled'), "$mode delivery preserves sync behavior");
        $foreignTeam->save(['is_banned' => 1]);
        foreach (array_keys($personnel) as $field) {
            $deliveryEntry = [...$entry, 'handler_entity_id' => $field === 'handler_entity_id' ? (int) $foreignEntity->id : (int) $teamEntity->id];
            $sender = $field === 'sender_entity_id' ? (int) $foreignEntity->id : null;
            $cs = $field === 'cs_entity_id' ? (int) $foreignEntity->id : null;
            $assertThrows(fn () => app(Order::class)->deliverClaimProduct($claim, $customer, $deliveryEntry, ++$ordinal, $sender, $cs), 404, "$mode delivery rejects invalid $field");
        }
        $foreignTeam->save(['is_banned' => 0]);
        $order = TeamOrder::find(app(Order::class)->create($teamId, $request));
        foreach ($personnel as $field => $id) $assert((int) $order->$field === $id, "$mode accepts foreign $field");
        $assert(($order->trans_id !== null) === ($mode === 'enabled'), "$mode preserves sync behavior");
        if ($order->trans_id !== null) {
            $transaction = TeamTransaction::find((int) $order->trans_id);
            foreach ($personnel as $field => $id) $assert((int) $transaction->$field === $id, "synced transaction retains $field");
        }
        foreach (array_keys($personnel) as $field) {
            $beforeOrders = TeamOrder::where('team_id', $teamId)->count();
            $beforeTransactions = TeamTransaction::where('team_id', $teamId)->count();
            $assertThrows(fn () => app(Order::class)->create($teamId, [...$request, $field => 2147483647]), 404, "$mode rejects missing $field");
            $foreignTeam->save(['is_banned' => 1]);
            $assertThrows(fn () => app(Order::class)->create($teamId, [...$request, 'handler_entity_id' => (int) $teamEntity->id, $field => (int) $foreignEntity->id]), 404, "$mode rejects invalid $field");
            $foreignTeam->save(['is_banned' => 0]);
            $assert(TeamOrder::where('team_id', $teamId)->count() === $beforeOrders, "$mode failed personnel leaves no order");
            $assert(TeamTransaction::where('team_id', $teamId)->count() === $beforeTransactions, "$mode failed personnel leaves no transaction");
        }
        $assertThrows(fn () => app(Order::class)->create($teamId, [...$request, 'customer_id' => (int) $foreignCustomer->id]), 422, "$mode rejects foreign customer");
        $assertThrows(fn () => app(Order::class)->create($teamId, [...$request, 'product_id' => $foreignProduct]), 422, "$mode rejects foreign product");
        $assertThrows(fn () => app(Order::class)->create($teamId, [...$request, 'team_cut' => 999]), 422, "$mode enforces money balance");
        $assertFloat(500, TeamCustomerBalance::where('customer_id', $foreignCustomer->id)->find()->balance, "$mode leaves foreign balance unchanged");
    }
    $ledger = [...$personnel, 'total_price' => 100, 'cash' => 100, 'prepaid' => 0, 'cost' => 20, 'handler_cut' => 30, 'sender_cut' => 10, 'cs_cut' => 10, 'team_cut' => 30];
    $service = app(\app\service\Transaction::class);
    $ledgerId = $service->create($teamId, [...$ledger, 'sender_entity_id' => null, 'cs_entity_id' => null]);
    $service->edit($teamId, $ledgerId, ['sender_entity_id' => (int) $foreignEntity->id, 'cs_entity_id' => (int) $foreignEntity->id]);
    $assert((int) TeamTransaction::find($ledgerId)->sender_entity_id === (int) $foreignEntity->id, 'edit accepts foreign sender');
    $assert((int) TeamTransaction::find($ledgerId)->cs_entity_id === (int) $foreignEntity->id, 'edit accepts foreign cs');
    foreach (['createServiceRedemption', 'createServiceAdjustmentPerformance', 'createUnusedServiceSettlement'] as $method) {
        $id = $service->$method($teamId, $method === 'createUnusedServiceSettlement' ? [...$ledger, 'team_cut' => 60] : $ledger);
        $assert((int) TeamTransaction::find($id)->sender_entity_id === (int) $foreignEntity->id, "$method accepts foreign sender");
    }
    foreach (array_keys($personnel) as $field) {
        $assertThrows(fn () => $service->create($teamId, [...$ledger, $field => 2147483647]), 404, "ledger rejects missing $field");
        $foreignTeam->save(['is_banned' => 1]);
        $assertThrows(fn () => $service->create($teamId, [...$ledger, 'handler_entity_id' => (int) $teamEntity->id, $field => (int) $foreignEntity->id]), 404, "ledger rejects invalid $field");
        if ($field !== 'handler_entity_id') $assertThrows(fn () => $service->edit($teamId, $ledgerId, [$field => (int) $foreignEntity->id]), 404, "edit rejects invalid $field");
        $foreignTeam->save(['is_banned' => 0]);
    }
    // Configured handlers retain qualification and must still be valid.
    $handler = new TeamProductHandler;
    $handler->save(['product_id' => $productId, 'entity_id' => (int) $foreignEntity->id]);
    $assertThrows(fn () => app(Order::class)->create($teamId, [...$request, 'handler_entity_id' => (int) $teamEntity->id]), 422, 'configured handler pool remains enforced');
    $foreignTeam->save(['is_banned' => 1]);
    $assertThrows(fn () => app(Order::class)->create($teamId, ['product_id' => $productId]), 404, 'single default handler must remain valid');
} finally {
    $db->rollback();
}
if ($failures) {
    fwrite(STDERR, implode(PHP_EOL, $failures) . PHP_EOL);
    exit(1);
}
fwrite(STDOUT, "Order personnel tests passed." . PHP_EOL);
