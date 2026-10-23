<?php
declare(strict_types=1);

namespace app\service;

use app\enum\FileSource;
use app\model\ExternalCompensation;
use app\model\Entity;
use OSS\OssClient;
use think\exception\FileException;
use think\exception\HttpException;
use think\facade\Config;
use think\facade\Db;
use think\file\UploadedFile;

class File
{
    private const QUOTA_MESSAGE = '该团队文件已达到上限，请联系团队管理员。';

    public function upload(UploadedFile $file, int $teamId, array $actor, FileSource $source = FileSource::Manual, bool $immediate = false): array
    {
        $identity = $this->identityForActor($actor, $teamId);

        $result = $this->store(
            $file,
            $teamId,
            (int) $identity->id,
            true,
            true,
            $source,
            !$immediate
        );

        return $this->apiResult($result);
    }

    public function uploadForJoin(UploadedFile $file, int $teamId): array
    {
        $result = $this->store($file, $teamId, null, true, true, FileSource::Join, true);

        return $this->apiResult($result);
    }

    public function uploadSystem(UploadedFile $file): array
    {
        return $this->store($file, null, null, false, false, FileSource::System);
    }

    public function uploadByCommand(string $localPath, ?int $entityId = null, ?int $teamId = null, ?string $originalName = null): array
    {
        $file = $this->createUploadedFile($localPath, $originalName);

        if ($entityId !== null) {
            $identity = $this->identity($entityId);
            $entityTeamId = $this->identityTeamId($identity);
            if ($teamId !== null && $teamId !== $entityTeamId) {
                throw new HttpException(422, 'team_id 与 entity_id 不匹配');
            }

            return $this->store($file, $entityTeamId, $entityId, true, true, FileSource::Command);
        }

        if ($teamId !== null) {
            return $this->store($file, $teamId, null, true, true, FileSource::Command);
        }

        return $this->store($file, null, null, false, false, FileSource::Command);
    }

    public function list(int $teamId, array $filters, int $page = 1, int $limit = 20): array
    {
        [$page, $limit] = app(Pagination::class)->normalize($page, $limit);
        $query = \app\model\File::where('team_id', $teamId)->whereNull('pending_until');

        if (!empty($filters['entity_id'])) {
            $query->where('entity_id', (int) $filters['entity_id']);
        }
        if (!empty($filters['mime_type'])) {
            $query->where('mime_type', (string) $filters['mime_type']);
        }
        if (!empty($filters['keyword'])) {
            $keyword = '%' . addcslashes((string) $filters['keyword'], '%_') . '%';
            $query->where(function ($query) use ($keyword) {
                $query->where('hash', 'like', $keyword)
                    ->whereOr('path', 'like', $keyword)
                    ->whereOr('name', 'like', $keyword);
            });
        }
        if (!empty($filters['start_time'])) {
            $query->where('create_time', '>=', (int) $filters['start_time']);
        }
        if (!empty($filters['end_time'])) {
            $query->where('create_time', '<=', (int) $filters['end_time']);
        }

        $paginator = $query->with(['subject'])
            ->order('id', 'desc')
            ->paginate(['list_rows' => $limit, 'page' => $page]);
        $list  = $paginator->getCollection()->toArray();

        foreach ($list as &$item) {
            $item = $this->format($item);
        }
        unset($item);

        return app(Pagination::class)->response($paginator, $list);
    }

    public function get(int $teamId, int $id): array
    {
        $file = \app\model\File::where('team_id', $teamId)
            ->whereNull('pending_until')
            ->with(['subject'])
            ->find($id);

        if (!$file) {
            throw new HttpException(404, '文件不存在');
        }

        return $this->format($file->toArray());
    }

    public function delete(int $id, int $entityId): void
    {
        $file = \app\model\File::find($id);
        if (!$file) {
            throw new HttpException(404, '文件不存在');
        }
        if ((int) $file->entity_id !== $entityId) {
            throw new HttpException(403, '无权删除此文件');
        }
        $this->purgeObject((string) $file->path);
        $file->force(true)->delete();
    }

