<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use app\enum\LogType;
use app\enum\TransactionType;
use app\model\Team;
use app\model\TeamCustomer;
use app\model\TeamCustomerBalance;
use app\model\TeamCustomerBalanceLog;
use app\model\TeamCustomerProfile;
use app\model\TeamCustomerSender;
use app\model\TeamMember;
use app\model\TeamMemberProfile;
use app\model\TeamTransaction;
use app\service\Balance;
use app\service\Sender;
use app\service\Transaction;
use app\service\TransactionStats;
use think\App;
use think\exception\HttpException;

(new App(dirname(__DIR__)))->initialize();

set_exception_handler(static function (Throwable $exception): void {
    fwrite(STDERR, $exception::class . ': ' . $exception->getMessage() . PHP_EOL);
    exit(1);
});

if (($argv[1] ?? '') === '--worker') {
    $barrier = (string) ($argv[2] ?? '');
    $deadline = microtime(true) + 10;
    while (!is_file($barrier) && microtime(true) < $deadline) {
        usleep(10_000);
    }

    try {
        $id = app(Transaction::class)->create((int) $argv[3], [
            'handler_id'  => (int) $argv[4],
            'customer_id' => (int) $argv[5],
            'type'        => TransactionType::LedgerEntry,
            'total_price' => 80,
            'cost'        => 0,
            'cash'        => 0,
            'prepaid'     => 80,
            'handler_cut' => 80,
            'sender_cut'  => 0,
            'cs_cut'      => 0,
            'team_cut'    => 0,
            'memo'        => 'transaction concurrency test',
        ]);
        fwrite(STDOUT, json_encode(['ok' => true, 'id' => $id]) . PHP_EOL);
    } catch (Throwable $exception) {
        fwrite(STDOUT, json_encode([
            'ok'     => false,
            'status' => $exception instanceof HttpException ? $exception->getStatusCode() : 500,
            'error'  => $exception->getMessage(),
        ]) . PHP_EOL);
    }
    exit(0);
}

$failures = [];

