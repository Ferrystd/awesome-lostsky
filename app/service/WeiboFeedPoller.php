<?php
declare(strict_types=1);

namespace app\service;

use app\enum\WeiboFeedClassificationStatus;
use app\model\WeiboFeedPollState;
use app\model\WeiboFeedPost;
use DateTimeImmutable;
use think\facade\Db;

final class WeiboFeedPoller
{
    private $search;
    private $classifier;

    public function __construct(?callable $search = null, ?callable $classifier = null)
    {
        $this->search = $search;
        $this->classifier = $classifier;
    }

    public function run(): array
    {
        $locked = in_array(Db::query("SELECT GET_LOCK('lostsky_weibo_feed_poll', 0) AS acquired")[0]['acquired'] ?? null, [1, '1'], true);
        if (!$locked) return ['locked' => true, 'added' => 0, 'classified' => 0, 'deleted' => 0];
        try {
            $now = time();
            $this->state(['last_attempt_at' => $now]);
            $added = 0;
            $searchErrors = [];
            $successes = 0;
            foreach ($this->arrayConfig('keywords') as $keyword) {
                if (!is_string($keyword)) throw new \RuntimeException('微博信息流关键词必须为字符串');
                try {
                    foreach ($this->search($keyword) as $item) {
                        if (!is_array($item)) continue;
                        try {
                            $postedAt = $this->postedAt($this->optionalString($item['created_at'] ?? null));
                        } catch (\Throwable) {
                            continue;
                        }
                        if ($postedAt < $now - $this->integerConfig('retention_seconds') || $postedAt > $now + 300) continue;
                        $statusId = trim($this->optionalString($item['status_id'] ?? null));
                        $text = trim($this->optionalString($item['text'] ?? null));
                        if (!ctype_digit($statusId) || strlen($statusId) > 32 || $text === '' || WeiboFeedPost::where('status_id', $statusId)->find()) continue;
                        try {
                            (new WeiboFeedPost)->save([
                                'status_id' => mb_substr($statusId, 0, 32),
                                'text' => $text,
                                'author_name' => mb_substr(trim($this->optionalString($item['author_name'] ?? null)), 0, 100),
                                'posted_at' => $postedAt,
                                'classification_status' => WeiboFeedClassificationStatus::Pending,
                                'classification_attempts' => 0,
                            ]);
                            $added++;
                        } catch (\Throwable $exception) {
                            if (!WeiboFeedPost::where('status_id', $statusId)->find()) throw $exception;
                        }
                    }
                    $successes++;
                } catch (\Throwable $exception) {
                    $searchErrors[] = mb_substr($exception->getMessage(), 0, 200);
                }
            }
            if ($successes === 0) throw new \RuntimeException($searchErrors[0] ?? '微博搜索全部失败');
            $classification = $this->classifyPending();
            if ($classification['attempted'] > 0 && $classification['succeeded'] === 0) {
                throw new \RuntimeException('本地分类全部失败');
            }
            $unresolved = WeiboFeedPost::where('classification_status', WeiboFeedClassificationStatus::Failed->value)
                ->where('posted_at', '>=', $now - $this->integerConfig('retention_seconds'))->count();
            $problems = $searchErrors;
            if ($unresolved > 0) $problems[] = "{$unresolved} 条帖子分类失败";
            $this->state([
                'last_success_at' => time(),
                'last_error' => $problems ? implode('; ', $problems) : null,
            ]);
            return ['locked' => false, 'added' => $added, 'classified' => $classification['succeeded'], 'deleted' => 0, 'search_errors' => count($searchErrors)];
        } catch (\Throwable $exception) {
            $this->state(['last_error' => mb_substr($exception->getMessage(), 0, 500)]);
            throw $exception;
        } finally {
            Db::query("SELECT RELEASE_LOCK('lostsky_weibo_feed_poll')");
        }
    }