    public function deleteByTeam(int $teamId, int $id): void
    {
        $file = \app\model\File::where('team_id', $teamId)->find($id);
        if (!$file) {
            throw new HttpException(404, '文件不存在');
        }

        $this->purgeObject((string) $file->path);
        $file->force(true)->delete();
    }

    public function checkAbility(int $teamId, int $newSize): void
    {
        $ability = $this->capacityAbility($teamId);
        $level = (int) $ability['level'];
        $tiers = Config::get('file.tiers');
        $tier  = $tiers[$level] ?? $tiers[0];

        $sizeLimit = (int) $tier['size'];
        if ($sizeLimit < 0) {
            return;
        }

        $usage = $this->measure($teamId, true);
        if ($usage['total_size'] >= $sizeLimit || $usage['total_size'] + $newSize > $sizeLimit) {
            throw new HttpException(422, self::QUOTA_MESSAGE);
        }
    }

    public function usage(int $teamId): array
    {
        return $this->uploadAvailability($teamId);
    }

    public function uploadAvailability(int $teamId): array
    {
        $usage = $this->measure($teamId);
        $ability = $this->capacityAbility($teamId);
        $tiers = Config::get('file.tiers');
        $tier = $tiers[(int) $ability['level']] ?? $tiers[0];
        $sizeLimit = (int) $tier['size'];

        if ($sizeLimit < 0) {
            return array_merge($usage, [
                'size_limit' => null,
                'remaining_size' => null,
                'available' => true,
                'reason' => null,
            ]);
        }

        $remainingSize = max(0, $sizeLimit - $usage['total_size']);

        return array_merge($usage, [
            'size_limit' => $sizeLimit,
            'remaining_size' => $remainingSize,
            'available' => $remainingSize > 0,
            'reason' => $remainingSize > 0 ? null : 'quota',
        ]);
    }

    public function capacityAbility(int $teamId): array
    {
        $ability = app(AbilityResolver::class)->resolve($teamId, 'file');
        if ($ability['enabled']) {
            return $ability;
        }

        return [
            'enabled' => true,
            'level' => 0,
            'expire_time' => 0,
            'reason' => null,
            'source' => 'base',
        ];
    }

    private function measure(int $teamId, bool $current = false): array
    {
        if ($current) {
            // Current locking read: prior business SELECTs may have opened an RR snapshot.
            $rows = \app\model\File::where('team_id', $teamId)->whereNull('pending_until')
                ->field(['id', 'size'])->lock(true)->select();
            return ['count' => count($rows), 'total_size' => array_sum(array_column($rows->toArray(), 'size'))];
        }
        $result = \app\model\File::where('team_id', $teamId)
            ->whereNull('pending_until')
            ->fieldRaw('COUNT(id) as count, COALESCE(SUM(size), 0) as total_size')
            ->find();

        return [
            'count'     => (int) $result->count,
            'total_size' => (int) $result->total_size,
        ];
    }

    public function purgeObject(string $path): void
    {
        try {
            $this->ossClient()->deleteObject(Config::get('aliyun.bucket'), $path);
        } catch (\OSS\Core\OssException $e) {
            throw new HttpException(500, '文件对象清理失败', $e);
        }
    }

