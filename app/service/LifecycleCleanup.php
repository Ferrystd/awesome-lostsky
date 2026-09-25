<?php
declare(strict_types=1);

namespace app\service;

use app\model\BusinessAuditEvent;
use app\model\EntitySession;
use app\model\ExternalCompensation;
use app\model\File as FileModel;
use app\model\UserDevice;
use app\model\UserRefreshToken;
use app\model\WeiboMedia;
use app\model\WeiboOperationLog;
use app\model\WeiboTaskMedia;
use think\facade\Config;

class LifecycleCleanup
{
    public function run(): array
    {
        $now = time();
        $autoCompletion = app(ServiceRedemption::class)->autoCompleteDue($now);
        $sessionsBefore = $now - $this->days('entity_session_retention_days') * 86400;
        $devicesBefore = $now - $this->days('device_retention_days') * 86400;
        $refreshBefore = $now - $this->days('refresh_token_retention_days') * 86400;
        $auditBefore = $now - $this->days('business_audit_retention_days') * 86400;
        $weiboBefore = $now - $this->days('weibo_operation_retention_days') * 86400;

        $sessions = 0;
        foreach (EntitySession::withTrashed()
            ->where(function ($query) use ($sessionsBefore) {
                $query->where('expires_at', '<=', $sessionsBefore)
                    ->whereOr(function ($query) use ($sessionsBefore) {
                        $query->whereNotNull('revoked_at')
                            ->where('revoked_at', '<=', $sessionsBefore);
                    });
            })
            ->order('id', 'desc')
            ->select() as $session) {
            if (EntitySession::withTrashed()->where('parent_session_id', (int) $session->id)->find()) {
                continue;
            }
            $session->force(true)->delete();
            $sessions++;
        }

        $refreshTokens = 0;
        foreach (UserRefreshToken::where(function ($query) use ($refreshBefore) {
            $query->where('expires_at', '<=', $refreshBefore)
                ->whereOr(function ($query) use ($refreshBefore) {
                    $query->whereNotNull('used_at')->where('used_at', '<=', $refreshBefore);
                })
                ->whereOr(function ($query) use ($refreshBefore) {
                    $query->whereNotNull('revoked_at')->where('revoked_at', '<=', $refreshBefore);
                });
        })->select() as $refreshToken) {
            $refreshToken->force(true)->delete();
            $refreshTokens++;
        }

        $devices = 0;
        foreach (UserDevice::onlyTrashed()->where('delete_time', '<=', $devicesBefore)->select() as $device) {
            foreach (EntitySession::withTrashed()
                ->where('user_id', $device->user_id)
                ->where('device_token', $device->device_token)
                ->order('id', 'desc')
                ->select() as $session) {
                $session->force(true)->delete();
            }
            UserRefreshToken::destroy(function ($query) use ($device) {
                $query->where('device_id', $device->id);
            }, true);
            $device->force(true)->delete();
            $devices++;
        }

        $files = 0;
        foreach (FileModel::onlyTrashed()->select() as $file) {
            app(File::class)->purgeObject((string) $file->path);
            $file->force(true)->delete();
            $files++;
        }

        $businessAuditEvents = 0;
        foreach (BusinessAuditEvent::withTrashed()
            ->where('create_time', '<=', $auditBefore)
            ->select() as $event) {
            $event->force(true)->delete();
            $businessAuditEvents++;
        }

        $configuredBatchSize = filter_var(Config::get('cleanup.weibo_cleanup_batch_size', 200), FILTER_VALIDATE_INT);
        $batchSize = max(1, $configuredBatchSize === false ? 200 : $configuredBatchSize);
        $weiboOperationLogs = 0;
        foreach (WeiboOperationLog::withTrashed()->where('create_time', '<=', $weiboBefore)->limit($batchSize)->select() as $log) {
            $log->force(true)->delete();
            $weiboOperationLogs++;
        }

        $weiboMedia = 0;
        foreach (WeiboMedia::withTrashed()->where('create_time', '<=', $weiboBefore)->limit($batchSize)->select() as $media) {
            if (WeiboTaskMedia::withTrashed()->where('media_id', $media->id)->find()) continue;
            $media->force(true)->delete();
            $weiboMedia++;
        }

        $compensations = 0;
        foreach (ExternalCompensation::whereNull('completed_at')
            ->where('available_at', '<=', $now)
            ->order('id', 'asc')
            ->limit(100)
            ->select() as $task) {
            try {
                if ($task->provider !== 'oss' || $task->action !== 'delete') {
                    throw new \RuntimeException('不支持的外部补偿任务');
                }
                app(File::class)->purgeObject((string) $task->resource_key);
                $task->completed_at = time();
                $task->last_error = null;
                $task->save();
                $compensations++;
            } catch (\Throwable $exception) {
                $attempts = (int) $task->attempts + 1;
                $task->attempts = $attempts;
                $task->available_at = time() + min(21600, 5 * (3 ** min($attempts, 7)));
                $task->last_error = mb_substr($exception->getMessage(), 0, 1000);
                $task->save();
            }
        }

        return compact(
            'autoCompletion',
            'sessions',
            'refreshTokens',
            'devices',
            'files',
            'businessAuditEvents',
            'weiboOperationLogs',
            'weiboMedia',
            'compensations'
        );
    }

    private function days(string $key): int
    {
        return max(1, (int) Config::get("cleanup.{$key}", 7));
    }
}
