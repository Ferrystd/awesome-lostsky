<?php
declare(strict_types=1);

namespace app\command;

use app\support\CommandResult;

use AlibabaCloud\Oss\V2\Client;
use AlibabaCloud\Oss\V2\Config;
use AlibabaCloud\Oss\V2\Credentials\StaticCredentialsProvider;
use AlibabaCloud\Oss\V2\Models\BucketACLType;
use AlibabaCloud\Oss\V2\Models\GetBucketAclRequest;
use AlibabaCloud\Oss\V2\Models\GetBucketPublicAccessBlockRequest;
use AlibabaCloud\Oss\V2\Models\PublicAccessBlockConfiguration;
use AlibabaCloud\Oss\V2\Models\PutBucketAclRequest;
use AlibabaCloud\Oss\V2\Models\PutBucketPublicAccessBlockRequest;
use RuntimeException;
use Throwable;
use think\console\Command;
use think\console\Input;
use think\console\input\Option;
use think\console\Output;

final class PublishOssFallback extends Command
{
    protected function configure()
    {
        $this->setName('oss:fallback:publish')
            ->addOption(
                'confirm-public-read',
                null,
                Option::VALUE_NONE,
                '确认关闭当前 Bucket 的阻止公共访问并设置为公共读'
            )
            ->setDescription('将当前 OSS Bucket 设置为匿名只读，以启用统一缺图重定向');
    }

    protected function execute(Input $input, Output $output)
    {
        try {
            if (!$input->getOption('confirm-public-read')) {
                throw new RuntimeException('必须提供 --confirm-public-read 才会修改 Bucket 公共访问策略');
            }

            $bucket = $this->requiredConfig('bucket', 'ALIYUN_OSS_BUCKET');
            $config = Config::loadDefault()
                ->setCredentialsProvider(new StaticCredentialsProvider(
                    $this->requiredConfig('access_key_id', 'ALIYUN_ACCESS_KEY_ID'),
                    $this->requiredConfig('access_key_secret', 'ALIYUN_ACCESS_KEY_SECRET')
                ))
                ->setRegion($this->requiredConfig('region', 'ALIYUN_OSS_REGION'));
            $client = new Client($config);

            $client->putBucketPublicAccessBlock(new PutBucketPublicAccessBlockRequest(
                $bucket,
                new PublicAccessBlockConfiguration(false)
            ));
            $client->putBucketAcl(new PutBucketAclRequest($bucket, BucketACLType::PUBLIC_READ));

            $block = $client->getBucketPublicAccessBlock(
                new GetBucketPublicAccessBlockRequest($bucket)
            )->publicAccessBlockConfiguration?->blockPublicAccess;
            $acl = $client->getBucketAcl(new GetBucketAclRequest($bucket))
                ->accessControlList?->grant;
            if ($block !== false || $acl !== BucketACLType::PUBLIC_READ) {
                throw new RuntimeException('OSS Bucket 公共读策略回读校验失败');
            }

            return CommandResult::write($output, 0, 'ok', [
                'bucket' => $bucket,
                'block_public_access' => $block,
                'acl' => $acl,
                'anonymous_write' => false,
            ]);
        } catch (Throwable $exception) {
            return CommandResult::write($output, 1, $exception->getMessage(), null);
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