    private function store(UploadedFile $file, ?int $teamId, ?int $entityId, bool $checkAbility, bool $dedupe, FileSource $source, bool $pending = false): array
    {
        $validator = app(\app\validate\File::class);
        if (!$validator->upload($file)) {
            throw new HttpException(422, $validator->getError());
        }

        $hash = hash_file('sha256', $file->getPathname());
        $path = $this->buildPath($teamId, $hash, $file->getOriginalExtension());

        if ($dedupe && $teamId !== null) {
            $existing = Db::transaction(function () use ($teamId, $hash, $pending) {
                $this->lockTeam($teamId);
                $existing = \app\model\File::withTrashed()->where('team_id', $teamId)
                    ->where('hash', $hash)->lock(true)->find();
                return $existing ? $this->reuse($existing, $pending) : null;
            });
            if ($existing) return $existing;
        }

        $this->putOss($path, $file->getPathname());

        try {
            $result = Db::transaction(function () use ($file, $hash, $path, $teamId, $entityId, $dedupe, $checkAbility, $source, $pending) {
                if ($teamId !== null) {
                    $this->lockTeam($teamId);
                }
                if ($dedupe && $teamId !== null) {
                    $exist = \app\model\File::withTrashed()
                        ->where('team_id', $teamId)
                        ->where('hash', $hash)
                        ->lock(true)
                        ->find();
                    if ($exist) return $this->reuse($exist, $pending);
                }
                if (!$pending && $checkAbility && $teamId !== null) $this->checkAbility($teamId, (int) $file->getSize());

                $record = new \app\model\File;
                $record->hash      = $hash;
                $record->name      = $file->getOriginalName();
                $record->path      = $path;
                $record->size      = $file->getSize();
                $record->mime_type = $file->getOriginalMime();
                $record->team_id   = $teamId;
                $record->entity_id = $entityId;
                $record->source    = $source;
                $record->pending_until = $pending ? time() + 43200 : null;
                $record->save();

                return $this->storedResult($record);
            });
            if ($result['path'] !== $path) {
                $this->queueObjectPurge($path, new \RuntimeException('并发去重多余对象'));
            }
            return $result;
        } catch (\Throwable $exception) {
            $referenced = \app\model\File::withTrashed()->where('path', $path)->find();
            if (!$referenced) {
                try {
                    $this->purgeObject($path);
                } catch (\Throwable $cleanupException) {
                    $this->queueObjectPurge($path, $cleanupException);
                    throw new HttpException(500, '文件记录保存失败，外部对象已进入补偿队列', $cleanupException);
                }
            }

            throw $exception;
        }
    }

    private function reuse(\app\model\File $file, bool $pending): array
    {
        if ($file->pending_until !== null && (int) $file->pending_until <= time()) {
            throw new HttpException(422, '文件已过期，请等待清理后重新上传');
        }
        if ($file->trashed()) {
            $deadline = $pending ? ($file->pending_until ?? time() + 43200) : null;
            if (!$pending) $this->checkAbility((int) $file->team_id, (int) $file->size);
            // A trashed model's save still carries the default soft-delete scope.
            Db::name('file')->where('id', $file->id)->update(['pending_until' => $deadline, 'delete_time' => null]);
            $file = \app\model\File::where('id', $file->id)->find();
        } elseif (!$pending && $file->pending_until !== null) {
            $this->checkAbility((int) $file->team_id, (int) $file->size);
            $file->save(['pending_until' => null]);
        }
        return $this->storedResult($file);
    }

    public function expirePending(int $now): int
    {
        $count = 0;
        foreach (\app\model\File::withTrashed()->whereNotNull('pending_until')
            ->where('pending_until', '<=', $now)->limit(200)->select() as $candidate) {
            $count += Db::transaction(function () use ($candidate, $now): int {
                $this->lockTeam((int) $candidate->team_id);
                $file = \app\model\File::withTrashed()->where('id', $candidate->id)->lock(true)->find();
                if (!$file || $file->pending_until === null || (int) $file->pending_until > $now) return 0;
                $this->queueObjectPurge((string) $file->path, new \RuntimeException('未使用文件已过期'));
                $file->force(true)->delete();
                return 1;
            });
        }
        return $count;
    }

    private function storedResult(\app\model\File $file): array
    {
        return [
            'id'        => (int) $file->id,
            'url'       => $this->url((string) $file->path),
            'path'      => (string) $file->path,
            'name'      => (string) $file->name,
            'size'      => (int) $file->size,
            'team_id'   => $file->team_id === null ? null : (int) $file->team_id,
            'entity_id' => $file->entity_id === null ? null : (int) $file->entity_id,
        ];
    }

    private function lockTeam(int $teamId): void
    {
        if (!\app\model\Team::where('id', $teamId)->lock(true)->find()) {
            throw new HttpException(404, '团队不存在');
        }
    }

