<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use think\console\Input;
use think\console\Output;
use think\exception\HttpException;

// SDK doubles must be installed before command execution: no network or database is used.
final class CommandResultOss
{
    public const OSS_CONTENT_TYPE = 'Content-Type';
    public const OSS_CACHE_CONTROL = 'Cache-Control';
    public static bool $fail = false;
    public static mixed $website = null;
    public function __construct(...$arguments) {}
    public function __call(string $method, array $arguments): mixed
    {
        if (self::$fail) throw new RuntimeException('模拟失败/测试');
        return match ($method) {
            'getBucketWebsite' => (object) ['websiteConfiguration' => self::$website],
            'putBucketWebsite' => self::$website = $arguments[0]->websiteConfiguration,
            'getBucketPublicAccessBlock' => (object) ['publicAccessBlockConfiguration' => (object) ['blockPublicAccess' => false]],
            'getBucketAcl' => (object) ['accessControlList' => (object) ['grant' => 'public-read']],
            'getObject' => file_get_contents(dirname(__DIR__) . '/deploy/oss/system/image-not-found.png'),
            'uploadFile', 'putBucketPublicAccessBlock', 'putBucketAcl' => null,
            default => throw new LogicException('Unexpected SDK call: ' . $method),
        };
    }
}
class_alias(CommandResultOss::class, 'OSS\\OssClient');
class_alias(CommandResultOss::class, 'AlibabaCloud\\Oss\\V2\\Client');

final class CommandResultService
{
    public ?Throwable $error = null;
    public function __call(string $method, array $arguments): array
    {
        if (!in_array($method, ['send', 'uploadByCommand'], true)) throw new LogicException($method);
        if ($this->error) throw $this->error;
        return ['标题' => '测试/路径', 'items' => []];
    }
}
$app = new think\App(dirname(__DIR__));
$app->initialize();
$app->config->set([
    'bucket' => 'test-bucket', 'region' => 'cn-test', 'oss_domain' => 'https://oss.example.com',
    'access_key_id' => 'test-only', 'access_key_secret' => 'test-only',
], 'aliyun');
$service = new CommandResultService;
$app->instance(app\service\Notice::class, $service);
$app->instance(app\service\File::class, $service);

$assert = static function (bool $condition, string $case): void {
    if (!$condition) throw new RuntimeException($case);
};
$run = static function (string $class, array $arguments, int $code, string $message, mixed $data) use ($app, $assert): void {
    $command = new $class;
    $command->setApp($app);
    $output = new Output('buffer');
    $exit = $command->run(new Input($arguments), $output);
    $expected = (string) json_encode(compact('code', 'message', 'data'),
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) . "\n";
    $actual = $output->fetch();
    $assert($exit === $code && $actual === $expected, $class . ': exit or exact output mismatch: ' . $actual);
};

foreach ([
    [app\command\SendNotice::class, ['测试', '--team_id=1']],
    [app\command\UploadFile::class, ['unused.png']],
] as [$class, $arguments]) {
    $service->error = null;
    $run($class, $arguments, 0, 'ok', ['标题' => '测试/路径', 'items' => []]);
    foreach ([new RuntimeException('模拟失败/测试'), new HttpException(422, '输入无效/测试')] as $error) {
        $service->error = $error;
        $run($class, $arguments, 1, $error->getMessage(), ['http_code' => $error instanceof HttpException ? 422 : 500]);
    }
}

CommandResultOss::$fail = false;
$run(app\command\DeployOssFallback::class, [], 0, 'ok', [
    'object_key' => 'system/image-not-found.png',
    'sha256' => 'c7867513080c061235f9be90bab875c19883a0fe268b8fa7e937ed3c6d325f31',
    'url' => 'https://oss.example.com/system/image-not-found.png',
]);
$run(app\command\PublishOssFallback::class, ['--confirm-public-read'], 0, 'ok', [
    'bucket' => 'test-bucket', 'block_public_access' => false, 'acl' => 'public-read', 'anonymous_write' => false,
]);
$fallback = [
    'bucket' => 'test-bucket', 'domain' => 'oss.example.com',
    'fallback' => 'https://oss.example.com/system/image-not-found.png',
    'image_suffixes' => ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'],
    'preserved_rules' => 0, 'total_rules' => 6,
];
$run(app\command\ConfigureOssFallback::class, ['--dry-run'], 0, 'dry-run', $fallback);
$run(app\command\ConfigureOssFallback::class, [], 0, 'ok', $fallback);
$run(app\command\PublishOssFallback::class, [], 1, '必须提供 --confirm-public-read 才会修改 Bucket 公共访问策略', null);
CommandResultOss::$fail = true;
foreach ([
    [app\command\DeployOssFallback::class, []],
    [app\command\PublishOssFallback::class, ['--confirm-public-read']],
    [app\command\ConfigureOssFallback::class, []],
] as [$class, $arguments]) $run($class, $arguments, 1, '模拟失败/测试', null);

echo "command_result: passed (14 isolated command output cases)\n";
