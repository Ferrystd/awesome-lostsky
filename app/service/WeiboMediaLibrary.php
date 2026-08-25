<?php
declare(strict_types=1);

namespace app\service;

use app\model\WeiboMedia as WeiboMediaModel;
use think\exception\HttpException;
use think\file\UploadedFile;

final class WeiboMediaLibrary
{
    public function upload(int $teamId, int $resourceEntityId, int $accountId, bool $teamScope, UploadedFile $file): array
    {
        $account = app(WeiboAccounts::class)->bound($teamId, $resourceEntityId, $accountId, $teamScope);
        $mime = $file->getMime();
        if (!is_string($mime) || $mime === '') throw new HttpException(422, '无法识别图片类型');
        $uploaded = app(WeiboProtocol::class)->upload($account, $file->getRealPath(), $mime);
        $media = WeiboMediaModel::withTrashed()->where('team_id', $teamId)->where('owner_entity_id', $resourceEntityId)->where('pid', $uploaded['pid'])->find() ?: new WeiboMediaModel;
        if ($media->isExists()) $media->restore();
        $media->save([
            'team_id' => $teamId,
            'owner_entity_id' => $resourceEntityId,
            'pid' => $uploaded['pid'],
            'content_type' => $uploaded['content_type'],
            'byte_count' => $uploaded['byte_count'],
            'variants' => [
                'large' => "https://wx1.sinaimg.cn/large/{$uploaded['pid']}.jpg",
                'thumbnail' => "https://wx1.sinaimg.cn/thumbnail/{$uploaded['pid']}.jpg",
            ],
        ]);
        return ['id' => $media->id, 'pid' => $media->pid, 'content_type' => $media->content_type, 'byte_count' => $media->byte_count];
    }

    /** @return array{content:string,content_type:string} */
    public function content(int $teamId, int $entityId, int $mediaId, bool $teamScope): array
    {
        $media = WeiboMediaModel::where('team_id', $teamId)->where('id', $mediaId)->find();
        if (!$media || (!$teamScope && $media->owner_entity_id !== $entityId)) throw new HttpException(404, '媒体不存在');
        return app(WeiboProtocol::class)->imageContent($media->pid);
    }

}