    private function identityForActor(array $actor, int $teamId): Entity
    {
        $identity = Entity::where('entityable_type', (string) ($actor['type'] ?? ''))
            ->where('entityable_id', (int) ($actor['id'] ?? 0))
            ->find();
        if (!$identity || !$identity->is_valid) {
            throw new HttpException(422, '当前人员身份不存在或不可用');
        }
        if ($this->identityTeamId($identity) !== $teamId) {
            $identity = Entity::team()->where('entityable_id', $teamId)->find();
            if (!$identity || !$identity->is_valid) {
                throw new HttpException(404, '团队身份不存在或不可用');
            }
        }

        return $identity;
    }

    private function identity(int $entityId): Entity
    {
        $identity = Entity::find($entityId);
        if (!$identity || !$identity->is_valid) {
            throw new HttpException(404, '人员身份不存在或不可用');
        }

        return $identity;
    }

    private function identityTeamId(Entity $identity): int
    {
        $entity = $identity->entityable;
        if (!$entity) {
            throw new HttpException(404, '人员身份对象不存在');
        }

        return $identity->entityable_type === 'team'
            ? (int) $entity->id
            : (int) $entity->team_id;
    }

    private function queueObjectPurge(string $path, \Throwable $exception): void
    {
        $task = ExternalCompensation::withTrashed()
            ->where('provider', 'oss')
            ->where('action', 'delete')
            ->where('resource_key', $path)
            ->find();
        if ($task?->trashed()) {
            $task->restore();
            $task = ExternalCompensation::where('provider', 'oss')
                ->where('action', 'delete')
                ->where('resource_key', $path)
                ->find();
        }
        if (!$task) {
            $task = new ExternalCompensation;
            $task->provider = 'oss';
            $task->action = 'delete';
            $task->resource_key = $path;
        }
        $task->attempts = (int) $task->attempts;
        $task->available_at = time();
        $task->last_error = mb_substr($exception->getMessage(), 0, 1000);
        $task->completed_at = null;
        $task->save();
    }

    private function apiResult(array $result): array
    {
        return [
            'id'   => (int) $result['id'],
            'url'  => (string) $result['url'],
            'name' => (string) $result['name'],
            'size' => (int) $result['size'],
        ];
    }

    private function format(array $file): array
    {
        $file['url'] = $this->url((string) $file['path']);

        return $file;
    }

    private function createUploadedFile(string $localPath, ?string $originalName = null): UploadedFile
    {
        if (!is_file($localPath)) {
            throw new HttpException(404, '本地文件不存在');
        }
        if (!is_readable($localPath)) {
            throw new HttpException(422, '本地文件不可读');
        }

        $name     = $originalName ?: basename($localPath);
        $mimeType = mime_content_type($localPath) ?: 'application/octet-stream';

        try {
            return new UploadedFile($localPath, $name, $mimeType, null, true);
        } catch (FileException $e) {
            throw new HttpException(422, '无法读取上传文件：' . $e->getMessage());
        }
    }

    private function buildPath(?int $teamId, string $hash, string $ext): string
    {
        $prefix = $teamId === null ? 'system' : (string) $teamId;
        $suffix = $ext === '' ? '' : '.' . $ext;

        return sprintf('%s/%s/%s-%s%s', $prefix, date('Ym'), $hash, bin2hex(random_bytes(8)), $suffix);
    }

    private function url(string $path): string
    {
        $domain = rtrim(Config::get('aliyun.oss_domain'), '/');
        if ($domain) {
            return $domain . '/' . ltrim($path, '/');
        }
        $bucket = Config::get('aliyun.bucket');
        $region = Config::get('aliyun.region');

        return "https://{$bucket}.oss-{$region}.aliyuncs.com/" . ltrim($path, '/');
    }

    private function putOss(string $path, string $localFile): void
    {
        try {
            $this->ossClient()->uploadFile(Config::get('aliyun.bucket'), $path, $localFile);
        } catch (\OSS\Core\OssException $e) {
            throw new HttpException(500, '文件上传失败', $e);
        }
    }

    private function ossClient(): OssClient
    {
        $endpoint = 'oss-' . Config::get('aliyun.region') . '.aliyuncs.com';
        return new OssClient(
            Config::get('aliyun.access_key_id'),
            Config::get('aliyun.access_key_secret'),
            $endpoint
        );
    }
}
