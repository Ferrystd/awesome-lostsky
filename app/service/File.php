<?php
declare(strict_types=1);

namespace app\service;

use app\model\File as FileModel;
use app\model\TeamAbility;
use app\model\TeamMember as TeamMemberModel;
use OSS\OssClient;
use think\exception\HttpException;
use think\facade\Config;
use think\facade\Db;
use think\file\UploadedFile;

class File
{
    public function upload(UploadedFile $file, int $memberId): array
    {
        $member = TeamMemberModel::find($memberId);
        if (!$member) {
            throw new HttpException(404, '成员不存在');
        }
        $teamId = (int) $member->team_id;

        $this->checkAbility($teamId, (int) $file->getSize());

        $hash = hash_file('sha256', $file->getPathname());
        $ext  = $file->getOriginalExtension() ?: '';
        $path = sprintf('%d/%s/%s.%s', $teamId, date('Ym'), $hash, $ext);

        return Db::transaction(function () use ($file, $hash, $path, $memberId) {
            $exist = FileModel::where('hash', $hash)->lock(true)->find();
            if ($exist) {
                return [
                    'id'   => (int) $exist->id,
                    'url'  => $this->url($exist->path),
                    'name' => $exist->name,
                    'size' => (int) $exist->size,
                ];
            }

            $record = new FileModel;
            $record->hash      = $hash;
            $record->name      = $file->getOriginalName();
            $record->path      = $path;
            $record->size      = $file->getSize();
            $record->mime_type = $file->getOriginalMime();
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

    public function delete(int $id, int $memberId): void
    {
        $file = FileModel::find($id);
        if (!$file) {
            throw new HttpException(404, '文件不存在');
        }
        if ($file->member_id !== $memberId) {
            throw new HttpException(403, '无权删除此文件');
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
        $memberTable = (new TeamMemberModel)->getTable();

        $result = FileModel::alias('f')
            ->join("{$memberTable} m", 'f.member_id = m.id')
            ->where('m.team_id', $teamId)
            ->whereNull('f.delete_time')
            ->fieldRaw('COUNT(f.id) as count, COALESCE(SUM(f.size), 0) as total_size')
            ->find();

        return [
            'count'     => (int) $result->count,
            'totalSize' => (int) $result->total_size,
        ];
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