    public function classifyPending(): array
    {
        if (!$this->classifier && trim($this->stringConfig('classifier_url')) === '') {
            throw new \RuntimeException('WEIBO_FEED_CLASSIFIER_URL 未配置');
        }
        $maximum = $this->integerConfig('classification_retries');
        $posts = WeiboFeedPost::whereIn('classification_status', [
            WeiboFeedClassificationStatus::Pending->value,
            WeiboFeedClassificationStatus::Failed->value,
        ])
            ->where('classification_attempts', '<', $maximum)
            ->order('posted_at', 'desc')->limit($this->integerConfig('batch_limit'))->select();
        $attempted = count($posts);
        $succeeded = 0;
        foreach (array_chunk($posts->all(), $this->integerConfig('classifier_batch_size')) as $batch) {
            try {
                $items = [];
                foreach ($batch as $post) {
                    $items[] = [
                        'id' => (string) $post->id,
                        'text' => $this->requiredString($post->text, '微博信息流正文必须为字符串'),
                    ];
                }
                $results = $this->classifyBatch($items);
            } catch (\Throwable $exception) {
                foreach ($batch as $post) {
                    if (!is_int($post->classification_attempts)) throw new \RuntimeException('微博信息流分类次数必须为整数');
                    $attempts = $post->classification_attempts + 1;
                    $post->save([
                        'classification_status' => WeiboFeedClassificationStatus::Failed,
                        'classification_attempts' => $attempts,
                        'classifier_model' => null,
                        'intent_score' => null,
                        'classification_error' => mb_substr($exception->getMessage(), 0, 500),
                        'classified_at' => null,
                    ]);
                }
                continue;
            }
            foreach ($batch as $post) {
                if (!is_int($post->classification_attempts)) throw new \RuntimeException('微博信息流分类次数必须为整数');
                $score = $results[(string) $post->id];
                $attempts = $post->classification_attempts + 1;
                try {
                    $post->save([
                        'classification_status' => $score >= $this->floatConfig('intent_threshold')
                            ? WeiboFeedClassificationStatus::Accepted
                            : WeiboFeedClassificationStatus::Rejected,
                        'classification_attempts' => $attempts,
                        'classifier_model' => mb_substr($this->stringConfig('classifier_model'), 0, 100),
                        'intent_score' => $score,
                        'classification_error' => null,
                        'classified_at' => time(),
                    ]);
                    $succeeded++;
                } catch (\Throwable $exception) {
                    $post->save([
                        'classification_status' => WeiboFeedClassificationStatus::Failed,
                        'classification_attempts' => $attempts,
                        'classifier_model' => null,
                        'intent_score' => null,
                        'classification_error' => mb_substr($exception->getMessage(), 0, 500),
                        'classified_at' => null,
                    ]);
                }
            }
        }
        return ['attempted' => $attempted, 'succeeded' => $succeeded];
    }

    private function search(string $keyword): array
    {
        if ($this->search) return ($this->search)($keyword);
        $cookies = $this->visitorCookies();
        $found = [];
        $limit = $this->integerConfig('batch_limit');
        $pageSize = min(20, $limit);
        for ($page = 1; $page <= $this->integerConfig('max_pages') && count($found) < $limit; $page++) {
            [$status, $body] = $this->request(
                'https://weibo.com/ajax/statuses/search?' . http_build_query(['q' => $keyword, 'page' => $page, 'count' => $pageSize]),
                'GET',
                ['Accept: application/json, text/plain, */*', 'Referer: https://weibo.com/', 'Cookie: SUB=' . $cookies['SUB'] . '; SUBP=' . $cookies['SUBP']]
            );
            $payload = json_decode($body, true);
            if ($status >= 300 || !is_array($payload) || !in_array($payload['ok'] ?? null, [1, '1'], true)) throw new \RuntimeException("微博匿名搜索失败 (HTTP {$status})");
            $rawStatuses = is_array($payload['statuses'] ?? null) ? $payload['statuses'] : [];
            if (!$rawStatuses) break;
            $batch = $this->extractSearchStatuses($payload);
            $before = count($found);
            foreach ($batch as $item) {
                $statusId = $item['status_id'];
                if ($statusId === '' || isset($found[$statusId])) continue;
                $found[$statusId] = $item;
                if (count($found) >= $limit) break;
            }
        }
        return array_values($found);
    }

