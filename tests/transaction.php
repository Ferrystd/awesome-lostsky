<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use app\enum\LogType;
use app\enum\TeamMemberStatus;
use app\enum\TransactionType;
use app\model\Team;
use app\model\TeamCustomer;
use app\model\TeamCustomerBalance;
use app\model\TeamCustomerBalanceLog;
use app\model\TeamCustomerSender;
use app\model\TeamMember;
use app\model\TeamTransaction;
use app\model\User;
use app\middleware\TransactionVerify;
use app\service\Balance;
use app\service\Entity as EntityService;
use app\service\EntityProfile;
use app\service\Transaction;
use app\service\TransactionStats;
use app\service\TeamCustomerManagement;
use think\App;
use think\Request;
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
            'handler_entity_id'  => (int) $argv[4],
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

if (($argv[1] ?? '') === '--delete-worker') {
    $barrier = (string) ($argv[2] ?? '');
    $deadline = microtime(true) + 10;
    while (!is_file($barrier) && microtime(true) < $deadline) {
        usleep(10_000);
    }

    try {
        app(Transaction::class)->delete((int) $argv[3], (int) $argv[4]);
        fwrite(STDOUT, json_encode(['ok' => true]) . PHP_EOL);
    } catch (Throwable $exception) {
        fwrite(STDOUT, json_encode([
            'ok' => false,
            'status' => $exception instanceof HttpException ? $exception->getStatusCode() : 500,
            'error' => $exception->getMessage(),
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

$exactMoney = (new TeamTransaction)->normalizeMoney([
    'total_price' => '0.30',
    'cost' => '0.00',
    'cash' => '0.10',
    'prepaid' => '0.20',
    'handler_cut' => '0.30',
    'sender_cut' => '0.00',
    'cs_cut' => '0.00',
    'team_cut' => '0.00',
]);
$assertSame('0.30', $exactMoney['total_price'], 'decimal money keeps exact total');
$assertSame('0.20', $exactMoney['prepaid'], 'decimal money keeps exact prepaid amount');

$createFixture = static function (string $suffix): array {
    $users = [];
    foreach (['owner', 'foreign-owner', 'member-a', 'member-b', 'foreign-member', 'customer-a', 'customer-b', 'foreign-customer'] as $index => $label) {
        $user = new User;
        $user->save([
            'phone' => '15' . str_pad((string) random_int(0, 999999999), 9, '0', STR_PAD_LEFT),
            'username' => "transaction-{$label}-{$suffix}",
            'password' => password_hash('transaction-test', PASSWORD_DEFAULT),
        ]);
        $users[$index] = $user;
    }

    $team = new Team;
    $team->save([
        'slug'         => "transaction-test-{$suffix}",
        'user_id'      => $users[0]->id,
        'is_banned'    => 0,
        'is_cancelled' => 0,
    ]);
    $teamEntity = app(EntityService::class)->claimTeam($team);

    $foreignTeam = new Team;
    $foreignTeam->save([
        'slug'         => "transaction-foreign-{$suffix}",
        'user_id'      => $users[1]->id,
        'is_banned'    => 0,
        'is_cancelled' => 0,
    ]);
    $foreignTeamEntity = app(EntityService::class)->claimTeam($foreignTeam);

    $member = new TeamMember;
    $member->save(['team_id' => $team->id, 'user_id' => $users[2]->id, 'status' => TeamMemberStatus::Active]);
    $memberEntity = app(EntityService::class)->claimMember((int) $team->id, (int) $member->id, "transaction-member-{$suffix}");
    app(EntityProfile::class)->update((int) $team->id, (int) $memberEntity->id, ['name' => 'Alice Handler', 'avatar' => '']);

    $secondMember = new TeamMember;
    $secondMember->save(['team_id' => $team->id, 'user_id' => $users[3]->id, 'status' => TeamMemberStatus::Active]);
    $secondMemberEntity = app(EntityService::class)->claimMember((int) $team->id, (int) $secondMember->id, "transaction-sender-{$suffix}");
    app(EntityProfile::class)->update((int) $team->id, (int) $secondMemberEntity->id, ['name' => 'Bob Sender', 'avatar' => '']);

    $foreignMember = new TeamMember;
    $foreignMember->save(['team_id' => $foreignTeam->id, 'user_id' => $users[4]->id, 'status' => TeamMemberStatus::Active]);
    $foreignMemberEntity = app(EntityService::class)->claimMember((int) $foreignTeam->id, (int) $foreignMember->id, "transaction-foreign-member-{$suffix}");

    $customer = new TeamCustomer;
    $customer->save(['team_id' => $team->id, 'user_id' => $users[5]->id, 'is_blocked' => 0]);
    $customerEntity = app(EntityService::class)->claimCustomer((int) $customer->id, "transaction-customer-{$suffix}");
    app(EntityProfile::class)->update((int) $team->id, (int) $customerEntity->id, ['name' => 'Alice Customer']);

    $secondCustomer = new TeamCustomer;
    $secondCustomer->save(['team_id' => $team->id, 'user_id' => $users[6]->id, 'is_blocked' => 0]);
    $secondCustomerEntity = app(EntityService::class)->claimCustomer((int) $secondCustomer->id, "transaction-second-customer-{$suffix}");
    app(EntityProfile::class)->update((int) $team->id, (int) $secondCustomerEntity->id, ['name' => 'Bob Customer']);

    $foreignCustomer = new TeamCustomer;
    $foreignCustomer->save(['team_id' => $foreignTeam->id, 'user_id' => $users[7]->id, 'is_blocked' => 0]);
    $foreignCustomerEntity = app(EntityService::class)->claimCustomer((int) $foreignCustomer->id, "transaction-foreign-customer-{$suffix}");

    return compact(
        'team',
        'foreignTeam',
        'member',
        'secondMember',
        'foreignMember',
        'memberEntity',
        'secondMemberEntity',
        'foreignMemberEntity',
        'teamEntity',
        'foreignTeamEntity',
        'customerEntity',
        'secondCustomerEntity',
        'foreignCustomerEntity',
        'customer',
        'secondCustomer',
        'foreignCustomer',
        'users'
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
    $entityIds = [
        (int) $fixture['memberEntity']->id,
        (int) $fixture['secondMemberEntity']->id,
        (int) $fixture['foreignMemberEntity']->id,
        (int) $fixture['teamEntity']->id,
        (int) $fixture['foreignTeamEntity']->id,
        (int) $fixture['customerEntity']->id,
        (int) $fixture['secondCustomerEntity']->id,
        (int) $fixture['foreignCustomerEntity']->id,
    ];

    $userIds = array_map(static fn (User $user): int => (int) $user->id, $fixture['users']);

    $db->transaction(function () use ($db, $teamIds, $customerIds, $entityIds, $userIds): void {
        $db->name('team_customer_balance_log')->whereIn('customer_id', $customerIds)->delete();
        $db->name('team_transaction')->whereIn('team_id', $teamIds)->delete();
        $db->name('team_customer_balance')->whereIn('customer_id', $customerIds)->delete();
        $db->name('team_customer_sender')->whereIn('team_id', $teamIds)->delete();
        $db->name('team_entity_profile')->whereIn('entity_id', $entityIds)->delete();
        $db->name('team_customer')->whereIn('team_id', $teamIds)->delete();
        $db->name('entity')->whereIn('id', $entityIds)->delete();
        $db->name('team_member')->whereIn('team_id', $teamIds)->delete();
        $db->name('team')->whereIn('id', $teamIds)->delete();
        $db->name('user')->whereIn('id', $userIds)->delete();
    });
};

$db = app()->db;
$db->startTrans();
try {
    $fixture = $createFixture(bin2hex(random_bytes(6)));
    $teamId = (int) $fixture['team']->id;
    $memberId = (int) $fixture['memberEntity']->id;
    $secondMemberId = (int) $fixture['secondMemberEntity']->id;
    $customerId = (int) $fixture['customer']->id;
    $secondCustomerId = (int) $fixture['secondCustomer']->id;

    $balanceService = app(Balance::class);
    $customerManagement = app(TeamCustomerManagement::class);
    $transactionService = app(Transaction::class);
    $statsService = app(TransactionStats::class);

    $balanceService->recharge($teamId, $customerId, 200, 'initial balance');
    TeamCustomerBalanceLog::where('customer_id', $customerId)
        ->where('type', LogType::Recharge->value)
        ->update(['create_time' => 1_720_000_100]);
    $balance = TeamCustomerBalance::where('customer_id', $customerId)->find();
    $assertFloat(200, $balance->balance, 'recharge increases balance');
    $assertFloat(200, $balance->recharged, 'recharge increases cumulative recharged');
    $fixture['customer']->assignee_entity_id = $memberId;
    $fixture['customer']->save();
    $options = $transactionService->options($teamId);
    $assertSame(5, count($options['entities']), 'transaction options list every available team entity');
    $assertSame(2, count($options['customers']), 'transaction options list team customers');
    $assertSame('Alice Customer', $options['customers'][0]['nickname'], 'transaction options expose customer nickname');
    $assertSame($memberId, $options['customers'][0]['assignee_entity_id'], 'transaction options expose customer assignee');
    $assertFloat(200, $options['customers'][0]['balance']['balance'], 'transaction options expose customer balance');
    $fixture['customer']->assignee_entity_id = null;
    $fixture['customer']->save();
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

    $customerManagement->update($teamId, $customerId, [
        'sender_entity_ids' => [$secondMemberId],
    ]);
    $assertSame(1, TeamCustomerSender::where('team_id', $teamId)->where('customer_id', $customerId)->where('entity_id', $secondMemberId)->count(), 'customer update creates a sender binding');
    $senderCustomers = $customerManagement->personalListing($teamId, $secondMemberId, [], 1, 20);
    $assertSame(1, $senderCustomers['total'], 'personal customers include sender-bound customers');
    $assertSame(false, $senderCustomers['list'][0]['is_assignee'], 'sender-only customer is not marked as assigned');
    $assertSame(true, $senderCustomers['list'][0]['is_sender'], 'sender-only customer is marked as collaborative');
    $customerManagement->update($teamId, $customerId, ['sender_entity_ids' => []]);
    $assertSame(0, TeamCustomerSender::where('team_id', $teamId)->where('customer_id', $customerId)->where('entity_id', $secondMemberId)->count(), 'customer update removes a sender binding');
    $customerManagement->update($teamId, $customerId, [
        'sender_entity_ids' => [$secondMemberId],
    ]);
    $assertSame(1, TeamCustomerSender::where('team_id', $teamId)->where('customer_id', $customerId)->where('entity_id', $secondMemberId)->count(), 'customer update restores a soft-deleted sender binding');
    $assertThrows(
        fn () => $customerManagement->update($teamId, $customerId, [
            'sender_entity_ids' => [$secondMemberId, $secondMemberId],
        ]),
        422,
        'customer update rejects duplicate sender entities'
    );
    $assertThrows(
        fn () => $customerManagement->update($teamId, $customerId, [
            'sender_entity_ids' => [$secondMemberId, (int) $fixture['foreignMemberEntity']->id],
        ]),
        422,
        'customer update rejects a foreign sender entity'
    );
    $assertSame(1, TeamCustomerSender::where('team_id', $teamId)->where('customer_id', $customerId)->where('entity_id', $secondMemberId)->count(), 'invalid sender sync rolls back without changing bindings');

    $fixture['customer']->assignee_entity_id = $secondMemberId;
    $fixture['customer']->save();
    $mergedCustomers = $customerManagement->personalListing($teamId, $secondMemberId, [], 1, 20);
    $assertSame(1, $mergedCustomers['total'], 'assigned and sender-bound customer is merged into one personal row');
    $assertSame(true, $mergedCustomers['list'][0]['is_assignee'], 'merged customer keeps assigned relation');
    $assertSame(true, $mergedCustomers['list'][0]['is_sender'], 'merged customer keeps sender relation');
    $fixture['customer']->assignee_entity_id = null;
    $fixture['customer']->save();

    $verifyRequest = static function (Team $team, int $entityId, int $subjectId, int $customerId): Request {
        $request = (new Request)->withPost(['customer_id' => $customerId]);
        $request->team = $team;
        $request->acting_entity = [
            'entity_id' => $entityId,
            'type' => 'teamMember',
            'id' => $subjectId,
        ];
        return $request;
    };
    $assertSame(
        'allowed',
        (new TransactionVerify)->handle(
            $verifyRequest(
                $fixture['team'],
                $secondMemberId,
                (int) $fixture['secondMember']->id,
                $customerId
            ),
            static fn (): string => 'allowed'
        ),
        'transaction verification uses the bound entity id'
    );
    $assertThrows(
        fn () => (new TransactionVerify)->handle(
            $verifyRequest(
                $fixture['team'],
                $memberId,
                (int) $fixture['member']->id,
                $customerId
            ),
            static fn (): string => 'allowed'
        ),
        403,
        'unbound entity cannot operate for a customer'
    );
    $fixture['customer']->assignee_entity_id = $memberId;
    $fixture['customer']->save();
    $personalOptions = $transactionService->options($teamId, $memberId);
    $assertSame([$customerId], array_map('intval', array_column($personalOptions['customers'], 'id')), 'personal transaction options only expose assigned or bound customers');
    $assertSame(
        'allowed',
        (new TransactionVerify)->handle(
            $verifyRequest(
                $fixture['team'],
                $memberId,
                (int) $fixture['member']->id,
                $customerId
            ),
            static fn (): string => 'allowed'
        ),
        'current assignee can operate for their customer without an extra sender binding'
    );
    $memberCustomers = $customerManagement->listing($teamId, [
        'entity_id' => $memberId,
        'type' => 'teamMember',
        'id' => (int) $fixture['member']->id,
    ], [], 1, 20);
    $assertSame('own', $memberCustomers['scope'], 'entity without customer read permission gets an own-customer scope');
    $assertSame(1, $memberCustomers['total'], 'entity without customer read permission sees only assigned customers');
    $assertSame($customerId, (int) $memberCustomers['list'][0]['id'], 'own-customer scope returns the assigned customer');
    $personalCustomers = $customerManagement->personalListing($teamId, $memberId, ['keyword' => 'Alice'], 1, 20);
    $assertSame(1, $personalCustomers['total'], 'personal customers include assigned customers and support keyword filtering');
    $assertSame(true, $personalCustomers['list'][0]['is_assignee'], 'assigned customer is marked as assigned');
    $assertSame(false, $personalCustomers['list'][0]['is_sender'], 'assigned-only customer is not marked as collaborative');
    $assertThrows(
        fn () => $customerManagement->get($teamId, [
            'entity_id' => $memberId,
            'type' => 'teamMember',
            'id' => (int) $fixture['member']->id,
        ], $secondCustomerId),
        404,
        'own-customer scope hides another customer detail'
    );
    $roleId = app()->db->name('team_role')->insertGetId([
        'team_id' => $teamId,
        'role_key' => 'customer-reader-test',
        'name' => 'Customer Reader Test',
        'sort' => 0,
        'is_displayed' => 0,
        'create_time' => time(),
        'update_time' => time(),
    ]);
    app()->db->name('team_role_permission')->insert([
        'team_id' => $teamId,
        'role_id' => $roleId,
        'permission_key' => \app\service\PermissionDictionary::TEAM_CUSTOMER_READ,
        'create_time' => time(),
        'update_time' => time(),
    ]);
    app()->db->name('team_entity_role')->insert([
        'team_id' => $teamId,
        'entity_id' => (int) $fixture['teamEntity']->id,
        'role_id' => $roleId,
        'create_time' => time(),
        'update_time' => time(),
    ]);
    $teamCustomers = $customerManagement->listing($teamId, [
        'entity_id' => (int) $fixture['teamEntity']->id,
        'type' => 'team',
        'id' => $teamId,
    ], [], 1, 20);
    $assertSame('all', $teamCustomers['scope'], 'team entity receives full customer scope');
    $assertSame(2, $teamCustomers['total'], 'team entity sees every customer');
    $customerDetail = $customerManagement->get($teamId, [
        'entity_id' => (int) $fixture['teamEntity']->id,
        'type' => 'team',
        'id' => $teamId,
    ], $customerId);
    $assertSame([$secondMemberId], array_column($customerDetail['senders'], 'entity_id'), 'customer detail exposes sender collaborators');

    $valid = [
        'handler_entity_id'  => $memberId,
        'sender_entity_id'   => $secondMemberId,
        'cs_entity_id'       => $secondMemberId,
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
        fn () => $transactionService->create($teamId, [...$valid, 'handler_entity_id' => $fixture['foreignMemberEntity']->id]),
        422,
        'foreign handler is rejected'
    );
    $assertThrows(
        fn () => $transactionService->create($teamId, [...$valid, 'sender_entity_id' => $fixture['foreignMemberEntity']->id]),
        422,
        'foreign sender is rejected'
    );
    $assertThrows(
        fn () => $transactionService->create($teamId, [...$valid, 'cs_entity_id' => $fixture['foreignMemberEntity']->id]),
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
    $assertSame(
        $memberId,
        (int) TeamTransaction::find($cashId)->sender_entity_id,
        'customer assignee overrides a submitted sender when the transaction is created'
    );
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
    $assertFloat(200, $summary['recharge_total'], 'summary totals recharge logs in the selected period');
    $roleStats = $statsService->byRole($teamId, 1_719_999_999, 1_720_200_000);
    $assertSame(1, count($roleStats['handler']), 'role stats group handler');
    $assertFloat(50, $roleStats['handler'][0]['amount'], 'role stats use handler cut column');
    $assertSame(1, count($statsService->byEntity($teamId, 1_719_999_999, 1_720_200_000, 'handler')), 'entity stats group handler');
    $assertSame(2, count($statsService->timeline($teamId, 1_719_999_999, 1_720_200_000, 'day')), 'timeline groups by day');
    $assertSame(1, count($statsService->byCustomer($teamId, 1_719_999_999, 1_720_200_000)), 'customer stats group customer');
    $assigneeStats = $statsService->byAssignee($teamId, 1_719_999_999, 1_720_200_000);
    $assertSame(1, count($assigneeStats), 'assignee stats group snapshotted senders');
    $assertSame(1, (int) $assigneeStats[0]['customer_count'], 'assignee stats count distinct customers');
    $assertSame(2, (int) $assigneeStats[0]['transaction_count'], 'assignee stats count transactions');
    $assertFloat(200, $assigneeStats[0]['total_price'], 'assignee stats total transaction price');
    $personalTransactions = $transactionService->personal($teamId, $memberId, [], 1, 20);
    $foreignPersonalTransactions = $transactionService->personal($teamId, (int) $fixture['foreignMemberEntity']->id, [], 1, 20);
    $personalStats = $statsService->personal($teamId, $memberId, 1_719_999_999, 1_720_200_000);
    $assertSame(2, $personalTransactions['total'], 'personal transaction scope includes current entity participation');
    $assertSame(0, $foreignPersonalTransactions['total'], 'personal transaction scope cannot be expanded with an unrelated entity');
    $assertSame(2, (int) $personalStats['handler_count'], 'personal stats count current entity handled performance transactions');
    $assertSame(2, (int) $personalStats['sender_count'], 'personal stats count current entity sent performance transactions');
    $assertSame(0, (int) $personalStats['cs_count'], 'personal stats count current entity customer-service performance transactions');
    $assertFloat(200, $personalStats['monthly_performance_total'], 'personal stats total monthly handled performance');
    $assertFloat(200, $personalStats['monthly_flow_total'], 'personal stats total monthly cash and prepaid flow');
    $assertFloat(200, $personalStats['performance_total'], 'personal stats total current entity handled performance');

    $receipt = new TeamTransaction;
    $receipt->save([
        'team_id' => $teamId,
        'handler_entity_id' => null,
        'sender_entity_id' => $secondMemberId,
        'cs_entity_id' => null,
        'customer_id' => $customerId,
        'type' => TransactionType::ServicePackageReceipt,
        'total_price' => '50.00',
        'cost' => '0.00',
        'cash' => '50.00',
        'prepaid' => '0.00',
        'service_credit' => '0.00',
        'handler_cut' => '0.00',
        'sender_cut' => '0.00',
        'cs_cut' => '0.00',
        'team_cut' => '50.00',
        'trans_at' => 1_720_100_000,
        'memo' => '20 次权益包收款',
    ]);
    $adjustmentReceipt = new TeamTransaction;
    $adjustmentReceipt->save([
        'team_id' => $teamId,
        'handler_entity_id' => null,
        'sender_entity_id' => $secondMemberId,
        'cs_entity_id' => null,
        'customer_id' => $customerId,
        'type' => TransactionType::ServiceAdjustmentReceipt,
        'total_price' => '30.00',
        'cost' => '0.00',
        'cash' => '30.00',
        'prepaid' => '0.00',
        'service_credit' => '0.00',
        'handler_cut' => '0.00',
        'sender_cut' => '0.00',
        'cs_cut' => '0.00',
        'team_cut' => '30.00',
        'trans_at' => 1_720_100_100,
    ]);
    // 权益包共有 20 次额度；只有已完成的 10 次产生核销流水，剩余 10 次不产生统计记录。
    for ($index = 0; $index < 10; $index++) {
        $redemption = new TeamTransaction;
        $redemption->save([
            'team_id' => $teamId,
            'handler_entity_id' => $memberId,
            'sender_entity_id' => $secondMemberId,
            'cs_entity_id' => null,
            'customer_id' => $customerId,
            'type' => TransactionType::ServiceRedemption,
            'total_price' => '5.00',
            'cost' => '0.00',
            'cash' => '0.00',
            'prepaid' => '0.00',
            'service_credit' => '5.00',
            'handler_cut' => '0.00',
            'sender_cut' => '0.00',
            'cs_cut' => '0.00',
            'team_cut' => '5.00',
            'trans_at' => 1_720_101_000 + $index,
        ]);
    }
    $adjustmentPerformance = new TeamTransaction;
    $adjustmentPerformance->save([
        'team_id' => $teamId,
        'handler_entity_id' => $memberId,
        'sender_entity_id' => $secondMemberId,
        'cs_entity_id' => null,
        'customer_id' => $customerId,
        'type' => TransactionType::ServiceAdjustmentPerformance,
        'total_price' => '30.00',
        'cost' => '0.00',
        'cash' => '0.00',
        'prepaid' => '0.00',
        'service_credit' => '30.00',
        'handler_cut' => '0.00',
        'sender_cut' => '0.00',
        'cs_cut' => '0.00',
        'team_cut' => '30.00',
        'trans_at' => 1_720_101_100,
    ]);
    $standardOrder = new TeamTransaction;
    $standardOrder->save([
        'team_id' => $teamId,
        'handler_entity_id' => $memberId,
        'sender_entity_id' => $memberId,
        'cs_entity_id' => null,
        'customer_id' => $customerId,
        'type' => TransactionType::ShopOrder,
        'total_price' => '40.00',
        'cost' => '0.00',
        'cash' => '40.00',
        'prepaid' => '0.00',
        'service_credit' => '0.00',
        'handler_cut' => '0.00',
        'sender_cut' => '0.00',
        'cs_cut' => '0.00',
        'team_cut' => '40.00',
        'trans_at' => 1_720_099_000,
    ]);
    $foreignReceipt = new TeamTransaction;
    $foreignReceipt->save([
        'team_id' => (int) $fixture['foreignTeam']->id,
        'handler_entity_id' => (int) $fixture['foreignMemberEntity']->id,
        'type' => TransactionType::ServicePackageReceipt,
        'total_price' => '999.00',
        'cost' => '0.00',
        'cash' => '999.00',
        'prepaid' => '0.00',
        'service_credit' => '0.00',
        'handler_cut' => '0.00',
        'sender_cut' => '0.00',
        'cs_cut' => '0.00',
        'team_cut' => '999.00',
        'trans_at' => 1_720_100_000,
    ]);
    $handlerQuantityStats = $statsService->byEntity($teamId, 1_719_999_999, 1_720_200_000, 'handler');
    $assertSame($memberId, (int) $handlerQuantityStats[0]['entity_id'], 'handler quantity stats sort by count');
    $assertSame(13, (int) $handlerQuantityStats[0]['count'], 'handler quantity stats count shop orders, ledger entries, and completed redemptions');
    $personStats = $statsService->byPerson(
        $teamId,
        1_719_999_999,
        1_720_200_000,
        1,
        20,
        'handler_performance_total',
        'desc'
    );
    $assertSame(2, $personStats['total'], 'person stats include active people and enforce team scope');
    $assertSame($memberId, (int) $personStats['list'][0]['entity_id'], 'person stats sort by handler performance descending');
    $assertSame(13, (int) $personStats['list'][0]['handler_count'], 'person stats count shop orders, ledger entries, and each completed redemption');
    $assertSame(3, (int) $personStats['list'][0]['sender_count'], 'person stats count shop orders and ledger entries as sent orders');
    $assertFloat(320, $personStats['list'][0]['handler_performance_total'], 'person stats include ordinary, redemption, and adjustment handler performance');
    $assertFloat(240, $personStats['list'][0]['sender_performance_total'], 'person stats use actual payments for ordinary sent transactions');
    $assertFloat(70, $personStats['list'][0]['income_total'], 'person stats sum each role cut when one person holds multiple roles');
    $assertSame(1, (int) $personStats['list'][1]['sender_count'], 'one service package purchase counts as one sent order despite ten redemptions');
    $assertFloat(80, $personStats['list'][1]['sender_performance_total'], 'sender performance includes package and adjustment actual payments');
    $updatedPersonalStats = $statsService->personal($teamId, $memberId, 1_719_999_999, 1_720_200_000);
    $assertSame(13, (int) $updatedPersonalStats['handler_count'], 'personal stats share the shop, ledger, and completed-redemption handler count');
    $assertSame(3, (int) $updatedPersonalStats['sender_count'], 'personal stats share the ordinary sent-order count');
    $assertFloat(320, $updatedPersonalStats['performance_total'], 'personal stats include all handler performance types');
    $senderPersonalStats = $statsService->personal($teamId, $secondMemberId, 1_719_999_999, 1_720_200_000);
    $assertSame(1, (int) $senderPersonalStats['sender_count'], 'personal sender count ignores repeated redemptions and adjustment payment');
    $assertFloat(280, $senderPersonalStats['monthly_flow_total'], 'personal flow retains existing participation plus package and adjustment payments');
    $purchasePeriod = $statsService->byPerson($teamId, 1_720_099_900, 1_720_100_050);
    $assertSame(1, (int) $purchasePeriod['list'][0]['sender_count'], 'service package sender count belongs to the payment period');
    $assertFloat(50, $purchasePeriod['list'][0]['sender_performance_total'], 'full package payment belongs to the payment period before redemption');
    $redemptionPeriod = $statsService->byPerson($teamId, 1_720_100_500, 1_720_102_000);
    $redemptionPeople = array_column($redemptionPeriod['list'], null, 'entity_id');
    $assertSame(10, (int) $redemptionPeople[$memberId]['handler_count'], 'completed redemptions belong to their completion period');
    $assertFloat(80, $redemptionPeople[$memberId]['handler_performance_total'], 'redemption period includes redemption and adjustment handler performance');
    $assertSame(0, (int) $redemptionPeople[$secondMemberId]['sender_count'], 'redemption period does not repeat the package sender count');
    $assertFloat(0, $redemptionPeople[$secondMemberId]['sender_performance_total'], 'redemption period does not repeat the package payment');
    $senderCountOrder = $statsService->byPerson($teamId, 1_719_999_999, 1_720_200_000, 1, 20, 'sender_count', 'desc');
    $assertSame($memberId, (int) $senderCountOrder['list'][0]['entity_id'], 'person stats sort by sent-order count using the new counting rules');
    $senderPerformanceOrder = $statsService->byPerson($teamId, 1_719_999_999, 1_720_200_000, 1, 20, 'sender_performance_total', 'desc');
    $assertSame($memberId, (int) $senderPerformanceOrder['list'][0]['entity_id'], 'person stats sort by actual paid sender performance');
    $personPage = $statsService->byPerson(
        $teamId,
        1_719_999_999,
        1_720_200_000,
        2,
        1,
        'handler_count',
        'desc'
    );
    $assertSame(2, $personPage['total'], 'person stats pagination keeps total');
    $assertSame(2, $personPage['page'], 'person stats pagination returns current page');
    $assertSame(1, count($personPage['list']), 'person stats pagination limits list');
    $stableIncome = $statsService->byPerson(
        $teamId,
        1_719_999_999,
        1_720_200_000,
        1,
        20,
        'income_total',
        'desc'
    );
    $assertSame($memberId, (int) $stableIncome['list'][0]['entity_id'], 'person stats sort by personal income');
    $assertSame(3, count($statsService->timeline($teamId, 1_719_999_999, 1_720_200_000, 'hour')), 'timeline supports hourly grouping');
    $assertSame($cashId, (int) $transactionService->getPersonal($teamId, $memberId, $cashId)['id'], 'personal transaction detail checks participation');
    $assertThrows(
        fn () => $transactionService->getPersonal($teamId, (int) $fixture['foreignMemberEntity']->id, $cashId),
        404,
        'personal transaction detail hides unrelated records'
    );

    $fixture['customer']->assignee_entity_id = $secondMemberId;
    $fixture['customer']->save();
    $assertSame(
        $memberId,
        (int) TeamTransaction::find($cashId)->sender_entity_id,
        'changing customer assignment does not rewrite historical transactions'
    );

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
    $memberId = (int) $committedFixture['memberEntity']->id;
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

    $transactionId = (int) $successes[0]['id'];
    unlink($barrier);
    $barrier = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'lostsky-transaction-delete-' . bin2hex(random_bytes(8));
    $deleteCommand = [
        PHP_BINARY,
        __FILE__,
        '--delete-worker',
        $barrier,
        (string) $teamId,
        (string) $transactionId,
    ];
    $workers = [];
    for ($i = 0; $i < 2; $i++) {
        $process = proc_open($deleteCommand, $descriptors, $pipes, dirname(__DIR__));
        if (!is_resource($process)) {
            throw new RuntimeException('Unable to start transaction delete worker.');
        }
        fclose($pipes[0]);
        $workers[] = [$process, $pipes];
    }
    file_put_contents($barrier, 'go');

    $deleteResults = [];
    foreach ($workers as [$process, $pipes]) {
        $stdout = trim(stream_get_contents($pipes[1]));
        $stderr = trim(stream_get_contents($pipes[2]));
        fclose($pipes[1]);
        fclose($pipes[2]);
        $exitCode = proc_close($process);
        $result = json_decode($stdout, true);
        if ($exitCode !== 0 || !is_array($result)) {
            $failures[] = 'delete concurrency worker failed: ' . ($stderr ?: $stdout);
            continue;
        }
        $deleteResults[] = $result;
    }
    $deleteSuccesses = array_values(array_filter(
        $deleteResults,
        fn (array $result): bool => $result['ok'] === true
    ));
    $deleteMissing = array_values(array_filter(
        $deleteResults,
        fn (array $result): bool => $result['ok'] === false && (int) ($result['status'] ?? 0) === 404
    ));
    $assertSame(1, count($deleteSuccesses), 'only one concurrent transaction delete succeeds');
    $assertSame(1, count($deleteMissing), 'second concurrent transaction delete sees the deleted row');
    $balance = TeamCustomerBalance::where('customer_id', $customerId)->find();
    $assertFloat(100, $balance->balance, 'concurrent delete refunds prepaid payment once');
    $assertFloat(0, $balance->spent, 'concurrent delete reverses spent once');
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
