<?php
declare(strict_types=1);

namespace app\command;

use AlibabaCloud\Oss\V2\Client;
use AlibabaCloud\Oss\V2\Config;
use AlibabaCloud\Oss\V2\Credentials\StaticCredentialsProvider;
use AlibabaCloud\Oss\V2\Models\GetBucketWebsiteRequest;
use AlibabaCloud\Oss\V2\Models\PutBucketWebsiteRequest;
use AlibabaCloud\Oss\V2\Models\RoutingRule;
use AlibabaCloud\Oss\V2\Models\RoutingRuleCondition;
use AlibabaCloud\Oss\V2\Models\RoutingRuleRedirect;
use AlibabaCloud\Oss\V2\Models\RoutingRules;
use AlibabaCloud\Oss\V2\Models\WebsiteConfiguration;
use RuntimeException;
use Throwable;
use think\console\Command;
use think\console\Input;
use think\console\input\Option;
use think\console\Output;

final class ConfigureOssFallback extends Command
{
    private const OBJECT_KEY = 'system/image-not-found.png';
    private const IMAGE_SUFFIXES = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'];

    protected function configure()
    {
        $this->setName('oss:fallback:configure')
            ->addOption('dry-run', null, Option::VALUE_NONE, '只读取并计算规则，不更新 Bucket')
            ->setDescription('保留现有 OSS 网站配置，为图片后缀配置 404 到统一缺图的 302 重定向');
    }

    protected function execute(Input $input, Output $output)
    {
        try {
            $bucket = $this->requiredConfig('bucket', 'ALIYUN_OSS_BUCKET');
            $region = $this->requiredConfig('region', 'ALIYUN_OSS_REGION');
            $host = $this->normalizeDomain($this->requiredConfig('oss_domain', 'ALIYUN_OSS_DOMAIN'));
            $config = Config::loadDefault()
                ->setCredentialsProvider(new StaticCredentialsProvider(
                    $this->requiredConfig('access_key_id', 'ALIYUN_ACCESS_KEY_ID'),
                    $this->requiredConfig('access_key_secret', 'ALIYUN_ACCESS_KEY_SECRET')
                ))
                ->setRegion($region);
            $client = new Client($config);
            $website = $this->currentWebsite($client, $bucket);
            $existing = $website->routingRules?->routingRules ?? [];
            $preserved = array_values(array_filter($existing, fn (RoutingRule $rule): bool => !$this->isManaged($rule, $host)));
            if (count($preserved) + count(self::IMAGE_SUFFIXES) > 20) {
                throw new RuntimeException('现有规则过多，无法在 OSS 每 Bucket 20 条上限内安全增加全部缺图规则');
            }

            usort($preserved, static fn (RoutingRule $left, RoutingRule $right): int =>
                ((int) $left->ruleNumber) <=> ((int) $right->ruleNumber));
            $rules = [];
            foreach (self::IMAGE_SUFFIXES as $index => $suffix) {
                $rules[] = $this->fallbackRule($index + 1, $suffix, $host);
            }
            foreach ($preserved as $index => $rule) {
                $rule->ruleNumber = count(self::IMAGE_SUFFIXES) + $index + 1;
                $rules[] = $rule;
            }
            $website->routingRules = new RoutingRules($rules);

            if (!$input->getOption('dry-run')) {
                $client->putBucketWebsite(new PutBucketWebsiteRequest($bucket, $website));
                $this->verify($client, $bucket, $host);
            }

            $output->writeln((string) json_encode([
                'code' => 0,
                'message' => $input->getOption('dry-run') ? 'dry-run' : 'ok',
                'data' => [
                    'bucket' => $bucket,
                    'domain' => $host,
                    'fallback' => 'https://' . $host . '/' . self::OBJECT_KEY,
                    'image_suffixes' => self::IMAGE_SUFFIXES,
                    'preserved_rules' => count($preserved),
                    'total_rules' => count($rules),
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

    private function currentWebsite(Client $client, string $bucket): WebsiteConfiguration
    {
        try {
            return $client->getBucketWebsite(new GetBucketWebsiteRequest($bucket))->websiteConfiguration
                ?? new WebsiteConfiguration();
        } catch (Throwable $exception) {
            $previous = $exception->getPrevious();
            if ($previous instanceof \AlibabaCloud\Oss\V2\Exception\ServiceException
                && $previous->getStatusCode() === 404) {
                return new WebsiteConfiguration();
            }
            throw $exception;
        }
    }

    private function fallbackRule(int $number, string $suffix, string $host): RoutingRule
    {
        return new RoutingRule(
            redirect: new RoutingRuleRedirect(
                redirectType: 'External',
                protocol: 'https',
                hostName: $host,
                passQueryString: false,
                enableReplacePrefix: false,
                replaceKeyWith: self::OBJECT_KEY,
                httpRedirectCode: 302
            ),
            ruleNumber: $number,
            condition: new RoutingRuleCondition(
                keySuffixEquals: $suffix,
                httpErrorCodeReturnedEquals: 404
            )
        );
    }

    private function isManaged(RoutingRule $rule, string $host): bool
    {
        return $rule->redirect?->redirectType === 'External'
            && $rule->redirect?->hostName === $host
            && $rule->redirect?->replaceKeyWith === self::OBJECT_KEY
            && in_array($rule->condition?->keySuffixEquals, self::IMAGE_SUFFIXES, true);
    }

    private function verify(Client $client, string $bucket, string $host): void
    {
        $configured = $client->getBucketWebsite(new GetBucketWebsiteRequest($bucket))
            ->websiteConfiguration?->routingRules?->routingRules ?? [];
        foreach (self::IMAGE_SUFFIXES as $suffix) {
            $found = false;
            foreach ($configured as $rule) {
                if ($this->isManaged($rule, $host) && $rule->condition?->keySuffixEquals === $suffix
                    && $rule->condition?->httpErrorCodeReturnedEquals === 404
                    && $rule->redirect?->httpRedirectCode === 302) {
                    $found = true;
                    break;
                }
            }
            if (!$found) {
                throw new RuntimeException("OSS 缺图规则回读校验失败: {$suffix}");
            }
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

    private function normalizeDomain(string $value): string
    {
        $url = str_starts_with($value, '//') ? "https:{$value}" : (str_contains($value, '://') ? $value : "https://{$value}");
        $parts = parse_url($url);
        $host = is_array($parts) ? strtolower((string) ($parts['host'] ?? '')) : '';
        if ($host === '' || filter_var($host, FILTER_VALIDATE_DOMAIN, FILTER_FLAG_HOSTNAME) === false) {
            throw new RuntimeException('ALIYUN_OSS_DOMAIN 必须是有效域名');
        }
        return $host;
    }
}