$assert = static function (bool $condition, string $case) use (&$failures): void {
    if (!$condition) {
        $failures[] = $case;
    }
};
$assertSame = static function (mixed $expected, mixed $actual, string $case) use (&$failures): void {
    if ($expected !== $actual) {
        $failures[] = "{$case}: expected " . json_encode($expected) . ', got ' . json_encode($actual);
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

$createFixture = static function (string $suffix): array {
    $team = new Team;
    $team->save([
        'slug'         => "transaction-test-{$suffix}",
        'display_name' => 'Transaction Test',
        'user_id'      => 1,
        'is_banned'    => 0,
        'is_cancelled' => 0,
    ]);

    $foreignTeam = new Team;
    $foreignTeam->save([
        'slug'         => "transaction-foreign-{$suffix}",
        'display_name' => 'Transaction Foreign Test',
        'user_id'      => 2,
        'is_banned'    => 0,
        'is_cancelled' => 0,
    ]);

    $member = new TeamMember;
    $member->save(['team_id' => $team->id, 'user_id' => 11, 'is_displayed' => 1, 'is_blocked' => 0]);
    (new TeamMemberProfile)->save(['member_id' => $member->id, 'nickname' => 'Alice Handler', 'avatar' => '']);

    $secondMember = new TeamMember;
    $secondMember->save(['team_id' => $team->id, 'user_id' => 12, 'is_displayed' => 1, 'is_blocked' => 0]);
    (new TeamMemberProfile)->save(['member_id' => $secondMember->id, 'nickname' => 'Bob Sender', 'avatar' => '']);

    $foreignMember = new TeamMember;
    $foreignMember->save(['team_id' => $foreignTeam->id, 'user_id' => 13, 'is_displayed' => 1, 'is_blocked' => 0]);

    $customer = new TeamCustomer;
    $customer->save(['team_id' => $team->id, 'user_id' => 21, 'is_blocked' => 0]);
    (new TeamCustomerProfile)->save(['customer_id' => $customer->id, 'nickname' => 'Alice Customer']);

    $secondCustomer = new TeamCustomer;
    $secondCustomer->save(['team_id' => $team->id, 'user_id' => 22, 'is_blocked' => 0]);
    (new TeamCustomerProfile)->save(['customer_id' => $secondCustomer->id, 'nickname' => 'Bob Customer']);

    $foreignCustomer = new TeamCustomer;
    $foreignCustomer->save(['team_id' => $foreignTeam->id, 'user_id' => 23, 'is_blocked' => 0]);

    return compact(
        'team',
        'foreignTeam',
        'member',
        'secondMember',
        'foreignMember',
        'customer',
        'secondCustomer',
        'foreignCustomer'
    );
};

$cleanupFixture = static function (array $fixture): void {
    $db = app()->db;
    $teamIds = [(int) $fixture['team']->id, (int) $fixture['foreignTeam']->id];
    $customerIds = [
        (int) $fixture['customer']->id,
        (int) $fixture['secondCustomer']->id,
        (int) $fixture['foreignCustomer']->id,
    ];
    $memberIds = [
        (int) $fixture['member']->id,
        (int) $fixture['secondMember']->id,
        (int) $fixture['foreignMember']->id,
    ];

    $db->transaction(function () use ($db, $teamIds, $customerIds, $memberIds): void {
        $db->name('team_customer_balance_log')->whereIn('customer_id', $customerIds)->delete();
        $db->name('team_transaction')->whereIn('team_id', $teamIds)->delete();
        $db->name('team_customer_balance')->whereIn('customer_id', $customerIds)->delete();
        $db->name('team_customer_sender')->whereIn('team_id', $teamIds)->delete();
        $db->name('team_customer_profile')->whereIn('customer_id', $customerIds)->delete();
        $db->name('team_customer')->whereIn('team_id', $teamIds)->delete();
        $db->name('team_member_profile')->whereIn('member_id', $memberIds)->delete();
        $db->name('team_member')->whereIn('team_id', $teamIds)->delete();
        $db->name('team')->whereIn('id', $teamIds)->delete();
    });
};

$db = app()->db;
$db->startTrans();
try {
    $fixture = $createFixture(bin2hex(random_bytes(6)));
    $teamId = (int) $fixture['team']->id;
    $memberId = (int) $fixture['member']->id;
    $secondMemberId = (int) $fixture['secondMember']->id;
    $customerId = (int) $fixture['customer']->id;
    $secondCustomerId = (int) $fixture['secondCustomer']->id;

    $balanceService = app(Balance::class);
    $senderService = app(Sender::class);
    $transactionService = app(Transaction::class);
    $statsService = app(TransactionStats::class);

    $balanceService->recharge($teamId, $customerId, 200, 'initial balance');
    $balance = TeamCustomerBalance::where('customer_id', $customerId)->find();
    $assertFloat(200, $balance->balance, 'recharge increases balance');
    $assertFloat(200, $balance->recharged, 'recharge increases cumulative recharged');
    $options = $transactionService->options($teamId);
    $assertSame(2, count($options['members']), 'transaction options list team members');
    $assertSame(2, count($options['customers']), 'transaction options list team customers');
    $assertSame('Alice Customer', $options['customers'][0]['nickname'], 'transaction options expose customer nickname');
    $assertFloat(200, $options['customers'][0]['balance']['balance'], 'transaction options expose customer balance');
    $assertThrows(
        fn () => $balanceService->recharge($teamId, $customerId, 0),
        422,
        'zero recharge is rejected'
    );
    $assertThrows(
        fn () => $balanceService->logs($teamId, (int) $fixture['foreignCustomer']->id),
        404,
        'balance logs enforce team scope'
    );

    $senderService->bind($teamId, $secondMemberId, $customerId);
    $bindings = $senderService->bindings($teamId, $secondMemberId);
    $assertSame(1, count($bindings), 'sender binding is listed');
    $bindingId = (int) $bindings[0]['id'];
    $assertThrows(
        fn () => $senderService->bind($teamId, $secondMemberId, $customerId),
        409,
        'duplicate sender binding is rejected'
    );
    $senderService->unbind($teamId, $bindingId);
    $senderService->bind($teamId, $secondMemberId, $customerId);
    $assertSame(1, count($senderService->allBindings($teamId)), 'soft-deleted sender binding can be restored');

    $valid = [
        'handler_id'  => $memberId,
        'sender_id'   => $secondMemberId,
        'cs_id'       => $secondMemberId,
        'customer_id' => $customerId,
        'type'        => TransactionType::LedgerEntry,
        'total_price' => 100,
        'cost'        => 40,
        'cash'        => 100,
        'prepaid'     => 0,
        'handler_cut' => 30,
        'sender_cut'  => 10,
        'cs_cut'      => 5,
        'team_cut'    => 15,
        'trans_at'    => 1_720_000_000,
        'memo'        => 'cash transaction',
    ];

    $assertThrows(
        fn () => $transactionService->create($teamId, [...$valid, 'total_price' => 99]),
        422,
        'invalid transaction math is rejected'
    );
    $assertThrows(
        fn () => $transactionService->create($teamId, [
            ...$valid,
            'total_price' => -100,
            'cash' => -100,
            'cost' => -100,
            'handler_cut' => 0,
            'sender_cut' => 0,
            'cs_cut' => 0,
            'team_cut' => 0,
        ]),
        422,
        'negative monetary values are rejected'
    );
    $assertThrows(
        fn () => $transactionService->create($teamId, [...$valid, 'cash' => null]),
        422,
        'non-numeric monetary values are rejected'
    );
    $assertThrows(
        fn () => $transactionService->create($teamId, [...$valid, 'handler_id' => $fixture['foreignMember']->id]),
        422,
        'foreign handler is rejected'
    );
    $assertThrows(
        fn () => $transactionService->create($teamId, [...$valid, 'sender_id' => $fixture['foreignMember']->id]),
        422,
        'foreign sender is rejected'
    );
    $assertThrows(
        fn () => $transactionService->create($teamId, [...$valid, 'cs_id' => $fixture['foreignMember']->id]),
        422,
        'foreign customer-service member is rejected'
    );
    $assertThrows(
        fn () => $transactionService->create($teamId, [...$valid, 'type' => 999]),
        422,
        'invalid transaction type is rejected'
    );
    $assertThrows(
        fn () => $transactionService->create($teamId, [
            ...$valid,
            'customer_id' => null,
            'cash' => 0,
            'prepaid' => 100,
        ]),
        422,
        'prepaid payment without customer is rejected'
    );

    $cashId = $transactionService->create($teamId, $valid);
    $prepaidId = $transactionService->create($teamId, [
        ...$valid,
        'cash'        => 40,
        'prepaid'     => 60,
        'cost'        => 50,
        'handler_cut' => 20,
        'memo'        => 'prepaid transaction',
        'trans_at'    => 1_720_086_400,
    ]);

    $balance = TeamCustomerBalance::where('customer_id', $customerId)->find();
    $assertFloat(140, $balance->balance, 'prepaid create deducts balance');
    $assertFloat(60, $balance->spent, 'prepaid create increases spent');
    $consumeLog = TeamCustomerBalanceLog::where('trans_id', $prepaidId)->order('id', 'desc')->find();
    $assert($consumeLog?->enumCase('type') === LogType::Consume, 'prepaid create writes consume log');
    $assertFloat(-60, $consumeLog?->amount, 'consume log stores negative amount');

    $keywordList = $transactionService->list($teamId, ['keyword' => 'Alice'], 1, 20);
    $assertSame(2, $keywordList['total'], 'transaction keyword searches customer nickname');
    $assertSame($cashId, (int) $transactionService->get($teamId, $cashId)['id'], 'transaction detail is returned');
    $assertThrows(
        fn () => $transactionService->get((int) $fixture['foreignTeam']->id, $cashId),
        404,
        'transaction detail enforces team scope'
    );

    $transactionService->edit($teamId, $prepaidId, ['cash' => 20, 'prepaid' => 80]);
    $balance = TeamCustomerBalance::where('customer_id', $customerId)->find();
    $assertFloat(120, $balance->balance, 'prepaid edit deducts delta');
    $assertFloat(80, $balance->spent, 'prepaid edit updates spent');

    $balanceService->recharge($teamId, $secondCustomerId, 100, 'second customer balance');
    $transactionService->edit($teamId, $prepaidId, ['customer_id' => $secondCustomerId]);
    $firstBalance = TeamCustomerBalance::where('customer_id', $customerId)->find();
    $secondBalance = TeamCustomerBalance::where('customer_id', $secondCustomerId)->find();
    $assertFloat(200, $firstBalance->balance, 'changing customer refunds original customer');
    $assertFloat(20, $secondBalance->balance, 'changing customer charges new customer');

    $transactionService->edit($teamId, $prepaidId, ['cash' => 70, 'prepaid' => 30]);
    $secondBalance = TeamCustomerBalance::where('customer_id', $secondCustomerId)->find();
    $assertFloat(70, $secondBalance->balance, 'reducing prepaid refunds balance');
    $transactionService->edit($teamId, $prepaidId, ['customer_id' => null, 'cash' => 100, 'prepaid' => 0]);
    $secondBalance = TeamCustomerBalance::where('customer_id', $secondCustomerId)->find();
    $assertFloat(100, $secondBalance->balance, 'clearing prepaid customer refunds remaining payment');
    $transactionService->edit($teamId, $prepaidId, ['customer_id' => $customerId, 'cash' => 50, 'prepaid' => 50]);

    $summary = $statsService->summary($teamId, 1_719_999_999, 1_720_200_000);
    $assertSame(2, (int) $summary['total_count'], 'summary counts transactions');
    $assertFloat(200, $summary['total_price'], 'summary totals transaction amount');
    $roleStats = $statsService->byRole($teamId, 1_719_999_999, 1_720_200_000);
    $assertSame(1, count($roleStats['handler']), 'role stats group handler');
    $assertFloat(50, $roleStats['handler'][0]['amount'], 'role stats use handler cut column');
    $assertSame(1, count($statsService->byMember($teamId, 1_719_999_999, 1_720_200_000, 'handler')), 'member stats group handler');
    $assertSame(2, count($statsService->timeline($teamId, 1_719_999_999, 1_720_200_000, 'day')), 'timeline groups by day');
    $assertSame(1, count($statsService->byCustomer($teamId, 1_719_999_999, 1_720_200_000)), 'customer stats group customer');

    $transactionService->delete($teamId, $prepaidId);
    $firstBalance = TeamCustomerBalance::where('customer_id', $customerId)->find();
    $assertFloat(200, $firstBalance->balance, 'delete refunds prepaid payment');
    $assertFloat(0, $firstBalance->spent, 'delete reverses spent amount');
    $assertSame(null, TeamTransaction::find($prepaidId), 'deleted transaction is hidden by soft delete');

    $shopId = $transactionService->create($teamId, [
        ...$valid,
        'type'        => TransactionType::ShopOrder,
        'total_price' => 10,
        'cost'        => 0,
        'cash'        => 10,
        'handler_cut' => 10,
        'sender_cut'  => 0,
        'cs_cut'      => 0,
        'team_cut'    => 0,
    ]);
    $assertThrows(fn () => $transactionService->edit($teamId, $shopId, ['memo' => 'no']), 422, 'shop transaction edit is rejected');
    $assertThrows(fn () => $transactionService->delete($teamId, $shopId), 422, 'shop transaction delete is rejected');
} finally {
    $db->rollback();
}

$committedFixture = null;
$barrier = null;
try {
    $committedFixture = $db->transaction(fn () => $createFixture(bin2hex(random_bytes(6))));
    $teamId = (int) $committedFixture['team']->id;
    $memberId = (int) $committedFixture['member']->id;
    $customerId = (int) $committedFixture['customer']->id;
    app(Balance::class)->recharge($teamId, $customerId, 100, 'concurrency balance');

    try {
        $db->transaction(function () use ($teamId, $customerId): void {
            app(Balance::class)->recharge($teamId, $customerId, 25, 'must roll back');
            throw new RuntimeException('force rollback');
        });
    } catch (RuntimeException) {
    }
    $balance = TeamCustomerBalance::where('customer_id', $customerId)->find();
    $assertFloat(100, $balance->balance, 'outer transaction rolls back nested balance writes');
    $assertSame(
        1,
        TeamCustomerBalanceLog::where('customer_id', $customerId)->count(),
        'rollback removes nested balance log'
    );

    $barrier = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'lostsky-transaction-' . bin2hex(random_bytes(8));
    $command = [
        PHP_BINARY,
        __FILE__,
        '--worker',
        $barrier,
        (string) $teamId,
        (string) $memberId,
        (string) $customerId,
    ];
    $descriptors = [
        0 => ['pipe', 'r'],
        1 => ['pipe', 'w'],
        2 => ['pipe', 'w'],
    ];
    $workers = [];
    for ($i = 0; $i < 2; $i++) {
        $process = proc_open($command, $descriptors, $pipes, dirname(__DIR__));
        if (!is_resource($process)) {
            throw new RuntimeException('Unable to start transaction concurrency worker.');
        }
        fclose($pipes[0]);
        $workers[] = [$process, $pipes];
    }
    file_put_contents($barrier, 'go');

    $results = [];
    foreach ($workers as [$process, $pipes]) {
        $stdout = trim(stream_get_contents($pipes[1]));
        $stderr = trim(stream_get_contents($pipes[2]));
        fclose($pipes[1]);
        fclose($pipes[2]);
        $exitCode = proc_close($process);
        $result = json_decode($stdout, true);
        if ($exitCode !== 0 || !is_array($result)) {
            $failures[] = 'concurrency worker failed: ' . ($stderr ?: $stdout);
            continue;
        }
        $results[] = $result;
    }

    $successes = array_values(array_filter($results, fn (array $result): bool => $result['ok'] === true));
    $rejections = array_values(array_filter(
        $results,
        fn (array $result): bool => $result['ok'] === false && (int) ($result['status'] ?? 0) === 422
    ));
    $assertSame(1, count($successes), 'only one concurrent prepaid transaction succeeds');
    $assertSame(1, count($rejections), 'second concurrent prepaid transaction is rejected');

    $balance = TeamCustomerBalance::where('customer_id', $customerId)->find();
    $assertFloat(20, $balance->balance, 'concurrent deduction cannot overspend balance');
    $assertFloat(80, $balance->spent, 'concurrent deduction records one spend');
    $assertSame(1, TeamTransaction::where('team_id', $teamId)->count(), 'concurrent requests create one transaction');
} finally {
    if ($barrier && is_file($barrier)) {
        unlink($barrier);
    }
    if ($committedFixture) {
        $cleanupFixture($committedFixture);
    }
}

if ($failures) {
    fwrite(STDERR, implode(PHP_EOL, $failures) . PHP_EOL);
    exit(1);
}

fwrite(STDOUT, "Transaction backend tests passed." . PHP_EOL);
