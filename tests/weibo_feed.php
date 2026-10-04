<?php
declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use app\enum\WeiboFeedClassificationStatus;
use app\model\Team;
use app\model\Entity as EntityModel;
use app\model\WeiboCommentPreset;
use app\model\WeiboFeedPost;
use app\model\WeiboFeedPollState;
use app\service\Entity;
use app\service\AbilityResolver;
use app\service\PermissionGate;
use app\service\WeiboCommentPresets;
use app\service\WeiboFeed;
use app\service\WeiboFeedPoller;
use app\service\WeiboProtocol;
use think\exception\HttpException;
use think\facade\Db;
use think\App;

(new App(dirname(__DIR__)))->initialize();

$failures = [];
$assert = static function (bool $condition, string $case) use (&$failures): void {
    if (!$condition) $failures[] = $case;
};
$classifierResponse = static function (array $items, float $score = 0.9, array $overrides = []): array {
    return $overrides + [
        'model' => (string) config('weibo_feed.classifier_model'),
        'model_sha256' => (string) config('weibo_feed.classifier_model_sha256'),
        'threshold' => (float) config('weibo_feed.intent_threshold'),
        'max_length' => (int) config('weibo_feed.classifier_max_length'),
        'preprocess' => [
            'version' => (string) config('weibo_feed.classifier_preprocess_version'),
            'fingerprint' => (string) config('weibo_feed.classifier_preprocess_fingerprint'),
        ],
        'predictions' => array_map(static fn (array $item): array => ['id' => $item['id'], 'score' => $score], $items),
    ];
};

$parser = new WeiboFeedPoller(static fn (): array => []);
$parsed = $parser->extractSearchStatuses(['statuses' => [
    ['idstr' => 'long-missing', 'isLongText' => true, 'text' => '截断内容', 'created_at' => 'Tue Sep 22 02:04:34 +0800 2026'],
    ['idstr' => 'long-complete', 'isLongText' => true, 'text' => '截断', 'longText' => ['longTextContent' => '<b>完整求单正文</b>'], 'user' => ['screen_name' => 'A'], 'created_at' => 'Tue Sep 22 02:04:34 +0800 2026'],
    ['idstr' => 'repost', 'text_raw' => '转发人的外层文字', 'retweeted_status' => ['text_raw' => '原文求陪玩'], 'created_at' => 'Tue Sep 22 02:04:34 +0800 2026'],
]]);
$assert(count($parsed) === 2, 'long posts without complete text are skipped');
$assert(($parsed[0]['text'] ?? '') === '完整求单正文', 'embedded complete long text is preferred');
$assert(($parsed[1]['text'] ?? '') === '转发人的外层文字', 'repost classification uses only outer author text');

// Numeric scores remain valid without casts; validation must still reject strings and nonfinite values.
$classifyBatch = new ReflectionMethod(WeiboFeedPoller::class, 'classifyBatch');
foreach ([0, 1, 0.9] as $score) {
    $numericClassifier = new WeiboFeedPoller(null, static fn(array $items): array => $classifierResponse($items, 0.9, ['predictions' => [['id' => 'fixture-id', 'score' => $score]]]));
    $result = $classifyBatch->invoke($numericClassifier, [['id' => 'fixture-id', 'text' => 'fixture']]);
    $assert($result['fixture-id'] == $score, 'classifier accepts validated integer and floating scores');
}
foreach (['0.9', NAN, INF, -1, 2] as $score) {
    $invalidClassifier = new WeiboFeedPoller(null, static fn(array $items): array => $classifierResponse($items, 0.9, ['predictions' => [['id' => 'fixture-id', 'score' => $score]]]));
    try { $classifyBatch->invoke($invalidClassifier, [['id' => 'fixture-id', 'text' => 'fixture']]); $failures[] = 'classifier accepted invalid numeric score'; }
    catch (RuntimeException $exception) { $assert($exception->getMessage() === '本地分类服务分数超出 0..1', 'classifier rejects invalid numeric scores at its boundary'); }
}

