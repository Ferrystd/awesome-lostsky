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
use app\model\TeamTransaction;
use app\model\User;
use app\service\Balance;
use app\service\Entity as EntityService;
use app\service\EntityProfile;
use app\service\Order;
use app\service\Product;
use app\service\TeamSetting;
use think\App;
use think\exception\HttpException;

(new App(dirname(__DIR__)))->initialize();

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
    $anonymousOrderId = app(Order::class)->create((int) $team->id, [
        'product_id' => $productId,
        'quantity' => 2,
    ]);
    $anonymousOrder = TeamOrder::find($anonymousOrderId);
    $anonymousTransaction = TeamTransaction::find((int) $anonymousOrder->trans_id);
    $assert($anonymousOrder->customer_id === null, 'anonymous order keeps a null customer');
    $assert((int) $anonymousOrder->handler_entity_id === (int) $teamEntity->id, 'product without handlers uses the team entity as handler');
    $assertFloat(200, $anonymousOrder->cash, 'anonymous order pays in cash');
    $assertFloat(0, $anonymousOrder->prepaid, 'anonymous order does not use prepaid balance');
    $assertFloat(20, $anonymousOrder->handler_cut, 'product default cuts scale with quantity');
    $assertFloat(140, $anonymousOrder->team_cut, 'team cut receives the unallocated remainder');
    $assertFloat(200, $anonymousTransaction->cash, 'anonymous order transaction records cash');

    app(Order::class)->complete((int) $team->id, $anonymousOrderId);
    $completed = TeamOrder::find($anonymousOrderId);
    $assert($completed->enumCase('status') === OrderStatus::Completed, 'order completion updates status under lock');
    $assertThrows(
        fn () => app(Order::class)->cancel((int) $team->id, $anonymousOrderId),
        422,
        'completed order cannot be cancelled'
    );

    $customer = new TeamCustomer;
    $customer->save([
        'team_id' => (int) $team->id,
        'user_id' => $customerUser->id,
        'is_blocked' => 0,
    ]);
    $customerEntity = app(EntityService::class)->claimCustomer((int) $customer->id, "order-customer-{$suffix}");
    app(EntityProfile::class)->update(
        (int) $team->id,
        (int) $customerEntity->id,
        ['name' => 'Order Customer']
    );
    app(Balance::class)->recharge((int) $team->id, (int) $customer->id, 150, 'order test');

    $prepaidOrderId = app(Order::class)->create((int) $team->id, [
        'product_id' => $productId,
        'customer_id' => (int) $customer->id,
    ]);
    $prepaidOrder = TeamOrder::find($prepaidOrderId);
    $assert($prepaidOrder->product_name === 'Anonymous Product', 'order stores the product name snapshot');
    $assertFloat(0, $prepaidOrder->cash, 'customer order does not record cash');
    $assertFloat(100, $prepaidOrder->prepaid, 'customer order records prepaid payment');
    $assertFloat(
        50,
        TeamCustomerBalance::where('customer_id', $customer->id)->find()->balance,
        'customer order deducts prepaid balance'
    );

    app(Order::class)->cancel((int) $team->id, $prepaidOrderId);
    $assertFloat(
        150,
        TeamCustomerBalance::where('customer_id', $customer->id)->find()->balance,
        'order cancellation refunds prepaid balance once'
    );
    $cancelled = TeamOrder::find($prepaidOrderId);
    $assert($cancelled?->enumCase('status') === OrderStatus::Cancelled, 'cancelled order remains queryable');
    $refundLogs = TeamCustomerBalanceLog::where('customer_id', $customer->id)
        ->where('trans_id', $prepaidOrder->trans_id)
        ->where('type', \app\enum\LogType::Refund->value)
        ->count();
    app(Order::class)->cancel((int) $team->id, $prepaidOrderId);
    $assertFloat(
        150,
        TeamCustomerBalance::where('customer_id', $customer->id)->find()->balance,
        'repeated cancellation does not refund twice'
    );
    $assert(
        TeamCustomerBalanceLog::where('customer_id', $customer->id)
            ->where('trans_id', $prepaidOrder->trans_id)
            ->where('type', \app\enum\LogType::Refund->value)
            ->count() === $refundLogs,
        'repeated cancellation does not create another refund log'
    );

    $transactionCount = TeamTransaction::where('team_id', $team->id)->count();
    app(TeamSetting::class)->set((int) $team->id, 'shop', 'sync_transaction', false);
    $unsyncedOrderId = app(Order::class)->create((int) $team->id, [
        'product_id' => $productId,
        'customer_id' => (int) $customer->id,
    ]);
    $unsyncedOrder = TeamOrder::find($unsyncedOrderId);
    $assert($unsyncedOrder->trans_id === null, 'disabled transaction sync leaves order trans_id null');
    $assert(
        TeamTransaction::where('team_id', $team->id)->count() === $transactionCount,
        'disabled transaction sync does not create a ledger entry'
    );
    $assertFloat(
        50,
        TeamCustomerBalance::where('customer_id', $customer->id)->find()->balance,
        'disabled transaction sync still deducts prepaid balance'
    );
    $assert(
        TeamCustomerBalanceLog::where('customer_id', $customer->id)
            ->whereNull('trans_id')
            ->where('type', \app\enum\LogType::Consume->value)
            ->count() === 1,
        'disabled transaction sync records an unlinked balance log'
    );
    app(Order::class)->cancel((int) $team->id, $unsyncedOrderId);
    $assertFloat(
        150,
        TeamCustomerBalance::where('customer_id', $customer->id)->find()->balance,
        'unsynced order cancellation still refunds prepaid balance'
    );

    app(TeamSetting::class)->set((int) $team->id, 'shop', 'sync_transaction', true);
    $transactionAbility->level = 0;
    $transactionAbility->save();
    $lowAbilityOrder = TeamOrder::find(app(Order::class)->create((int) $team->id, [
        'product_id' => $productId,
    ]));
    $assert($lowAbilityOrder->trans_id === null, 'low transaction ability skips ledger sync');

    $transactionAbility->level = 1;
    $transactionAbility->expire_time = time() - 1;
    $transactionAbility->save();
    $expiredAbilityOrder = TeamOrder::find(app(Order::class)->create((int) $team->id, [
        'product_id' => $productId,
    ]));
    $assert($expiredAbilityOrder->trans_id === null, 'expired transaction ability skips ledger sync');

    $transactionAbility->delete();
    $missingAbilityOrder = TeamOrder::find(app(Order::class)->create((int) $team->id, [
        'product_id' => $productId,
    ]));
    $assert($missingAbilityOrder->trans_id === null, 'missing transaction ability skips ledger sync');
} finally {
    $db->rollback();
}

if ($failures) {
    fwrite(STDERR, implode(PHP_EOL, $failures) . PHP_EOL);
    exit(1);
}

fwrite(STDOUT, "Order backend tests passed." . PHP_EOL);
