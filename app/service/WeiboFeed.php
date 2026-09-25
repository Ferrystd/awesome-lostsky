<?php
declare(strict_types=1);

namespace app\service;

use app\enum\WeiboFeedClassificationStatus;
use app\enum\WeiboOperationType;
use app\exception\AccessDeniedException;
use app\model\WeiboFeedPost;
use app\model\WeiboFeedPollState;
use think\exception\HttpException;

final class WeiboFeed
{
    public function list(int $teamId, array $actingEntity, int $page = 1, int $limit = 20): array
    {
        $page = max(1, $page);
        $limit = max(1, min(50, $limit));
        $full = app(PermissionGate::class)->allows($teamId, $actingEntity, [PermissionDictionary::WEIBO_PERSONAL_USE])
            && app(AbilityResolver::class)->available($teamId, 'weibo');
        $query = WeiboFeedPost::where('classification_status', WeiboFeedClassificationStatus::Accepted->value)
            ->where('posted_at', '>=', time() - $this->integerConfig('retention_seconds'));
        $total = (clone $query)->count();
        $items = $query->order('posted_at', 'desc')->order('id', 'desc')->page($page, $limit)->select();
        $state = WeiboFeedPollState::where('id', 1)->find();
        $configured = trim($this->stringConfig('typesafe_api_key')) !== '';
        $failed = $state && is_string($state->last_error) && trim($state->last_error) !== '';
        return [
            'list' => array_map(fn (WeiboFeedPost $post): array => $this->dto($post, $full), $items->all()),
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
            'restricted' => !$full,
            'updated_at' => $state?->last_success_at ?: 0,
            'poll_status' => !$configured ? 'unconfigured' : ($failed ? 'failed' : 'ready'),
            'last_error' => $failed ? '信息流更新失败' : null,
        ];
    }

    public function get(int $teamId, array $actingEntity, int $postId): array
    {
        if (!app(PermissionGate::class)->allows($teamId, $actingEntity, [PermissionDictionary::WEIBO_PERSONAL_USE])) {
            throw AccessDeniedException::permission([PermissionDictionary::WEIBO_PERSONAL_USE]);
        }
        if (!app(AbilityResolver::class)->available($teamId, 'weibo')) {
            throw AccessDeniedException::ability('weibo', '微博');
        }

        $post = $this->acceptedPost($postId);
        return $this->dto($post, true);
    }

    public function comment(int $teamId, int $entityId, int $postId, int $accountId, string $comment): array
    {
        $post = $this->acceptedPost($postId);
        $comment = trim($comment);
        if ($comment === '' || mb_strlen($comment) > 500) throw new HttpException(422, '评论需为 1 到 500 个字符');
        app(WeiboAccounts::class)->bound($teamId, $entityId, $accountId, false);
        return app(WeiboOperations::class)->execute(
            $teamId,
            $entityId,
            $entityId,
            $accountId,
            WeiboOperationType::Comment,
            ['status_id' => $this->modelString($post->status_id, 'status_id'), 'comment' => $comment]
        );
    }

    private function acceptedPost(int $postId): WeiboFeedPost
    {
        $post = WeiboFeedPost::where('id', $postId)
            ->where('classification_status', WeiboFeedClassificationStatus::Accepted->value)
            ->where('posted_at', '>=', time() - $this->integerConfig('retention_seconds'))
            ->find();
        if (!$post) throw new HttpException(404, '信息流帖子不存在或已过期');
        return $post;
    }

    private function dto(WeiboFeedPost $post, bool $full): array
    {
        if (!$full) {
            return [
                'id' => $post->id,
                'text' => $this->preview($this->modelString($post->text, 'text')),
                'posted_at' => $post->posted_at,
                'restricted' => true,
            ];
        }
        $statusId = $this->modelString($post->status_id, 'status_id');
        return [
            'id' => $post->id,
            'text' => $this->modelString($post->text, 'text'),
            'author_name' => $this->modelString($post->author_name, 'author_name'),
            'posted_at' => $post->posted_at,
            'status_url' => "https://m.weibo.cn/detail/{$statusId}",
            'app_url' => "sinaweibo://detail?mblogid={$statusId}",
            'restricted' => false,
        ];
    }

    private function preview(string $text): string
    {
        $text = preg_replace('~https?://\S+|www\.\S+|@[\p{L}\p{N}_-]+~u', '', trim($text)) ?? '';
        $text = trim(preg_replace('/\s+/u', ' ', $text) ?? '');
        $length = mb_strlen($text);
        if ($length <= 2) return str_repeat('…', max(1, $length));
        if ($length <= 8) return mb_substr($text, 0, 1) . '…';
        return mb_substr($text, 0, 3) . '…' . mb_substr($text, -3);
    }

    private function integerConfig(string $key): int
    {
        $value = config("weibo_feed.{$key}");
        if (!is_int($value)) throw new \RuntimeException("微博信息流配置 {$key} 必须为整数");
        return $value;
    }

    private function stringConfig(string $key): string
    {
        $value = config("weibo_feed.{$key}");
        if (!is_string($value)) throw new \RuntimeException("微博信息流配置 {$key} 必须为字符串");
        return $value;
    }

    private function modelString(mixed $value, string $field): string
    {
        if (!is_string($value)) throw new \RuntimeException("微博信息流字段 {$field} 必须为字符串");
        return $value;
    }
}
