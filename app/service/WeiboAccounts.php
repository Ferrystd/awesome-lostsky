<?php
declare(strict_types=1);

namespace app\service;

use app\enum\WeiboAccountHealth;
use app\enum\WeiboTaskStatus;
use app\model\WeiboAccount;
use app\model\WeiboAccountBinding;
use app\model\WeiboTask;
use app\model\WeiboTaskAccount;
use think\exception\HttpException;
use think\facade\Cache;
use think\facade\Db;

final class WeiboAccounts
{
    public function list(int $teamId, int $entityId, bool $teamScope): array
    {
        $query = WeiboAccountBinding::where('team_id', $teamId);
        if (!$teamScope) $query->where('entity_id', $entityId);
        $items = [];
        foreach ($query->order('id', 'desc')->select() as $binding) {
            $account = WeiboAccount::find($binding->account_id);
            if (!$account) continue;
            $items[] = $account->publicSummary() + ['binding_id' => $binding->id, 'entity_id' => $binding->entity_id];
        }
        return $items;
    }

    public function detail(int $teamId, int $entityId, int $accountId, bool $teamScope): array
    {
        $account = $this->bound($teamId, $entityId, $accountId, $teamScope);
        $query = WeiboAccountBinding::where('team_id', $teamId)->where('account_id', $accountId);
        if (!$teamScope) $query->where('entity_id', $entityId);
        $binding = $query->find();
        return $account->publicSummary() + ['binding_id' => $binding->id, 'entity_id' => $binding->entity_id];
    }

    public function start(int $teamId, int $entityId, string $phone): array
    {
        app(Entity::class)->assertInTeam($entityId, $teamId);
        $normalizedPhone = ltrim(preg_replace('/[\s-]+/', '', $phone) ?? '', '+');
        $account = WeiboAccount::where('phone', $normalizedPhone)->find();
        $challengeId = bin2hex(random_bytes(16));
        if ($account) {
            $checked = app(WeiboProtocol::class)->check($account);
            $health = $checked['valid'] === true ? WeiboAccountHealth::Valid : ($checked['valid'] === false ? WeiboAccountHealth::Invalid : WeiboAccountHealth::Unknown);
            $account->save(['health' => $health->value, 'checked_at' => time()]);
        }
        if ($account && $account->enumCase('health') === WeiboAccountHealth::Valid) {
            $phone = $account->getData('phone');
            if (!is_string($phone) || $phone === '') throw new HttpException(500, '微博账号手机号无效');
            $result = app(SmsVerification::class)->send($phone, SmsVerification::PURPOSE_WEIBO_BIND);
            $expiresIn = $result['expires_in'] ?? 600;
            if (!is_int($expiresIn)) $expiresIn = 600;
            Cache::set($this->key($challengeId), ['kind' => 'lostsky', 'team_id' => $teamId, 'entity_id' => $entityId, 'account_id' => $account->id, 'phone' => $phone, 'sms_purpose' => SmsVerification::PURPOSE_WEIBO_BIND], 600);
            return ['challenge_id' => $challengeId, 'kind' => 'lostsky', 'expires_in' => $expiresIn];
        }
        $challenge = app(WeiboProtocol::class)->sendLoginSms($phone);
        Cache::set($this->key($challengeId), ['kind' => 'weibo', 'team_id' => $teamId, 'entity_id' => $entityId] + $challenge, 600);
        return ['challenge_id' => $challengeId, 'kind' => 'weibo', 'expires_in' => 600];
    }

