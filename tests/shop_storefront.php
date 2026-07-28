<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use app\model\EntitySession;
use app\model\Team;
use app\model\TeamCustomer;
use app\model\TeamCustomerBalance;
use app\model\TeamOrder;
use app\model\TeamProduct;
use app\model\User;
use app\model\UserDevice;
use app\service\CustomerBinding;
use app\service\Balance as BalanceService;
use app\service\Entity as EntityService;
use app\service\IdentitySession;
use app\service\Jwt;
use app\service\Product;
use app\service\Storefront;
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

    $page = app(Storefront::class)->products((int) $team->id);
    $assert(count($page['list']) === 1 && (int) $page['list'][0]['id'] === $activeId, 'storefront only lists active products');
    $assert(!array_key_exists('cost', $page['list'][0]) && !array_key_exists('handler_cut', $page['list'][0]), 'storefront list excludes internal money fields');
    $detail = app(Storefront::class)->product((int) $team->id, $activeId);
    $assert(($detail['introduction_markdown'] ?? null) === '# Public details', 'storefront detail includes product markdown');
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
    $manual = $binding->bind((int) $team->id, (int) $buyer->id, $deviceToken, null, "buyer-{$suffix}");
    $customerId = (int) $manual['customer']['id'];
    $customer = TeamCustomer::with(['identity', 'balance'])->find($customerId);
    $assert($manual['created'] === true && ($manual['identity']['slug'] ?? '') === "buyer-{$suffix}", 'base user creates a customer with a manual slug');
    $assert($customer->owner_entity_id === null && (int) $customer->user_id === (int) $buyer->id, 'base user binding has exactly one owner');
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
    $customerService = app(CustomerService::class);
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
    $sourceMember->is_blocked = 1;
    $sourceMember->save();
    $assertThrows($boundSession, 401, 'invalid source entity revokes downstream customer session');
    $sourceMember->is_blocked = 0;
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
