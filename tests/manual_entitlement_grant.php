<?php
declare(strict_types=1);
require dirname(__DIR__) . '/vendor/autoload.php';
(new \think\App(dirname(__DIR__)))->initialize();
use app\model\{User, Team, TeamCustomer, TeamProduct, TeamServiceEntitlement, TeamTransaction, RedemptionCampaign, RedemptionClaim};
use app\service\{ManualEntitlementGrant, Product, Entity, Redemption, RedemptionCrypto, TeamSetting};
use think\facade\Db;
use think\exception\HttpException;
set_exception_handler(static function (Throwable $e): void { fwrite(STDERR, $e::class . ': ' . $e->getMessage() . "\n" . $e->getTraceAsString() . "\n"); exit(1); });
if (($argv[1] ?? '') === '--worker') {
    $job = json_decode(base64_decode($argv[2]), true, 512, JSON_THROW_ON_ERROR);
    file_put_contents($job['barrier'] . '.ready-' . $job['index'], 'ready');
    $deadline = microtime(true) + 10;
    while (!is_file($job['barrier']) && microtime(true) < $deadline) usleep(10000);
    if (!is_file($job['barrier'])) throw new RuntimeException('worker barrier timeout');
    $trace = [];
    if ($job['kind'] === 'claim') Db::listen(static function ($sql) use (&$trace): void {
        if (preg_match('/^SELECT.*?FROM `([a-z_]+)`/i', $sql, $m)) $trace[] = [$m[1], str_contains($sql, 'FOR UPDATE') ? 'current' : 'consistent'];
    });
    try {
        $call = static fn () => $job['kind'] === 'grant'
            ? app(ManualEntitlementGrant::class)->grant($job['team'], $job['actor'], $job['data'])
            : app(Redemption::class)->claimForCustomer($job['code'], $job['team'], $job['customer'], $job['holder']);
        $result = !empty($job['snapshot']) ? Db::transaction(static function () use ($call): int {
            // 外部调用方已经读取过领取表的 RR 快照，也必须守住总名额。
            Db::name('redemption_claim')->count();
            return $call();
        }) : $call();
        echo json_encode(['ok' => true, 'result' => $result, 'trace' => $trace], JSON_THROW_ON_ERROR);
    } catch (HttpException $e) { echo json_encode(['ok' => false, 'status' => $e->getStatusCode(), 'error' => $e->getMessage(), 'trace' => $trace]); }
    exit;
}
$key = static function (): string { $h = bin2hex(random_bytes(16)); return substr($h, 0, 8) . '-' . substr($h, 8, 4) . '-' . substr($h, 12, 4) . '-' . substr($h, 16, 4) . '-' . substr($h, 20); };
$checks = 0;
$check = static function (bool $ok, string $label) use (&$checks): void { if (!$ok) throw new RuntimeException($label); ++$checks; };
$throws = static function (callable $call, int $status) use ($check): void {
    try { $call(); throw new RuntimeException('expected error ' . $status); }
    catch (HttpException $e) { $check($e->getStatusCode() === $status, 'expected HTTP ' . $status); }
};
$race = static function (array $jobs, string $lockTable, int $lockId): array {
    $barrier = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'lostsky-grant-' . bin2hex(random_bytes(8));
    $workers = [];
    Db::startTrans();
    try {
        Db::name($lockTable)->where('id', $lockId)->lock(true)->find();
        foreach ($jobs as $index => $job) {
            $job += ['barrier' => $barrier, 'index' => $index];
            $process = proc_open([PHP_BINARY, __FILE__, '--worker', base64_encode(json_encode($job, JSON_THROW_ON_ERROR))], [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes, dirname(__DIR__), null, ['bypass_shell' => true, 'create_no_window' => true]);
            if (!is_resource($process)) throw new RuntimeException('worker failed to launch');
            fclose($pipes[0]);
            $workers[] = [$process, $pipes];
        }
        $deadline = microtime(true) + 10;
        while ((!is_file($barrier . '.ready-0') || !is_file($barrier . '.ready-1')) && microtime(true) < $deadline) usleep(10000);
        if (!is_file($barrier . '.ready-0') || !is_file($barrier . '.ready-1')) throw new RuntimeException('workers not ready');
        file_put_contents($barrier, 'go');
        // 两个连接同时进入业务；先持有下游锁，让账本/活动锁竞争真实发生。
        usleep(200000);
        Db::commit();
        $results = [];
        foreach ($workers as [$process, $pipes]) {
            $out = stream_get_contents($pipes[1]); $error = stream_get_contents($pipes[2]);
            fclose($pipes[1]); fclose($pipes[2]);
            $exit = proc_close($process);
            if ($exit !== 0) throw new RuntimeException('worker: ' . $error . $out);
            $results[] = json_decode($out, true, 512, JSON_THROW_ON_ERROR);
        }
        return $results;
    } finally {
        if (Db::getPdo()->inTransaction()) Db::rollback();
        foreach ([$barrier, $barrier . '.ready-0', $barrier . '.ready-1'] as $path) if (is_file($path)) unlink($path);
    }
};
$teamId = $userId = 0; $userIds = [];
try {
    Db::transaction(function () use (&$teamId, &$userId, &$userIds, &$actor, &$customers, &$productId, &$campaignId, &$codes): void {
        $suffix = bin2hex(random_bytes(5));
        $u = new User; $u->save(['phone' => '19' . random_int(100000000, 999999999), 'username' => 'grant-race-' . $suffix, 'password' => 'fixture']); $userId = (int) $u->id; $userIds[] = $userId;
        $team = new Team; $team->save(['slug' => 'grant-race-' . $suffix, 'user_id' => $userId]); $teamId = (int) $team->id;
        $actor = (int) app(Entity::class)->claimTeam($team)->id;
        $customers = [];
        foreach ([0, 1] as $i) {
            $u = new User; $u->save(['phone' => '18' . random_int(100000000, 999999999), 'username' => 'grant-c-' . $suffix . '-' . $i, 'password' => 'fixture']); $userIds[] = (int) $u->id;
            $c = new TeamCustomer; $c->save(['team_id' => $teamId, 'user_id' => $u->id, 'assignee_entity_id' => $actor]);
            app(Entity::class)->claimCustomer((int) $c->id, 'grant-c-' . $suffix . '-' . $i);
            $customers[] = TeamCustomer::find($c->id);
        }
        $productId = app(Product::class)->create($teamId, ['name' => 'Grant race fixture', 'kind' => 4, 'price' => '10.00', 'cost' => '0.00', 'cover_image' => '/fixture.webp', 'redemption' => ['quantity' => '1', 'quantity_step' => '1']]);
        $campaign = new RedemptionCampaign;
        $campaign->save(['issuer_team_id' => $teamId, 'package_id' => TeamProduct::find($productId)->benefit_package_id, 'mode' => \app\enum\RedemptionMode::Unique->value, 'name' => 'last slot', 'total_limit' => 1]);
        $campaignId = (int) $campaign->id; $codes = [];
        foreach ([0, 1] as $i) { $code = app(Redemption::class)->issue($campaignId); $codes[] = app(RedemptionCrypto::class)->decrypt($code->code_ciphertext); }
    });
    $check((int) RedemptionCampaign::find($campaignId)->total_limit === 1, 'fixture total limit actually persisted');
    $service = app(ManualEntitlementGrant::class);
    $data = ['idempotency_key' => $key(), 'product_id' => $productId, 'customer_id' => (int) $customers[0]->id, 'quantity' => 1];
    $throws(fn () => $service->grant($teamId, $actor, array_diff_key($data, ['idempotency_key' => true])), 422);
    $throws(fn () => $service->grant($teamId, $actor, array_replace($data, ['idempotency_key' => 'bad'])), 422);
    $first = $service->grant($teamId, $actor, $data);
    $again = $service->grant($teamId, $actor, array_replace($data, ['quantity' => '1', 'X-Request-Id' => 'different']));
    $check($again['_replayed'] && $first['entitlement_ids'] === $again['entitlement_ids'], 'same normalized request replays original result');
    $request = (new \think\Request)->withPost($data);
    $request->team_id = $teamId; $request->entity_id = $actor; $request->authenticated_user_id = $userId;
    $response = (new \app\transaction\controller\EntitlementGrant)->create($request)->getData();
    $check(!array_key_exists('_replayed', $response['data']) && $response['data']['entitlement_ids'] === $first['entitlement_ids'], 'controller preserves public response and strips internal replay marker');
    $audit = \app\model\BusinessAuditEvent::where('team_id', $teamId)->order('id', 'desc')->find();
    $check($audit->context['changed'] === false && $audit->context['replayed'] === true, 'successful replay audit records no business change');

    Db::name('manual_entitlement_grant_operation')->where('idempotency_key', $data['idempotency_key'])->update(['create_time' => time() - 600, 'update_time' => time() - 600]);
    TeamProduct::where('id', $productId)->update(['is_active' => 0]);
    $check($service->grant($teamId, $actor, $data)['_replayed'], 'replay beyond 300s ignores subsequent product disable');
    $throws(fn () => $service->grant($teamId, $actor, array_replace($data, ['quantity' => 2])), 409);
    $throws(fn () => $service->grant($teamId, $actor, $data, true), 409);
    $new = array_replace($data, ['idempotency_key' => $key()]);
    $throws(fn () => $service->grant($teamId, $actor, $new), 422);
    $check(Db::name('manual_entitlement_grant_operation')->where('idempotency_key', $new['idempotency_key'])->count() === 0, 'failed operation rolls back reservation');
    TeamProduct::where('id', $productId)->update(['is_active' => 1]);
    $check(!$service->grant($teamId, $actor, $new)['_replayed'], 'failed key can retry and new key deliberately grants again');
    $personal = array_replace($data, ['idempotency_key' => $key()]);
    $service->grant($teamId, $actor, $personal, true);
    TeamCustomer::where('id', $customers[0]->id)->update(['assignee_entity_id' => null]);
    $throws(fn () => $service->grant($teamId, $actor, $personal, true), 403);
    TeamCustomer::where('id', $customers[0]->id)->update(['assignee_entity_id' => $actor]);
    // 服务层同样受外层事务约束，模拟权益发放后响应失败前事务异常。
    $rollback = array_replace($data, ['idempotency_key' => $key()]); $before = TeamServiceEntitlement::where('team_id', $teamId)->count();
    try { Db::transaction(function () use ($service, $teamId, $actor, $rollback): void { $service->grant($teamId, $actor, $rollback); throw new RuntimeException('rollback'); }); } catch (RuntimeException $e) { if ($e->getMessage() !== 'rollback') throw $e; }
    $check(TeamServiceEntitlement::where('team_id', $teamId)->count() === $before && Db::name('manual_entitlement_grant_operation')->where('idempotency_key', $rollback['idempotency_key'])->count() === 0, 'outer failure rolls back result and entitlements');
    $service->grant($teamId, $actor, $rollback);
    $ability = new \app\model\TeamAbility; $ability->save(['team_id' => $teamId, 'ability_key' => 'transaction', 'level' => 1]);
    app(TeamSetting::class)->set($teamId, 'shop', 'sync_manual_entitlement_transaction', true);
    $concurrent = array_replace($data, ['idempotency_key' => $key()]);
    $before = TeamServiceEntitlement::where('team_id', $teamId)->count();
    $txBefore = TeamTransaction::where('team_id', $teamId)->count();
    $job = ['kind' => 'grant', 'team' => $teamId, 'actor' => $actor, 'data' => $concurrent];
    $results = $race([$job, $job], 'team_product', $productId);
    $check($results[0]['ok'] && $results[1]['ok'] && $results[0]['result']['entitlement_ids'] === $results[1]['result']['entitlement_ids'], 'concurrent same key returns identical IDs');
    $check(TeamServiceEntitlement::where('team_id', $teamId)->count() === $before + 1 && TeamTransaction::where('team_id', $teamId)->count() === $txBefore + 1, 'concurrent same key creates one entitlement and one transaction');
    $check($results[0]['result']['transaction_id'] === $results[1]['result']['transaction_id'], 'receipt result also replayed');
    $job['data']['idempotency_key'] = $key(); $other = $job; $other['data']['quantity'] = 2;
    $results = $race([$job, $other], 'team_product', $productId);
    $check(count(array_filter($results, fn ($r) => $r['ok'])) === 1 && count(array_filter($results, fn ($r) => !$r['ok'] && $r['status'] === 409)) === 1, 'concurrent different parameters produce one success one conflict');
    $jobs = [];
    foreach ($customers as $i => $customer) $jobs[] = ['kind' => 'claim', 'team' => $teamId, 'code' => $codes[$i], 'customer' => (int) $customer->id, 'holder' => (int) $customer->root_entity_id];
    $results = $race($jobs, 'redemption_campaign', $campaignId);
    $check(count(array_filter($results, fn ($r) => $r['ok'])) === 1 && count(array_filter($results, fn ($r) => !$r['ok'] && $r['status'] === 409)) === 1, 'different cards and targets contend for one last slot ' . json_encode($results));
    $check(RedemptionClaim::where('campaign_id', $campaignId)->count() === 1, 'activity lock prevents total_limit overshoot');
    $campaign = new RedemptionCampaign;
    $campaign->save(['issuer_team_id' => $teamId, 'package_id' => TeamProduct::find($productId)->benefit_package_id, 'mode' => \app\enum\RedemptionMode::Unique->value, 'name' => 'prior RR snapshot', 'total_limit' => 1]);
    $jobs = [];
    foreach ($customers as $customer) {
        $code = app(Redemption::class)->issue((int) $campaign->id);
        $jobs[] = ['kind' => 'claim', 'snapshot' => true, 'team' => $teamId, 'code' => app(RedemptionCrypto::class)->decrypt($code->code_ciphertext), 'customer' => (int) $customer->id, 'holder' => (int) $customer->root_entity_id];
    }
    $results = $race($jobs, 'redemption_campaign', (int) $campaign->id);
    $check(count(array_filter($results, fn ($r) => $r['ok'])) === 1 && count(array_filter($results, fn ($r) => !$r['ok'] && $r['status'] === 409)) === 1, 'current read also protects outer transaction with prior RR snapshot');

} finally {
    if ($teamId) {
        Db::transaction(function () use ($teamId, $userId, $userIds): void {
            $entities = Db::name('entity')->where('entityable_type', 'team')->where('entityable_id', $teamId)->column('id');
            $customerIds = Db::name('team_customer')->where('team_id', $teamId)->column('id');
            $entities = array_merge($entities, Db::name('entity')->where('entityable_type', 'teamCustomer')->whereIn('entityable_id', $customerIds)->column('id'));
            $campaignIds = Db::name('redemption_campaign')->where('issuer_team_id', $teamId)->column('id');
            $packageIds = Db::name('benefit_package')->where('issuer_team_id', $teamId)->column('id');
            foreach (['business_audit_event', 'manual_entitlement_grant_operation', 'team_service_entitlement', 'team_transaction', 'team_customer_sender', 'team_setting', 'team_ability'] as $table) Db::name($table)->where('team_id', $teamId)->delete();
            Db::name('team_customer_balance')->whereIn('customer_id', $customerIds)->delete();
            Db::name('redemption_claim')->whereIn('campaign_id', $campaignIds)->delete();
            Db::name('redemption_code')->whereIn('campaign_id', $campaignIds)->delete();
            Db::name('team_product')->where('team_id', $teamId)->delete();
            Db::name('redemption_campaign')->whereIn('id', $campaignIds)->delete();
            Db::name('benefit_package_service')->whereIn('package_id', $packageIds)->delete();
            Db::name('benefit_package')->whereIn('id', $packageIds)->delete();
            Db::name('team_service')->where('team_id', $teamId)->delete();
            Db::name('team_entity_profile')->whereIn('entity_id', $entities)->delete();
            Db::name('team_customer')->where('team_id', $teamId)->delete();
            Db::name('entity')->whereIn('id', $entities)->delete();
            Db::name('team')->where('id', $teamId)->delete();
            Db::name('user')->whereIn('id', $userIds)->delete();
        });
        $check(Db::name('team')->where('id', $teamId)->count() === 0 && Db::name('manual_entitlement_grant_operation')->where('team_id', $teamId)->count() === 0, 'committed fixtures and ledger cleaned');
    }
}
echo "Manual grant and redemption concurrency: {$checks} assertions passed; committed fixtures cleaned.\n";
