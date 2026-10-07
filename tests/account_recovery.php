<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use app\enum\SmsType;
use app\middleware\JwtAuth;
use app\model\EntitySession;
use app\model\User;
use app\model\UserDevice;
use app\model\UserRefreshToken;
use app\service\AccountRecovery;
use app\service\ChatRealtime;
use app\service\Jwt;
use app\service\Login;
use app\service\RefreshToken;
use app\service\SmsVerification;
use think\App;
use think\exception\HttpException;
use think\facade\Cache;
use think\facade\Db;
use think\Request;

(new App(dirname(__DIR__)))->initialize();
$failures = [];
$count = 0;
$assert = static function (bool $condition, string $case) use (&$failures, &$count): void {
    ++$count;
    if (!$condition) $failures[] = $case;
};
$throws = static function (callable $callback, int $status, string $case) use ($assert): void {
    try { $callback(); $assert(false, $case . ': expected rejection'); }
    catch (HttpException $exception) { $assert($exception->getStatusCode() === $status, $case); }
};

// Exercise both production SDK request/response paths without sending real SMS.
$smsClient = new class extends \AlibabaCloud\SDK\Dysmsapi\V20170525\Dysmsapi {
    public array $codes = [];
    public function __construct() {}
    public function sendSmsWithOptions($request, $runtime) {
        $this->codes[$request->phoneNumbers] = json_decode($request->templateParam, true)['code'];
        return (object) ['body' => (object) ['code' => 'OK']];
    }
};
$pnvsClient = new class extends \AlibabaCloud\SDK\Dypnsapi\V20170525\Dypnsapi {
    public array $codes = [];
    public int $checks = 0;
    public bool $returnedCodeRequested = false;
    public function __construct() {}
    public function sendSmsVerifyCodeWithOptions($request, $runtime) {
        $this->returnedCodeRequested = $request->returnVerifyCode === true;
        // Include purpose-order-independent uniqueness on each request.
        $code = (string) (123450 + ++$this->sequence);
        $this->codes[$request->phoneNumber] = $code;
        return (object) ['body' => (object) ['code' => 'OK', 'success' => true, 'model' => (object) ['verifyCode' => $code]]];
    }
    private int $sequence = 0;
    public function checkSmsVerifyCodeWithOptions($request, $runtime) {
        ++$this->checks;
        // Deliberately accept any code: local purpose hash must reject cross-purpose codes first.
        return (object) ['body' => (object) ['code' => 'OK', 'success' => true, 'model' => (object) ['verifyResult' => 'PASS']]];
    }
};
$sms = new class($smsClient, $pnvsClient) extends SmsVerification {
    public function __construct(private $smsClient, private $pnvsClient) {}
    protected function dysmsClient(): \AlibabaCloud\SDK\Dysmsapi\V20170525\Dysmsapi { return $this->smsClient; }
    protected function dypnsClient(): \AlibabaCloud\SDK\Dypnsapi\V20170525\Dypnsapi { return $this->pnvsClient; }
};
app()->instance(SmsVerification::class, $sms);
$realtime = new class extends ChatRealtime {
    public array $ids = [];
    public function disconnectSession(int $sessionId): void { $this->ids[] = $sessionId; }
};
app()->instance(ChatRealtime::class, $realtime);
$auth = config('auth');
$auth['sms']['debug_bypass'] = false;
$auth['sms']['aliyun_sms'] = ['sign_name' => 'test', 'template_code' => 'test'];
app()->config->set($auth, 'auth');
app()->debug(false);
$jwt = config('jwt');
$jwt['secret'] = str_repeat('r', 64);
app()->config->set($jwt, 'jwt');
$phones = [];
$userIds = [];
$recovery = app(AccountRecovery::class);
$cacheKey = static fn (string $kind, string $phone, string $purpose): string => 'auth_sms_' . $kind . '_' . hash('sha256', $purpose . '|' . $phone);