    public function confirm(int $teamId, int $entityId, string $challengeId, string $code): array
    {
        $key = $this->key($challengeId);
        $challenge = Cache::get($key);
        if (!is_array($challenge) || ($challenge['team_id'] ?? null) !== $teamId || ($challenge['entity_id'] ?? null) !== $entityId) throw new HttpException(422, '登录挑战已失效');
        if (($challenge['kind'] ?? '') === 'lostsky') {
            $phone = $challenge['phone'] ?? null;
            $accountId = $challenge['account_id'] ?? null;
            if (!is_string($phone) || !is_int($accountId)) throw new HttpException(422, '登录挑战已失效');
            app(SmsVerification::class)->verify($phone, $code, $challenge['sms_purpose'] ?? SmsVerification::PURPOSE_LOGIN);
            $account = WeiboAccount::find($accountId);
            if (!$account) throw new HttpException(404, '微博账号不存在');
        } else {
            $phone = $challenge['phone'] ?? null;
            $fromValue = $challenge['from_value'] ?? null;
            if (!is_string($phone) || !is_string($fromValue)) throw new HttpException(422, '登录挑战已失效');
            $data = app(WeiboProtocol::class)->login($phone, $code, $fromValue);
            $account = WeiboAccount::withTrashed()->where('uid', $data['uid'])->whereOr('phone', $data['phone'])->find() ?: new WeiboAccount;
            if ($account->isExists()) $account->restore();
            $account->save($data + ['health' => WeiboAccountHealth::Valid->value, 'checked_at' => time()]);
        }
        $binding = WeiboAccountBinding::withTrashed()->where('team_id', $teamId)->where('entity_id', $entityId)->where('account_id', $account->id)->find() ?: new WeiboAccountBinding;
        if ($binding->isExists()) $binding->restore();
        $binding->save(['team_id' => $teamId, 'entity_id' => $entityId, 'account_id' => $account->id]);
        Cache::delete($key);
        return $account->publicSummary() + ['binding_id' => $binding->id, 'entity_id' => $entityId];
    }

    public function check(int $teamId, int $entityId, int $accountId, bool $teamScope): array
    {
        $account = $this->bound($teamId, $entityId, $accountId, $teamScope);
        $result = app(WeiboProtocol::class)->check($account);
        $health = $result['valid'] === true ? WeiboAccountHealth::Valid : ($result['valid'] === false ? WeiboAccountHealth::Invalid : WeiboAccountHealth::Unknown);
        $account->save(['health' => $health->value, 'checked_at' => time()]);
        return $account->publicSummary() + ['check' => ['valid' => $result['valid'], 'reason' => $result['reason']->name, 'message' => $result['message'], 'code' => $result['code']]];
    }

    public function unbind(int $teamId, int $entityId, int $bindingId, bool $teamScope): void
    {
        $query = WeiboAccountBinding::where('team_id', $teamId)->where('id', $bindingId);
        if (!$teamScope) $query->where('entity_id', $entityId);
        $binding = $query->find();
        if (!$binding) throw new HttpException(404, '账号绑定不存在');
        Db::transaction(function () use ($teamId, $binding): void {
            $accountId = $binding->account_id;
            $binding->delete();
            $taskIds = WeiboTaskAccount::where('account_id', $accountId)->column('task_id');
            if (!$taskIds) return;
            $tasks = WeiboTask::where('team_id', $teamId)
                ->whereIn('id', $taskIds)
                ->where('status', WeiboTaskStatus::Active->value)
                ->lock(true)
                ->select();
            foreach ($tasks as $task) {
                // 与调度选号同口径：账号在任务范围内仍有其他绑定时不受影响。
                $remaining = WeiboAccountBinding::where('team_id', $teamId)->where('account_id', $accountId);
                if ($task->owner_entity_id !== null) $remaining->where('entity_id', $task->owner_entity_id);
                // 使用当前读，避免等待 task 行锁前创建的事务快照漏掉并行解绑。
                if ($remaining->lock(true)->find()) continue;
                $version = $task->version + 1;
                $updated = WeiboTask::where('id', $task->id)
                    ->where('status', WeiboTaskStatus::Active->value)
                    ->where('version', $task->version)
                    ->update(['status' => WeiboTaskStatus::BlockedLogin->value, 'block_reason' => 'account_unbound', 'next_run_at' => null, 'version' => $version]);
                if ($updated) {
                    app(Notice::class)->sendOnce($teamId, '微博任务已阻塞', '任务引用的微博账号已解绑，任务已阻塞；重新绑定账号后请手动恢复任务。', "weibo:task:{$task->id}:unbound:v{$version}");
                }
            }
        });
    }

    public function bound(int $teamId, int $entityId, int $accountId, bool $teamScope): WeiboAccount
    {
        $query = WeiboAccountBinding::where('team_id', $teamId)->where('account_id', $accountId);
        if (!$teamScope) $query->where('entity_id', $entityId);
        if (!$query->find()) throw new HttpException(404, '账号未绑定到当前范围');
        $account = WeiboAccount::find($accountId);
        if (!$account) throw new HttpException(404, '微博账号不存在');
        return $account;
    }

    private function key(string $id): string { return 'weibo_login_challenge:' . $id; }
}
