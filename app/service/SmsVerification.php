<?php
declare(strict_types=1);

namespace app\service;

use AlibabaCloud\SDK\Dypnsapi\V20170525\Dypnsapi as DypnsClient;
use AlibabaCloud\SDK\Dypnsapi\V20170525\Models\CheckSmsVerifyCodeRequest;
use AlibabaCloud\SDK\Dypnsapi\V20170525\Models\SendSmsVerifyCodeRequest;
use AlibabaCloud\SDK\Dysmsapi\V20170525\Dysmsapi as DysmsClient;
use AlibabaCloud\SDK\Dysmsapi\V20170525\Models\SendSmsRequest;
use AlibabaCloud\Dara\Models\RuntimeOptions;
use Darabonba\OpenApi\Models\Config;
use app\enum\SmsType;
use app\model\User;
use app\validate\SmsVerification as SmsVerificationValidator;
use think\exception\HttpException;
use think\facade\Cache;
use think\facade\Log;

class SmsVerification
{
    public const PURPOSE_REGISTER = 'register';
    public const PURPOSE_LOGIN = 'login';

    /**
     * 发送短信验证码。
     */
    public function send(string $phone, string $purpose): array
    {
        $this->validateSend($phone, $purpose);
        $this->assertPurposeState($phone, $purpose);

        if ($this->debugBypass()) {
            return [
                'expires_in' => $this->validTime(),
                'retry_after' => 0,
                'debug_bypass' => true,
            ];
        }

        $lockKey = $this->key('send', $phone, $purpose);
        if (Cache::has($lockKey)) {
            throw new HttpException(429, '验证码发送过于频繁，请稍后再试');
        }

        match ($this->type()) {
            SmsType::AliyunSms => $this->sendByAliyunSms($phone, $purpose),
            SmsType::AliyunPnvsSms => $this->sendByAliyunPnvsSms($phone, $purpose),
        };

        Cache::set($lockKey, 1, $this->interval());

        return [
            'expires_in' => $this->validTime(),
            'retry_after' => $this->interval(),
            'debug_bypass' => false,
        ];
    }

    /**
     * 核验短信验证码，成功后立即失效。
     */
    public function verify(string $phone, string $code, string $purpose): void
    {
        if ($this->debugBypass()) {
            return;
        }

        $validator = new SmsVerificationValidator;
        if (!$validator->scene('verify')->check(['phone' => $phone, 'code' => $code])) {
            throw new HttpException(422, $validator->getError());
        }

        $recordKey = $this->key('code', $phone, $purpose);
        $record = Cache::get($recordKey);
        $type = $this->type();
        if (!is_array($record) || ($record['type'] ?? '') !== $type->value) {
            throw new HttpException(422, '验证码已失效，请重新获取');
        }

        $attempts = (int) ($record['attempts'] ?? 0) + 1;
        if ($attempts > $this->maxAttempts()) {
            Cache::delete($recordKey);
            throw new HttpException(429, '验证码尝试次数过多，请重新获取');
        }

        $passed = match ($type) {
            SmsType::AliyunSms => password_verify($code, (string) ($record['code_hash'] ?? '')),
            SmsType::AliyunPnvsSms => $this->checkByAliyunPnvsSms($phone, $code),
        };

        if (!$passed) {
            $record['attempts'] = $attempts;
            $remaining = max(1, (int) ($record['expires_at'] ?? time()) - time());
            Cache::set($recordKey, $record, $remaining);
            throw new HttpException(422, '验证码错误或已失效');
        }

        Cache::delete($recordKey);
    }

    private function validateSend(string $phone, string $purpose): void
    {
        $validator = new SmsVerificationValidator;
        if (!$validator->scene('send')->check(['phone' => $phone, 'purpose' => $purpose])) {
            throw new HttpException(422, $validator->getError());
        }
    }

    private function assertPurposeState(string $phone, string $purpose): void
    {
        $exists = User::where('phone', $phone)->find();
        if ($purpose === self::PURPOSE_REGISTER && $exists) {
            throw new HttpException(409, '手机号已注册');
        }
        if ($purpose === self::PURPOSE_LOGIN && !$exists) {
            throw new HttpException(404, '手机号尚未注册');
        }
    }