$reflection = new ReflectionMethod(WeiboFeed::class, 'preview');
$preview = $reflection->invoke(new WeiboFeed, '联系 @seller 看 https://weibo.com/secret 找我点单');
$assert(!str_contains($preview, 'http') && !str_contains($preview, '@seller') && mb_strlen($preview) < 15, 'restricted preview removes reconstructable links and mentions');
$short = $reflection->invoke(new WeiboFeed, '求单');
$assert($short !== '求单', 'short restricted text is never returned in full');

$db = app()->db;
$db->startTrans();
try {
    $team = Team::find((int) Team::min('id'));
    if (!$team) throw new RuntimeException('weibo feed test requires one local Team fixture');
    $teamId = (int) $team->id;
    $entityId = app(Entity::class)->idBySubject('team', $teamId);
    $presets = app(WeiboCommentPresets::class);
    $first = $presets->replacePersonal($teamId, $entityId, ['第一条', '第二条']);
    $second = $presets->replacePersonal($teamId, $entityId, ['替换后']);
    $assert(count(array_filter($first, static fn (array $item): bool => $item['scope'] === 'personal')) === 2, 'personal presets initially replace as a list');
    $personal = array_values(array_filter($second, static fn (array $item): bool => $item['scope'] === 'personal'));
    $assert(count($personal) === 1 && $personal[0]['content'] === '替换后', 'personal presets can be replaced repeatedly without soft-delete unique collisions');
    $presets->replacePersonal($teamId, $entityId, []);
    $assert(!WeiboCommentPreset::where('team_id', $teamId)->where('entity_id', $entityId)->find(), 'empty replacement removes the active personal list');

    $suffix = bin2hex(random_bytes(6));
    $numericBase = (string) random_int(1000000000000000, 8999999999999999);
    $accepted = new WeiboFeedPost;
    $accepted->save([
        'status_id' => $numericBase . '1',
        'text' => '本人想找付费陪玩',
        'author_name' => '测试用户',
        'posted_at' => time(),
        'classification_status' => WeiboFeedClassificationStatus::Pending,
        'classification_attempts' => 0,
    ]);
    $result = (new WeiboFeedPoller(null, static fn (array $items): array => $classifierResponse($items, 0.9)))->classifyPending();
    $accepted->refresh();
    $assert($result['succeeded'] >= 1 && $accepted->enumCase('classification_status') === WeiboFeedClassificationStatus::Accepted, 'valid noul above threshold accepts a pending post');
    $assert((string) $accepted->classifier_model === config('weibo_feed.classifier_model') && abs((float) $accepted->intent_score - 0.9) < 0.00001, 'classification stores locked local model and score');

    $identityMismatch = new WeiboFeedPost;
    $identityMismatch->save([
        'status_id' => $numericBase . '0',
        'text' => '身份不匹配不能落为分类结果',
        'author_name' => '',
        'posted_at' => time(),
        'classification_status' => WeiboFeedClassificationStatus::Pending,
        'classification_attempts' => 0,
        'classifier_model' => 'stale-model',
        'intent_score' => 0.99,
        'classified_at' => time() - 60,
    ]);
    (new WeiboFeedPoller(null, static fn (array $items): array => $classifierResponse($items, 0.9, ['model_sha256' => str_repeat('0', 64)])))->classifyPending();
    $identityMismatch->refresh();
    $assert($identityMismatch->enumCase('classification_status') === WeiboFeedClassificationStatus::Failed, 'model identity mismatch remains retryable instead of accepting a score');
    $assert(str_contains((string) $identityMismatch->classification_error, '模型身份不匹配'), 'model identity mismatch is recorded');
    $assert($identityMismatch->classifier_model === null && $identityMismatch->intent_score === null && $identityMismatch->classified_at === null, 'batch validation failure clears stale success fields');

    $otherEntityId = (int) EntityModel::where('id', '<>', $entityId)->value('id');
    if ($otherEntityId > 0) {
        $accountId = (int) Db::name('weibo_account')->insertGetId([
            'phone' => 'feed-' . $suffix,
            'uid' => 'feed-' . $suffix,
            'gsid' => 'test', 'from_value' => 'test', 'screen_name' => '他人账号',
            'health' => 1, 'create_time' => time(), 'update_time' => time(),
        ]);
        Db::name('weibo_account_binding')->insert([
            'team_id' => $teamId, 'entity_id' => $otherEntityId, 'account_id' => $accountId,
            'create_time' => time(), 'update_time' => time(),
        ]);
        $remoteCalls = 0;
        app()->instance(WeiboProtocol::class, new class($remoteCalls) extends WeiboProtocol {
            public function __construct(private int &$calls) {}
            public function comment(\app\model\WeiboAccount $account, string $statusId, string $comment): array
            {
                $this->calls++;
                throw new RuntimeException('remote call must not happen');
            }
        });
        try {
            (new WeiboFeed)->comment($teamId, $entityId, (int) $accepted->id, $accountId, '测试评论');
            $failures[] = 'another entity account must be rejected';
        } catch (HttpException $exception) {
            $assert($exception->getStatusCode() === 404 && $remoteCalls === 0, 'another entity account is rejected before any remote write call');
        }
    } else {
        $failures[] = 'account ownership test requires another entity fixture';
    }

    $older = new WeiboFeedPost;
    $older->save([
        'status_id' => $numericBase . '2',
        'text' => '较早的完整正文', 'author_name' => '作者乙', 'posted_at' => time() - 10,
        'classification_status' => WeiboFeedClassificationStatus::Accepted,
        'classification_attempts' => 1, 'classifier_model' => 'jev-test', 'intent_score' => 0.95,
    ]);
    app()->instance(PermissionGate::class, new class extends PermissionGate {
        public bool $allowed = false;
        public function allows(int $teamId, int|array $subject, array $permissionKeys): bool { return $this->allowed; }
    });
    app()->instance(AbilityResolver::class, new class extends AbilityResolver {
        public bool $enabled = false;
        public function available(int $teamId, string $key, int $minimumLevel = 1): bool { return $this->enabled; }
    });
    /** @var PermissionGate $gate */
    $gate = app(PermissionGate::class);
    /** @var AbilityResolver $ability */
    $ability = app(AbilityResolver::class);
    $restricted = (new WeiboFeed)->list($teamId, ['type' => 'team', 'id' => $teamId], 1, 50);
    $assert($restricted['restricted'] === true && count($restricted['list']) >= 2, 'missing permission or ability returns a restricted feed');
    foreach ($restricted['list'] as $item) {
        $assert(
            !array_key_exists('author_name', $item)
                && !array_key_exists('status_url', $item)
                && !array_key_exists('app_url', $item)
                && !array_key_exists('status_id', $item)
                && !array_key_exists('mid', $item),
            'restricted feed omits author and all reconstructable remote identifiers'
        );
        $assert(!str_contains((string) $item['text'], '完整正文'), 'restricted feed never includes full post text');
    }
    $ability->enabled = true;
    $permissionRestricted = (new WeiboFeed)->list($teamId, ['type' => 'team', 'id' => $teamId], 1, 50);
    $assert($permissionRestricted['restricted'] === true, 'ability alone cannot unlock full feed posts');
    $gate->allowed = true;
    $full = (new WeiboFeed)->list($teamId, ['type' => 'team', 'id' => $teamId], 1, 50);
    $ourFull = array_values(array_filter($full['list'], static fn (array $item): bool => in_array($item['id'], [(int) $accepted->id, (int) $older->id], true)));
    $assert(count($ourFull) === 2 && $ourFull[0]['posted_at'] >= $ourFull[1]['posted_at'], 'full feed is ordered by remote post time newest first');
    $assert(isset($ourFull[0]['author_name'], $ourFull[0]['status_url'], $ourFull[0]['app_url']) && $ourFull[0]['restricted'] === false, 'permission plus ability exposes the complete feed DTO');

    $single = (new WeiboFeed)->get($teamId, ['type' => 'team', 'id' => $teamId], (int) $accepted->id);
    $matchingListItem = array_values(array_filter($ourFull, static fn (array $item): bool => $item['id'] === (int) $accepted->id));
    $assert($matchingListItem !== [] && $single === $matchingListItem[0], 'single feed endpoint returns the existing complete feed item DTO');

    $gate->allowed = false;
    try {
        (new WeiboFeed)->get($teamId, ['type' => 'team', 'id' => $teamId], (int) $accepted->id);
        $failures[] = 'single feed item requires personal permission';
    } catch (HttpException $exception) {
        $assert($exception->getStatusCode() === 403, 'single feed item denies missing personal permission');
    }
    $gate->allowed = true;
    $ability->enabled = false;
    try {
        (new WeiboFeed)->get($teamId, ['type' => 'team', 'id' => $teamId], (int) $accepted->id);
        $failures[] = 'single feed item requires weibo ability';
    } catch (HttpException $exception) {
        $assert($exception->getStatusCode() === 403, 'single feed item denies missing weibo ability');
    }
    $abilityRestricted = (new WeiboFeed)->list($teamId, ['type' => 'team', 'id' => $teamId], 1, 50);
    $assert($abilityRestricted['restricted'] === true, 'permission alone cannot unlock full feed posts');

    $ability->enabled = true;
    $expired = new WeiboFeedPost;
    $expired->save([
        'status_id' => $numericBase . '7', 'text' => '已过期正文', 'author_name' => '过期作者',
        'posted_at' => time() - (int) config('weibo_feed.retention_seconds') - 1,
        'classification_status' => WeiboFeedClassificationStatus::Accepted,
        'classification_attempts' => 1, 'classifier_model' => 'jev-test', 'intent_score' => 0.95,
    ]);
    $rejected = new WeiboFeedPost;
    $rejected->save([
        'status_id' => $numericBase . '8', 'text' => '未通过判定正文', 'author_name' => '未通过作者',
        'posted_at' => time(), 'classification_status' => WeiboFeedClassificationStatus::Rejected,
        'classification_attempts' => 1, 'classifier_model' => 'jev-test', 'intent_score' => 0.05,
    ]);
    foreach ([(int) $expired->id, (int) $rejected->id, PHP_INT_MAX] as $missingPostId) {
        try {
            (new WeiboFeed)->get($teamId, ['type' => 'team', 'id' => $teamId], $missingPostId);
            $failures[] = 'expired, rejected, or missing single feed item must return 404';
        } catch (HttpException $exception) {
            $assert($exception->getStatusCode() === 404, 'expired, rejected, or missing single feed item returns 404');
        }
    }

    $failed = new WeiboFeedPost;
    $failed->save([
        'status_id' => $numericBase . '3',
        'text' => '分类服务失败仍应重试',
        'author_name' => '',
        'posted_at' => time(),
        'classification_status' => WeiboFeedClassificationStatus::Pending,
        'classification_attempts' => 0,
        'classifier_model' => 'stale-model',
        'intent_score' => 0.99,
        'classified_at' => time() - 60,
    ]);
    $failureResult = (new WeiboFeedPoller(null, static function (array $items): array { throw new RuntimeException('temporary'); }))->classifyPending();
    $failed->refresh();
    $assert($failureResult['succeeded'] === 0 && $failed->enumCase('classification_status') === WeiboFeedClassificationStatus::Failed, 'classification failure is retryable and is not a negative label');
    $assert((int) $failed->classification_attempts === 1, 'classification failure increments the bounded retry count once');
    $assert($failed->classifier_model === null && $failed->intent_score === null && $failed->classified_at === null, 'classification failure clears stale success fields');

    $missingKey = new WeiboFeedPost;
    $missingKey->save([
        'status_id' => $numericBase . '4', 'text' => '等待配置', 'author_name' => '', 'posted_at' => time(),
        'classification_status' => WeiboFeedClassificationStatus::Pending, 'classification_attempts' => 0,
    ]);
    $classifierUrl = config('weibo_feed.classifier_url');
    config(['classifier_url' => ''], 'weibo_feed');
    try {
        (new WeiboFeedPoller)->classifyPending();
        $failures[] = 'missing local classifier URL must stop the batch';
    } catch (RuntimeException) {
        $missingKey->refresh();
        $assert((int) $missingKey->classification_attempts === 0, 'missing local classifier URL does not consume per-post retries');
    }
    $unconfigured = (new WeiboFeed)->list($teamId, ['type' => 'team', 'id' => $teamId], 1, 1);
    $assert($unconfigured['poll_status'] === 'unconfigured', 'feed reports unconfigured when local classifier URL is empty');
    config(['classifier_url' => $classifierUrl], 'weibo_feed');
    $maxedWasClassified = false;
    $missingKey->save([
        'classification_status' => WeiboFeedClassificationStatus::Failed,
        'classification_attempts' => (int) config('weibo_feed.classification_retries'),
    ]);
    (new WeiboFeedPoller(null, static function (array $items) use (&$maxedWasClassified, $classifierResponse): array {
        foreach ($items as $item) {
            if ($item['text'] === '等待配置') $maxedWasClassified = true;
        }
        return $classifierResponse($items, 1.0);
    }))->classifyPending();
    $assert(!$maxedWasClassified, 'failed posts stop retrying at the configured maximum');

    $old = new WeiboFeedPost;
    $old->save([
        'status_id' => $numericBase . '5',
        'text' => '过期缓冲', 'author_name' => '',
        'posted_at' => time() - 90000,
        'classification_status' => WeiboFeedClassificationStatus::Rejected,
        'classification_attempts' => 1,
    ]);
    $freshStatus = $numericBase . '6';
    $poll = new WeiboFeedPoller(
        static fn (): array => [[
            'status_id' => $freshStatus,
            'text' => '新帖子',
            'author_name' => '新作者',
            'created_at' => date('D M d H:i:s O Y'),
        ], [
            'status_id' => $freshStatus,
            'text' => '重复帖子',
            'author_name' => '新作者',
            'created_at' => date('D M d H:i:s O Y'),
        ]],
        static fn (array $items): array => $classifierResponse($items, 0.9)
    );
    $pollResult = $poll->run();
    $assert($pollResult['added'] === 1, 'polling persists one row for duplicate remote ids');
    $assert((bool) WeiboFeedPost::withTrashed()->where('id', $old->id)->find(), 'expired feed rows remain stored outside the display window');
    $accepted->refresh();
    $assert((int) $accepted->classification_attempts === 1, 'previously classified rows are not automatically reclassified');
    $assert((int) WeiboFeedPost::where('status_id', $freshStatus)->count() === 1, 'remote status id uniqueness is durable');
    $state = WeiboFeedPollState::where('id', 1)->find();
    $assert($state && (int) $state->last_success_at > 0, 'successful poll persists the upstream success timestamp');
} catch (Throwable $exception) {
    $failures[] = 'integration setup: ' . $exception->getMessage() . ' at ' . $exception->getFile() . ':' . $exception->getLine() . PHP_EOL . $exception->getTraceAsString();
} finally {
    $db->rollback();
}

$route = file_get_contents(dirname(__DIR__) . '/app/weibo/route/app.php');
$personal = file_get_contents(dirname(__DIR__) . '/app/weibo/controller/Personal.php');
$assert(str_contains($route, "Route::get('personal/feed'") && str_contains($route, "Route::get('personal/feed/<id>'") && str_contains($route, "Route::post('personal/feed/<id>/comments'"), 'personal feed routes are registered');
$assert(str_contains($personal, "['except' => ['feed']]") && str_contains($personal, "'feedItem'") && str_contains($personal, "'feedComment'"), 'only feed preview bypasses permission while detail and comments retain ability middleware');

if ($failures) {
    fwrite(STDERR, implode(PHP_EOL, $failures) . PHP_EOL);
    exit(1);
}
fwrite(STDOUT, "Weibo feed tests passed\n");
