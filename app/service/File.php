<?php
declare(strict_types=1);

namespace app\service;

use app\model\TeamAbility;
use OSS\OssClient;
use think\exception\HttpException;
use think\facade\Config;
use think\facade\Db;
use think\file\UploadedFile;

class File
{
    public function upload(UploadedFile $file, int $memberId): array
    {
        $member = \app\model\TeamMember::find($memberId);
        if (!$member) {
            throw new HttpException(404, '成员不存在');
        }
        $teamId = (int) $member->team_id;

        $this->checkAbility($teamId, (int) $file->getSize());

        $hash = hash_file('sha256', $file->getPathname());
        $ext  = $file->getOriginalExtension() ?: '';
        $path = sprintf('%d/%s/%s.%s', $teamId, date('Ym'), $hash, $ext);

        return Db::transaction(function () use ($file, $hash, $path, $teamId, $memberId) {
            $exist = \app\model\File::withTrashed()
                ->where('team_id', $teamId)
                ->where('hash', $hash)
                ->lock(true)
                ->find();
            if ($exist) {
                if ($exist->trashed()) {
                    $exist->restore();
                    $exist = \app\model\File::where('team_id', $teamId)
                        ->where('hash', $hash)
                        ->find();
                }

                return [
                    'id'   => (int) $exist->id,
                    'url'  => $this->url($exist->path),
                    'name' => $exist->name,
                    'size' => (int) $exist->size,
                ];
            }

            $record = new \app\model\File;
            $record->hash      = $hash;
            $record->name      = $file->getOriginalName();
            $record->path      = $path;
            $record->size      = $file->getSize();
            $record->mime_type = $file->getOriginalMime();
            $record->team_id   = $teamId;
            $record->member_id = $memberId;
            $record->save();

            $this->putOss($path, $file->getPathname());

            return [
                'id'   => (int) $record->id,
                'url'  => $this->url($path),
                'name' => $record->name,
                'size' => (int) $record->size,
            ];
        });
    }

    public function uploadForJoin(UploadedFile $file, int $teamId): array
    {
        $this->checkAbility($teamId, (int) $file->getSize());

        $hash = hash_file('sha256', $file->getPathname());
        $ext  = $file->getOriginalExtension() ?: '';
        $path = sprintf('%d/%s/%s.%s', $teamId, date('Ym'), $hash, $ext);

        return Db::transaction(function () use ($file, $hash, $path, $teamId) {
            $exist = \app\model\File::withTrashed()
                ->where('team_id', $teamId)
                ->where('hash', $hash)
                ->lock(true)
                ->find();
            if ($exist) {
                if ($exist->trashed()) {
                    $exist->restore();
                    $exist = \app\model\File::where('team_id', $teamId)
                        ->where('hash', $hash)
                        ->find();
                }

                return [
                    'id'   => (int) $exist->id,
                    'url'  => $this->url($exist->path),
                    'name' => $exist->name,
                    'size' => (int) $exist->size,
                ];
            }

            $record = new \app\model\File;
            $record->hash      = $hash;
            $record->name      = $file->getOriginalName();
            $record->path      = $path;
            $record->size      = $file->getSize();
            $record->mime_type = $file->getOriginalMime();
            $record->team_id   = $teamId;
            $record->member_id = null;
            $record->save();

            $this->putOss($path, $file->getPathname());

            return [
                'id'   => (int) $record->id,
                'url'  => $this->url($path),
                'name' => $record->name,
                'size' => (int) $record->size,
            ];
        });
    }

    public function list(int $teamId, array $filters, int $page = 1, int $limit = 20): array
    {
        $query = \app\model\File::where('team_id', $teamId);

        if (!empty($filters['member_id'])) {
            $query->where('member_id', (int) $filters['member_id']);
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

        $total = $query->count();
        $list  = $query->with(['member.profile'])
            ->order('id', 'desc')
            ->page($page, $limit)
            ->select()
            ->toArray();

        foreach ($list as &$item) {
            $item = $this->format($item);
        }
        unset($item);

        return compact('total', 'list', 'page', 'limit');
    }

    public function get(int $teamId, int $id): array
    {
        $file = \app\model\File::where('team_id', $teamId)
            ->with(['member.profile'])
            ->find($id);

        if (!$file) {
            throw new HttpException(404, '文件不存在');
        }

        return $this->format($file->toArray());
    }

    public function delete(int $id, int $memberId): void
    {
        $file = \app\model\File::find($id);
        if (!$file) {
            throw new HttpException(404, '文件不存在');
        }
        if ($file->member_id !== $memberId) {
            throw new HttpException(403, '无权删除此文件');
        }
        $file->delete();
    }

    public function deleteByTeam(int $teamId, int $id): void
    {
        $file = \app\model\File::where('team_id', $teamId)->find($id);
        if (!$file) {
            throw new HttpException(404, '文件不存在');
        }

        $file->delete();
    }

    public function checkAbility(int $teamId, int $newSize): void
    {
        $ability = TeamAbility::where('team_id', $teamId)
            ->where('ability_key', 'file')
            ->find();

        $level = $ability ? $ability->level : 0;
        $tiers = Config::get('file.tiers');
        $tier  = $tiers[$level] ?? $tiers[0];

        if ($tier['count'] === 0 && $tier['size'] === 0 && $level !== 3) {
            throw new HttpException(403, '团队未开通文件上传能力');
        }

        if ($level === 3) {
            return;
        }

        $usage = $this->usage($teamId);

        if ($tier['count'] > 0 && $usage['count'] >= $tier['count']) {
            throw new HttpException(422, '文件数量已达上限(' . $tier['count'] . '个)');
        }

        if ($usage['totalSize'] + $newSize > $tier['size']) {
            throw new HttpException(422, '存储空间已达上限');
        }
    }

    public function usage(int $teamId): array
    {
        $result = \app\model\File::where('team_id', $teamId)
            ->fieldRaw('COUNT(id) as count, COALESCE(SUM(size), 0) as total_size')
            ->find();

        return [
            'count'     => (int) $result->count,
            'totalSize' => (int) $result->total_size,
        ];
    }

    private function format(array $file): array
    {
        $file['url'] = $this->url((string) $file['path']);

        return $file;
    }

    private function url(string $path): string
    {
        $domain = rtrim(Config::get('aliyun.oss_domain'), '/');
        if ($domain) {
            return $domain . '/' . ltrim($path, '/');
        }
        $bucket  = Config::get('aliyun.bucket');
        $region  = Config::get('aliyun.region');
        return "https://{$bucket}.oss-{$region}.aliyuncs.com/" . ltrim($path, '/');
    }

    private function putOss(string $path, string $localFile): void
    {
        try {
            $endpoint = 'oss-' . Config::get('aliyun.region') . '.aliyuncs.com';
            $client = new OssClient(
                Config::get('aliyun.access_key_id'),
                Config::get('aliyun.access_key_secret'),
                $endpoint
            );
            $client->putObject(Config::get('aliyun.bucket'), $path, $localFile);
        } catch (\OSS\Core\OssException $e) {
            throw new HttpException(500, '文件上传失败：' . $e->getMessage());
        }
    }
}
