<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use app\model\User;
use app\enum\SmsType;
use app\service\Login;
use app\service\Register;
use app\service\SmsVerification;
use think\App;
use think\exception\HttpException;

(new App(dirname(__DIR__)))->initialize();

$failures = [];
$assert = static function (bool $condition, string $case) use (&$failures): void {
    if (!$condition) {
        $failures[] = $case;
    }
};
$assertThrows = static function (callable $callback, string $class, string $case) use (&$failures): void {
    try {
        $callback();
        $failures[] = "{$case}: expected {$class}";
    } catch (Throwable $exception) {
        if (!$exception instanceof $class) {
            $failures[] = "{$case}: expected {$class}, got " . $exception::class;
        }
    }
};

$assert(
    class_exists(\AlibabaCloud\SDK\Dysmsapi\V20170525\Dysmsapi::class)
    && method_exists(\AlibabaCloud\SDK\Dysmsapi\V20170525\Dysmsapi::class, 'sendSmsWithOptions'),
    'Alibaba Cloud SMS Service SDK exposes SendSms'
);
$assert(
    class_exists(\AlibabaCloud\SDK\Dypnsapi\V20170525\Dypnsapi::class)
    && method_exists(\AlibabaCloud\SDK\Dypnsapi\V20170525\Dypnsapi::class, 'sendSmsVerifyCodeWithOptions')
    && method_exists(\AlibabaCloud\SDK\Dypnsapi\V20170525\Dypnsapi::class, 'checkSmsVerifyCodeWithOptions'),
    'Alibaba Cloud PNVS SDK exposes SMS authentication send and check APIs'
);
$pnvsRequest = new \AlibabaCloud\SDK\Dypnsapi\V20170525\Models\SendSmsVerifyCodeRequest([
    'phoneNumber' => '13800000000',
    'templateParam' => '{"code":"##code##","min":"5"}',
]);
$assert(
    $pnvsRequest->phoneNumber === '13800000000'
    && str_contains((string) $pnvsRequest->templateParam, '##code##'),
    'PNVS SMS authentication request model accepts provider-generated code parameters'
);

$jwtConfig = config('jwt');
$jwtConfig['secret'] = str_repeat('s', 64);
app()->config->set($jwtConfig, 'jwt');

$authConfig = config('auth');
$authConfig['sms']['debug_bypass'] = true;
$authConfig['sms']['type'] = SmsType::AliyunSms;
app()->config->set($authConfig, 'auth');
app()->debug(true);
$assert(
    config('auth.sms.type') === SmsType::AliyunSms,
    'SMS type is configured as a backed enum'
);

$db = app()->db;
$db->startTrans();
try {
    $phone = '19' . random_int(100000000, 999999999);
    $send = app(SmsVerification::class)->send($phone, SmsVerification::PURPOSE_REGISTER);
    $assert(
        ($send['debug_bypass'] ?? false) === true && ($send['retry_after'] ?? -1) === 0,
        'debug bypass skips cloud sending only when explicitly enabled'
    );

    $registered = app(Register::class)->phone($phone, 'anything', 'sms-test-password', [
        'device_name' => 'SMS Auth Test',
        'ua' => 'tests/sms_auth.php',
    ]);
    $user = User::where('phone', $phone)->find();
    $assert(
        (bool) ($registered['token'] ?? '') && $user && password_verify('sms-test-password', (string) $user->password),
        'SMS registration verifies the phone, hashes the password, and signs in'
    );

    app(SmsVerification::class)->send($phone, SmsVerification::PURPOSE_LOGIN);
    $smsLogin = app(Login::class)->bySms($phone, 'any-code', [
        'device_name' => 'SMS Login Test',
        'ua' => 'tests/sms_auth.php',
    ]);
    $assert((bool) ($smsLogin['token'] ?? ''), 'SMS login reuses the normal token and device flow');

    $passwordLogin = app(Login::class)->byAccount($phone, 'sms-test-password', [
        'device_name' => 'Password Login Test',
        'ua' => 'tests/sms_auth.php',
    ]);
    $assert((bool) ($passwordLogin['token'] ?? ''), 'password login accepts a phone number account');

    $legacyPhone = '18' . random_int(100000000, 999999999);
    $legacy = new User;
    $legacy->save([
        'phone' => $legacyPhone,
        'email' => null,
        'password' => 'legacy-password',
        'username' => 'legacy_' . bin2hex(random_bytes(4)),
    ]);
    app(Login::class)->byPhone($legacyPhone, 'legacy-password');
    $legacy->refresh();
    $assert(
        password_verify('legacy-password', (string) $legacy->password),
        'legacy plaintext password migrates to a hash after successful login'
    );

    app()->debug(false);
    $assertThrows(
        fn () => app(SmsVerification::class)->verify($phone, 'anything', SmsVerification::PURPOSE_LOGIN),
        HttpException::class,
        'debug bypass flag cannot bypass verification when APP_DEBUG is false'
    );
} finally {
    app()->debug(true);
    $db->rollback();
}

if ($failures) {
    fwrite(STDERR, implode(PHP_EOL, $failures) . PHP_EOL);
    exit(1);
}

fwrite(STDOUT, "SMS authentication verification passed\n");
