<?php
declare(strict_types=1);

namespace app\command;

use OSS\OssClient;
use RuntimeException;
use Throwable;
use think\console\Command;
use think\console\Input;
use think\console\Output;

final class DeployOssFallback extends Command
{
    private const OBJECT_KEY = 'system/image-not-found.png';
    private const SHA256 = 'c7867513080c061235f9be90bab875c19883a0fe268b8fa7e937ed3c6d325f31';

    protected function configure()
    {
        $this->setName('oss:fallback:deploy')
            ->setDescription('原样部署受保护的 OSS 缺图占位图并校验远程字节');
    }

    protected function execute(Input $input, Output $output)
    {
        try {
            $asset = dirname(__DIR__, 2) . '/deploy/oss/' . self::OBJECT_KEY;
            if (!is_file($asset) || hash_file('sha256', $asset) !== self::SHA256) {
                throw new RuntimeException('缺图占位图不存在或 SHA-256 与锁定原图不一致');
            }

            $bucket = $this->requiredConfig('bucket', 'ALIYUN_OSS_BUCKET');
            $region = $this->requiredConfig('region', 'ALIYUN_OSS_REGION');
            $client = new OssClient(
                $this->requiredConfig('access_key_id', 'ALIYUN_ACCESS_KEY_ID'),
                $this->requiredConfig('access_key_secret', 'ALIYUN_ACCESS_KEY_SECRET'),
                "oss-{$region}.aliyuncs.com"
            );
            $client->uploadFile($bucket, self::OBJECT_KEY, $asset, [
                OssClient::OSS_CONTENT_TYPE => 'image/png',
                OssClient::OSS_CACHE_CONTROL => 'public, max-age=31536000, immutable',
            ]);
            $remote = $client->getObject($bucket, self::OBJECT_KEY);
            if (hash('sha256', $remote) !== self::SHA256) {
                throw new RuntimeException('OSS 远程对象校验失败');
            }

            $domain = rtrim((string) config('aliyun.oss_domain'), '/');
            if (str_starts_with($domain, '//')) {
                $domain = 'https:' . $domain;
            } elseif ($domain !== '' && !str_contains($domain, '://')) {
                $domain = 'https://' . $domain;
            }
            $url = ($domain !== '' ? $domain : "https://{$bucket}.oss-{$region}.aliyuncs.com")
                . '/' . self::OBJECT_KEY;
            $output->writeln((string) json_encode([
                'code' => 0,
                'message' => 'ok',
                'data' => [
                    'object_key' => self::OBJECT_KEY,
                    'sha256' => self::SHA256,
                    'url' => $url,
                ],
            ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT));

            return 0;
        } catch (Throwable $exception) {
            $output->writeln((string) json_encode([
                'code' => 1,
                'message' => $exception->getMessage(),
                'data' => null,
            ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT));

            return 1;
        }
    }

    private function requiredConfig(string $key, string $environmentName): string
    {
        $value = trim((string) config("aliyun.{$key}"));
        if ($value === '') {
            throw new RuntimeException("{$environmentName} 未配置");
        }

        return $value;
    }
}