    private function sendByAliyunSms(string $phone, string $purpose): void
    {
        $code = str_pad((string) random_int(0, (10 ** $this->codeLength()) - 1), $this->codeLength(), '0', STR_PAD_LEFT);
        $recordKey = $this->key('code', $phone, $purpose);
        $record = [
            'type' => SmsType::AliyunSms->value,
            'code_hash' => password_hash($code, PASSWORD_DEFAULT),
            'attempts' => 0,
            'expires_at' => time() + $this->validTime(),
        ];
        Cache::set($recordKey, $record, $this->validTime());

        try {
            $settings = (array) config('auth.sms.aliyun_sms');
            $this->assertConfigured($settings, ['sign_name', 'template_code']);
            $request = new SendSmsRequest([
                'phoneNumbers' => $phone,
                'signName' => $settings['sign_name'],
                'templateCode' => $settings['template_code'],
                'templateParam' => json_encode([
                    'code' => $code,
                    'min' => (string) max(1, (int) ceil($this->validTime() / 60)),
                ], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
            ]);
            $response = $this->dysmsClient()->sendSmsWithOptions($request, new RuntimeOptions([]));
            $body = $response->body ?? null;
            if (($body->code ?? '') !== 'OK') {
                $this->cloudFailure(SmsType::AliyunSms, (string) ($body->code ?? ''), (string) ($body->requestId ?? ''));
            }
        } catch (HttpException $exception) {
            Cache::delete($recordKey);
            throw $exception;
        } catch (\Throwable $exception) {
            Cache::delete($recordKey);
            $this->cloudException(SmsType::AliyunSms, $exception);
        }
    }

    private function sendByAliyunPnvsSms(string $phone, string $purpose): void
    {
        $recordKey = $this->key('code', $phone, $purpose);

        try {
            $settings = (array) config('auth.sms.aliyun_pnvs_sms');
            $this->assertConfigured($settings, ['sign_name', 'template_code']);
            $params = [
                'phoneNumber' => $phone,
                'countryCode' => (string) config('auth.sms.country_code'),
                'signName' => $settings['sign_name'],
                'templateCode' => $settings['template_code'],
                'templateParam' => json_encode([
                    'code' => '##code##',
                    'min' => (string) max(1, (int) ceil($this->validTime() / 60)),
                ], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
                'codeLength' => $this->codeLength(),
                'codeType' => 1,
                'validTime' => $this->validTime(),
                'interval' => $this->interval(),
                'duplicatePolicy' => 1,
                'returnVerifyCode' => false,
            ];
            if (($settings['scheme_name'] ?? '') !== '') {
                $params['schemeName'] = $settings['scheme_name'];
            }

            $response = $this->dypnsClient()->sendSmsVerifyCodeWithOptions(
                new SendSmsVerifyCodeRequest($params),
                new RuntimeOptions([])
            );
            $body = $response->body ?? null;
            if (($body->code ?? '') !== 'OK' || !($body->success ?? false)) {
                $this->cloudFailure(SmsType::AliyunPnvsSms, (string) ($body->code ?? ''), (string) ($body->requestId ?? ''));
            }

            Cache::set($recordKey, [
                'type' => SmsType::AliyunPnvsSms->value,
                'attempts' => 0,
                'expires_at' => time() + $this->validTime(),
            ], $this->validTime());
        } catch (HttpException $exception) {
            throw $exception;
        } catch (\Throwable $exception) {
            $this->cloudException(SmsType::AliyunPnvsSms, $exception);
        }
    }

    private function checkByAliyunPnvsSms(string $phone, string $code): bool
    {
        try {
            $settings = (array) config('auth.sms.aliyun_pnvs_sms');
            $params = [
                'phoneNumber' => $phone,
                'countryCode' => (string) config('auth.sms.country_code'),
                'verifyCode' => $code,
                'caseAuthPolicy' => 1,
            ];
            if (($settings['scheme_name'] ?? '') !== '') {
                $params['schemeName'] = $settings['scheme_name'];
            }

            $response = $this->dypnsClient()->checkSmsVerifyCodeWithOptions(
                new CheckSmsVerifyCodeRequest($params),
                new RuntimeOptions([])
            );
            $body = $response->body ?? null;
            if (($body->code ?? '') !== 'OK' || !($body->success ?? false)) {
                $this->cloudFailure(SmsType::AliyunPnvsSms, (string) ($body->code ?? ''), (string) ($body->requestId ?? ''));
            }

            return ($body->model->verifyResult ?? '') === 'PASS';
        } catch (HttpException $exception) {
            throw $exception;
        } catch (\Throwable $exception) {
            $this->cloudException(SmsType::AliyunPnvsSms, $exception);
        }
    }

    private function dysmsClient(): DysmsClient
    {
        $config = $this->cloudConfig();
        $config->endpoint = 'dysmsapi.aliyuncs.com';
        return new DysmsClient($config);
    }

    private function dypnsClient(): DypnsClient
    {
        $config = $this->cloudConfig();
        $config->endpoint = 'dypnsapi.aliyuncs.com';
        return new DypnsClient($config);
    }

    private function cloudConfig(): Config
    {
        $accessKeyId = (string) config('aliyun.access_key_id');
        $accessKeySecret = (string) config('aliyun.access_key_secret');
        if ($accessKeyId === '' || $accessKeySecret === '') {
            throw new HttpException(503, '短信服务尚未配置');
        }

        return new Config([
            'accessKeyId' => $accessKeyId,
            'accessKeySecret' => $accessKeySecret,
        ]);
    }

    private function assertConfigured(array $settings, array $keys): void
    {
        foreach ($keys as $key) {
            if (($settings[$key] ?? '') === '') {
                throw new HttpException(503, '短信服务尚未配置');
            }
        }
    }

    private function cloudFailure(SmsType $type, string $code, string $requestId): never
    {
        Log::warning('短信验证码云服务返回失败', [
            'type' => $type->value,
            'code' => $code,
            'requestId' => $requestId,
        ]);
        throw new HttpException(503, '验证码发送或核验失败，请稍后再试');
    }

    private function cloudException(SmsType $type, \Throwable $exception): never
    {
        Log::error('短信验证码云服务异常', [
            'type' => $type->value,
            'exception' => $exception::class,
            'message' => $exception->getMessage(),
        ]);
        throw new HttpException(503, '短信服务暂时不可用，请稍后再试');
    }

    private function type(): SmsType
    {
        $type = config('auth.sms.type');
        if (!$type instanceof SmsType) {
            throw new HttpException(503, '短信服务配置不正确');
        }
        return $type;
    }

    private function debugBypass(): bool
    {
        return app()->isDebug() && (bool) config('auth.sms.debug_bypass');
    }

    private function codeLength(): int
    {
        return min(8, max(4, (int) config('auth.sms.code_length')));
    }

    private function validTime(): int
    {
        return max(60, (int) config('auth.sms.valid_time'));
    }

    private function interval(): int
    {
        return max(1, (int) config('auth.sms.interval'));
    }

    private function maxAttempts(): int
    {
        return max(1, (int) config('auth.sms.max_attempts'));
    }

    private function key(string $type, string $phone, string $purpose): string
    {
        return 'auth_sms_' . $type . '_' . hash('sha256', $purpose . '|' . $phone);
    }
}