class RecoveryFailureCache extends \think\cache\driver\File
{
    public static bool $failSet = false;
    public static bool $failDelete = false;
    public function set($name, $value, $expire = null): bool
    {
        if (self::$failSet && str_starts_with($name, 'account_recovery_')) return false;
        return parent::set($name, $value, $expire);
    }
    public function delete($name): bool
    {
        if (self::$failDelete && str_starts_with($name, 'account_recovery_')) return false;
        return parent::delete($name);
    }
}
$originalCache = config('cache');
$failureCache = $originalCache;
$failureCache['stores']['file']['type'] = '\\' . RecoveryFailureCache::class;
app()->config->set($failureCache, 'cache');
app()->cache->forgetDriver();

Db::startTrans();
try {
    $user = new User;
    $phone = '19' . random_int(100000000, 999999999);
    $newPhone = '18' . random_int(100000000, 999999999);
    $phones = [$phone, $newPhone];
    $user->save(['phone' => $phone, 'username' => 'recovery-' . bin2hex(random_bytes(6)), 'password' => password_hash('before-password', PASSWORD_DEFAULT)]);
    $userIds[] = (int) $user->id;

    foreach ([SmsType::AliyunSms, SmsType::AliyunPnvsSms] as $type) {
        $auth['sms']['type'] = $type;
        app()->config->set($auth, 'auth');
        foreach ([$phone, $newPhone] as $number) foreach (['login', 'register', 'recovery', 'recovery_phone'] as $purpose) {
            Cache::delete($cacheKey('send', $number, $purpose));
            Cache::delete($cacheKey('code', $number, $purpose));
        }
        $sms->send($phone, SmsVerification::PURPOSE_LOGIN);
        $loginCode = $type === SmsType::AliyunSms ? $smsClient->codes[$phone] : $pnvsClient->codes[$phone];
        $sms->send($phone, SmsVerification::PURPOSE_RECOVERY);
        $recoveryCode = $type === SmsType::AliyunSms ? $smsClient->codes[$phone] : $pnvsClient->codes[$phone];
        // Extremely unlikely random SMS collision is eliminated explicitly for this assertion.
        if ($loginCode === $recoveryCode) {
            $record = Cache::get($cacheKey('code', $phone, 'login'));
            $loginCode = $recoveryCode === '111111' ? '222222' : '111111';
            $record['code_hash'] = password_hash($loginCode, PASSWORD_DEFAULT);
            Cache::set($cacheKey('code', $phone, 'login'), $record, 300);
        }
        $beforeChecks = $pnvsClient->checks;
        $throws(fn () => $recovery->verify($phone, $loginCode), 422, $type->value . ': login code cannot authorize recovery');
        $assert($pnvsClient->checks === $beforeChecks, 'cross-purpose rejection precedes any PNVS cloud check');
        $issued = $recovery->verify($phone, $recoveryCode);
        $assert($issued['expires_in'] === 600 && !array_key_exists('token', $issued), 'recovery returns only a ten-minute non-login credential');
        $record = Cache::get('account_recovery_' . $user->id);
        $assert($record['hash'] === hash('sha256', $issued['recovery_token']) && !str_contains(json_encode($record), $issued['recovery_token']), 'only credential digest is cached');
        $throws(fn () => $sms->verify($phone, $recoveryCode, 'recovery'), 422, 'original SMS code is consumed');
        $recovery->sendPhoneSms($issued['recovery_token'], $newPhone);
        $newCode = $type === SmsType::AliyunSms ? $smsClient->codes[$newPhone] : $pnvsClient->codes[$newPhone];
        $throws(fn () => $sms->verify($newPhone, $newCode, 'register'), 422, 'new-phone recovery SMS cannot be used for registration');
        $throws(fn () => $sms->verify($newPhone, $newCode, 'login'), 422, 'new-phone recovery SMS cannot be used for login');
        $beforePassword = User::find($user->id)->password;
        $recovery->phone($issued['recovery_token'], $newPhone, $newCode);
        $assert(User::find($user->id)->phone === $newPhone && User::find($user->id)->password === $beforePassword, $type->value . ': real SMS verification completes phone replacement');
        $user->refresh();
        $user->save(['phone' => $phone]);
        $assert($type !== SmsType::AliyunPnvsSms || $pnvsClient->returnedCodeRequested, 'PNVS requests provider-generated code for local purpose hash');
    }

    $auth['sms']['debug_bypass'] = true;
    app()->config->set($auth, 'auth');
    app()->debug(true);
    $first = $recovery->verify($phone, 'debug')['recovery_token'];
    $token = $recovery->verify($phone, 'debug')['recovery_token'];
    $throws(fn () => $recovery->password($first, 'new-password'), 410, 'new issuance invalidates previous token');
    $throws(fn () => $recovery->password($token . 'a', 'new-password'), 410, 'malformed credential rejected');
    $throws(fn () => $recovery->password($token, 'short'), 422, 'password follows six-to-thirty-two character bound');
    $throws(fn () => $recovery->sendPhoneSms($token, $phone), 422, 'same phone rejected');
    $other = new User;
    $other->save(['phone' => '17' . random_int(100000000, 999999999), 'username' => 'recovery-other-' . bin2hex(random_bytes(5)), 'password' => 'test']);
    $userIds[] = (int) $other->id;
    $throws(fn () => $recovery->sendPhoneSms($token, $other->phone), 409, 'occupied new phone rejected');
    $record = Cache::get('account_recovery_' . $user->id);
    Cache::set('account_recovery_' . $user->id, array_replace($record, ['expires_at' => time() - 1]), 60);
    $throws(fn () => $recovery->password($token, 'new-password'), 410, 'expired credential rejected');
    $token = $recovery->verify($phone, 'debug')['recovery_token'];
    $beforePassword = User::find($user->id)->password;
    RecoveryFailureCache::$failDelete = true;
    $throws(fn () => $recovery->password($token, 'failure-password'), 503, 'cache consumption failure closes recovery');
    RecoveryFailureCache::$failDelete = false;
    $assert(User::find($user->id)->password === $beforePassword, 'cache consumption failure cannot mutate password');
    $token = $recovery->verify($phone, 'debug')['recovery_token'];
    RecoveryFailureCache::$failSet = true;
    $throws(fn () => $recovery->verify($phone, 'debug'), 503, 'cache issuance failure cannot return a credential');
    RecoveryFailureCache::$failSet = false;
    $deviceService = app(\app\service\Device::class);
    app()->instance(\app\service\Device::class, new class extends \app\service\Device {
        public function revokeAll(int $userId): array { throw new RuntimeException('injected device transaction failure'); }
    });
    try { $recovery->password($token, 'failure-password'); $assert(false, 'injected transaction failure'); }
    catch (RuntimeException $exception) { $assert($exception->getMessage() === 'injected device transaction failure', 'injected mutation failure rolls back database'); }
    app()->instance(\app\service\Device::class, $deviceService);
    $assert(User::find($user->id)->password === $beforePassword && !Cache::has('account_recovery_' . $user->id), 'database rollback keeps credential consumed');
    $throws(fn () => $recovery->password($token, 'new-password'), 410, 'rollback cannot revive consumed credential');
    $token = $recovery->verify($phone, 'debug')['recovery_token'];
    app()->instance(SmsVerification::class, new class($sms, fn () => $recovery->password($token, 'interleaved-password')) extends SmsVerification {
        public function __construct(private SmsVerification $delegate, private $afterVerify) {}
        public function verify(string $phone, string $code, string $purpose): void {
            $this->delegate->verify($phone, $code, $purpose);
            ($this->afterVerify)();
        }
    });
    $throws(fn () => $recovery->verify($phone, 'debug'), 410, 'original SMS verified before a completed reset cannot issue a late credential');
    app()->instance(SmsVerification::class, $sms);
    $assert(!Cache::has('account_recovery_' . $user->id), 'late issuance does not recreate consumed credential');
    $token = $recovery->verify($phone, 'debug')['recovery_token'];
    app()->instance(SmsVerification::class, new class($sms, function () use ($recovery, $token, $phone, $newPhone): void {
        $recovery->phone($token, $newPhone, 'debug');
        $next = $recovery->verify($newPhone, 'debug')['recovery_token'];
        $recovery->phone($next, $phone, 'debug');
    }) extends SmsVerification {
        private bool $running = false;
        public function __construct(private SmsVerification $delegate, private $afterVerify) {}
        public function verify(string $phone, string $code, string $purpose): void {
            $this->delegate->verify($phone, $code, $purpose);
            if (!$this->running) {
                $this->running = true;
                try { ($this->afterVerify)(); } finally { $this->running = false; }
            }
        }
    });
    $throws(fn () => $recovery->verify($phone, 'debug'), 410, 'A-to-B-to-A cannot revive a verified but not-yet-issued recovery request');
    app()->instance(SmsVerification::class, $sms);
    $token = $recovery->verify($phone, 'debug')['recovery_token'];
    $user->save(['password' => password_hash('changed-outside', PASSWORD_DEFAULT)]);
    $throws(fn () => $recovery->password($token, 'new-password'), 410, 'password change invalidates credential');
    $token = $recovery->verify($phone, 'debug')['recovery_token'];
    $user->save(['phone' => $newPhone]);
    $throws(fn () => $recovery->password($token, 'new-password'), 410, 'original phone change invalidates credential');
    $user->save(['phone' => $phone]);
    $token = $recovery->verify($phone, 'debug')['recovery_token'];
    $user->save(['is_banned' => 1]);
    $throws(fn () => $recovery->password($token, 'new-password'), 403, 'banned user cannot recover');
    $throws(fn () => $sms->send($phone, 'recovery'), 403, 'banned user cannot request original phone SMS');
    $user->save(['is_banned' => 0]);
    $beforeDevices = UserDevice::where('user_id', $user->id)->count();
    app()->instance(SmsVerification::class, new class($sms, (int) $user->id, $newPhone) extends SmsVerification {
        public function __construct(private SmsVerification $delegate, private int $userId, private string $newPhone) {}
        public function verify(string $phone, string $code, string $purpose): void {
            $this->delegate->verify($phone, $code, $purpose);
            User::find($this->userId)->save(['phone' => $this->newPhone]);
        }
    });
    $throws(fn () => app(Login::class)->bySms($phone, 'debug'), 401, 'old-phone SMS login cannot issue a device after an interleaved phone change');
    app()->instance(SmsVerification::class, $sms);
    $assert(UserDevice::where('user_id', $user->id)->count() === $beforeDevices, 'late SMS login creates no device');
    $user->refresh();
    $user->save(['phone' => $phone]);
    $abaToken = $recovery->verify($phone, 'debug')['recovery_token'];
    app()->instance(SmsVerification::class, new class($sms, function () use ($recovery, $abaToken, $phone, $newPhone, $sms): void {
        app()->instance(SmsVerification::class, $sms);
        $recovery->phone($abaToken, $newPhone, 'debug');
        $next = $recovery->verify($newPhone, 'debug')['recovery_token'];
        $recovery->phone($next, $phone, 'debug');
    }) extends SmsVerification {
        public function __construct(private SmsVerification $delegate, private $afterVerify) {}
        public function verify(string $phone, string $code, string $purpose): void {
            $this->delegate->verify($phone, $code, $purpose);
            ($this->afterVerify)();
        }
    });
    $throws(fn () => app(Login::class)->bySms($phone, 'debug'), 401, 'A-to-B-to-A cannot revive a delayed old-phone SMS login');
    app()->instance(SmsVerification::class, $sms);
    $user->refresh();
    $throws(fn () => app(Login::class)->loginSuccess($user, [], ['verified_until' => time() - 1]), 401, 'expired in-flight SMS authorization cannot outlive the generation tombstone');

    $login = app(Login::class)->loginSuccess($user, ['device_name' => 'recovery-test']);
    $device = UserDevice::where('user_id', $user->id)->find();
    $team = app(\app\service\Team::class)->create((int) $user->id, 'recovery-' . bin2hex(random_bytes(5)), 'Recovery');
    $entityId = \app\model\Entity::where('entityable_type', 'team')->where('entityable_id', $team['id'])->value('id');
    $session = new EntitySession;
    $session->save(['user_id' => $user->id, 'device_token' => $device->device_token, 'jti' => bin2hex(random_bytes(24)), 'entity_id' => $entityId, 'expires_at' => time() + 600]);
    $token = $recovery->verify($phone, 'debug')['recovery_token'];
    $staleUser = User::find($user->id);
    $recovery->password($token, 'after-password');
    $assert(password_verify('after-password', (string) User::find($user->id)->password), 'reset stores a password hash');
    $assert(UserDevice::where('user_id', $user->id)->count() === 0, 'all access devices revoked without creating a replacement');
    $assert(UserRefreshToken::where('user_id', $user->id)->whereNull('revoked_at')->count() === 0, 'all refresh tokens revoked');
    $assert(EntitySession::find($session->id)->revoked_at > 0, 'entity sessions revoked');
    $assert(in_array((int) $session->id, $realtime->ids, true), 'realtime disconnect invoked');
    $request = (new Request)->withHeader(['Authorization' => 'Bearer ' . $login['token']]);
    $throws(fn () => app(JwtAuth::class)->handle($request, static fn () => null), 401, 'old access JWT rejected by middleware');
    $throws(fn () => app(RefreshToken::class)->rotate($login['refresh_token']), 401, 'old refresh token cannot rotate');
    $throws(fn () => app(Login::class)->loginSuccess($staleUser, []), 401, 'password login verified before recovery cannot issue a late device');
    $throws(fn () => app(Login::class)->byPhone($phone, 'changed-outside'), 401, 'old password is no longer accepted');
    $throws(fn () => $recovery->password($token, 'replayed-password'), 410, 'successful recovery consumes token');
    $assert(!app(Jwt::class)->validate($token), 'recovery token is not a login JWT');

    $token = $recovery->verify($phone, 'debug')['recovery_token'];
    app(Login::class)->loginSuccess(User::find($user->id), []);
    $recovery->phone($token, $newPhone, 'debug');
    $assert(User::find($user->id)->phone === $newPhone && UserDevice::where('user_id', $user->id)->count() === 0, 'phone replacement updates binding and revokes devices');
    $returnToken = $recovery->verify($newPhone, 'debug')['recovery_token'];
    $recovery->phone($returnToken, $phone, 'debug');
    $throws(fn () => $recovery->password($token, 'replayed-password'), 410, 'A-to-B-to-A cannot revive consumed credential');
    $request = (new Request)->withPost(['phone' => $phone, 'code' => 'debug']);
    $response = (new \app\account\controller\Recovery)->verify($request);
    $assert($response->getHeader('Cache-Control') === 'no-store', 'credential response cannot be cached');
} finally {
    RecoveryFailureCache::$failDelete = false;
    RecoveryFailureCache::$failSet = false;
    foreach ($userIds as $id) {
        Cache::delete('account_recovery_' . $id);
        Cache::delete('account_recovery_generation_' . $id);
    }
    foreach ($phones as $number) foreach (['login', 'register', 'recovery', 'recovery_phone'] as $purpose) foreach (['code', 'send'] as $kind) Cache::delete($cacheKey($kind, $number, $purpose));
    Db::rollback();
    app()->config->set($originalCache, 'cache');
    app()->cache->forgetDriver();
}
if ($failures) { fwrite(STDERR, implode(PHP_EOL, $failures) . PHP_EOL); exit(1); }
fwrite(STDOUT, "Account recovery tests passed ({$count} assertions; real DB, SMS SDK boundary stubs).\n");