    public function extractSearchStatuses(array $payload): array
    {
        $result = [];
        foreach (is_array($payload['statuses'] ?? null) ? $payload['statuses'] : [] as $item) {
            if (!is_array($item)) continue;
            $statusId = $this->identifier($item['idstr'] ?? $item['id'] ?? $item['mid'] ?? $item['mblogid'] ?? null);
            if ($statusId === '' || isset($result[$statusId])) continue;
            $longText = is_array($item['longText'] ?? null) ? $item['longText'] : [];
            $complete = $longText['longTextContent'] ?? null;
            if (($item['isLongText'] ?? false) && (!is_string($complete) || trim($complete) === '')) continue;
            $rendered = is_string($complete) && trim($complete) !== ''
                ? $complete
                : $this->optionalString($item['text_raw'] ?? $item['text'] ?? null);
            $text = trim(html_entity_decode(strip_tags($rendered), ENT_QUOTES | ENT_HTML5, 'UTF-8'));
            if ($text === '') continue;
            $user = is_array($item['user'] ?? null) ? $item['user'] : [];
            $result[$statusId] = [
                'status_id' => $statusId,
                'text' => $text,
                'author_name' => $this->optionalString($user['screen_name'] ?? null),
                'created_at' => $this->optionalString($item['created_at'] ?? null),
            ];
        }
        return array_values($result);
    }

    private function visitorCookies(): array
    {
        [$status, $body] = $this->request(
            'https://passport.weibo.com/visitor/genvisitor2',
            'POST',
            ['Accept: */*', 'Referer: https://weibo.com/', 'Content-Type: application/x-www-form-urlencoded'],
            http_build_query(['cb' => 'visitor_gray_callback', 'tid' => '', 'from' => 'weibo'])
        );
        if ($status >= 400 || !preg_match('/\{.*\}/s', $body, $match)) throw new \RuntimeException("微博访客服务返回无效响应 (HTTP {$status})");
        $payload = json_decode($match[0], true);
        $data = is_array($payload['data'] ?? null) ? $payload['data'] : [];
        if (!in_array($payload['retcode'] ?? null, ['20000000', 20000000], true) || empty($data['sub']) || empty($data['subp'])) throw new \RuntimeException('微博访客服务未返回 SUB/SUBP');
        return [
            'SUB' => $this->requiredString($data['sub'], '微博访客 SUB 必须为字符串'),
            'SUBP' => $this->requiredString($data['subp'], '微博访客 SUBP 必须为字符串'),
        ];
    }

    private function classifyBatch(array $items): array
    {
        $payload = $this->classifier
            ? ($this->classifier)($items)
            : $this->requestClassifier($items);
        if (!is_array($payload)) throw new \RuntimeException('本地分类服务返回无效响应');
        if (($payload['model'] ?? null) !== $this->stringConfig('classifier_model')
            || ($payload['model_sha256'] ?? null) !== $this->stringConfig('classifier_model_sha256')
            || ($payload['max_length'] ?? null) !== $this->integerConfig('classifier_max_length')
            || !is_array($payload['preprocess'] ?? null)
            || ($payload['preprocess']['version'] ?? null) !== $this->stringConfig('classifier_preprocess_version')
            || ($payload['preprocess']['fingerprint'] ?? null) !== $this->stringConfig('classifier_preprocess_fingerprint')) {
            throw new \RuntimeException('本地分类服务模型身份不匹配');
        }
        $threshold = $payload['threshold'] ?? null;
        if ((!is_float($threshold) && !is_int($threshold)) || abs((float) $threshold - $this->floatConfig('intent_threshold')) > 0.000000001) {
            throw new \RuntimeException('本地分类服务阈值不匹配');
        }
        $predictions = $payload['predictions'] ?? null;
        if (!is_array($predictions) || count($predictions) !== count($items)) throw new \RuntimeException('本地分类服务预测数量不匹配');
        $expected = array_fill_keys(array_column($items, 'id'), true);
        $results = [];
        foreach ($predictions as $prediction) {
            if (!is_array($prediction) || !is_string($prediction['id'] ?? null) || !array_key_exists($prediction['id'], $expected) || array_key_exists($prediction['id'], $results)) {
                throw new \RuntimeException('本地分类服务预测 ID 无效');
            }
            $score = $prediction['score'] ?? null;
            if ((!is_float($score) && !is_int($score)) || !is_finite((float) $score) || $score < 0 || $score > 1) {
                throw new \RuntimeException('本地分类服务分数超出 0..1');
            }
            $results[$prediction['id']] = (float) $score;
        }
        if (count($results) !== count($expected)) throw new \RuntimeException('本地分类服务预测 ID 不完整');
        return $results;
    }

    private function requestClassifier(array $items): array
    {
        $body = json_encode(['texts' => $items], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
        [$status, $raw] = $this->request(
            $this->stringConfig('classifier_url'),
            'POST',
            ['Content-Type: application/json', 'Accept: application/json'],
            $body,
            $this->integerConfig('classifier_timeout')
        );
        $payload = json_decode($raw, true);
        if ($status >= 300 || !is_array($payload)) throw new \RuntimeException("本地分类服务失败 (HTTP {$status})");
        return $payload;
    }

    private function request(string $url, string $method, array $headers, ?string $body = null, ?int $timeout = null): array
    {
        $curl = curl_init($url);
        curl_setopt_array($curl, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_TIMEOUT => $timeout ?? $this->integerConfig('request_timeout'),
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_USERAGENT => 'Mozilla/5.0 LostSky-Weibo-Feed/1.0',
        ]);
        if ($body !== null) curl_setopt($curl, CURLOPT_POSTFIELDS, $body);
        $raw = curl_exec($curl);
        $status = curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
        $error = curl_error($curl);
        if ($raw === false) throw new \RuntimeException('远端请求失败: ' . $error);
        if (!is_int($status) || !is_string($raw)) throw new \RuntimeException('远端请求返回无效响应');
        return [$status, $raw];
    }

    private function postedAt(string $value): int
    {
        $date = DateTimeImmutable::createFromFormat('D M d H:i:s O Y', trim($value));
        if (!$date) throw new \RuntimeException('微博发布时间格式无效');
        return $date->getTimestamp();
    }

    private function state(array $data): void
    {
        $state = WeiboFeedPollState::where('id', 1)->find() ?: new WeiboFeedPollState;
        $state->save(['id' => 1] + $data);
    }

    private function integerConfig(string $key): int
    {
        $value = config("weibo_feed.{$key}");
        if (!is_int($value)) throw new \RuntimeException("微博信息流配置 {$key} 必须为整数");
        return $value;
    }

    private function floatConfig(string $key): float
    {
        $value = config("weibo_feed.{$key}");
        if (!is_float($value)) throw new \RuntimeException("微博信息流配置 {$key} 必须为小数");
        return $value;
    }

    private function stringConfig(string $key): string
    {
        return $this->requiredString(config("weibo_feed.{$key}"), "微博信息流配置 {$key} 必须为字符串");
    }

    private function arrayConfig(string $key): array
    {
        $value = config("weibo_feed.{$key}");
        if (!is_array($value)) throw new \RuntimeException("微博信息流配置 {$key} 必须为数组");
        return $value;
    }

    private function requiredString(mixed $value, string $message): string
    {
        if (!is_string($value)) throw new \RuntimeException($message);
        return $value;
    }

    private function optionalString(mixed $value): string
    {
        return is_string($value) ? $value : '';
    }

    private function identifier(mixed $value): string
    {
        if (is_string($value)) return $value;
        if (is_int($value)) return strval($value);
        return '';
    }
}
