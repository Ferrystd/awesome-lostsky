<?php
declare(strict_types=1);

namespace app\service;

use app\model\WeiboCommentPreset;
use app\model\Entity as EntityModel;
use app\model\Team;
use think\exception\HttpException;
use think\facade\Db;

final class WeiboCommentPresets
{
    public function personalList(int $teamId, int $entityId): array
    {
        app(Entity::class)->assertInTeam($entityId, $teamId);
        $team = WeiboCommentPreset::where('team_id', $teamId)->whereNull('entity_id')->order('sort')->select();
        $personal = WeiboCommentPreset::where('team_id', $teamId)->where('entity_id', $entityId)->order('sort')->select();
        return array_merge($this->dtoList($team, 'team'), $this->dtoList($personal, 'personal'));
    }

    public function teamList(int $teamId): array
    {
        return $this->dtoList(
            WeiboCommentPreset::where('team_id', $teamId)->whereNull('entity_id')->order('sort')->select(),
            'team'
        );
    }

    public function replacePersonal(int $teamId, int $entityId, array $contents): array
    {
        app(Entity::class)->assertInTeam($entityId, $teamId);
        $this->replace($teamId, $entityId, $contents);
        return $this->personalList($teamId, $entityId);
    }

    public function replaceTeam(int $teamId, array $contents): array
    {
        $this->replace($teamId, null, $contents);
        return $this->teamList($teamId);
    }

    private function replace(int $teamId, ?int $entityId, array $contents): void
    {
        $normalized = $this->contents($contents);
        Db::transaction(function () use ($teamId, $entityId, $normalized): void {
            if ($entityId === null) {
                if (!Team::where('id', $teamId)->lock(true)->find()) throw new HttpException(404, '团队不存在');
            } else {
                if (!EntityModel::where('id', $entityId)->lock(true)->find()) throw new HttpException(404, 'Entity 不存在');
            }
            $query = WeiboCommentPreset::where('team_id', $teamId);
            $entityId === null ? $query->whereNull('entity_id') : $query->where('entity_id', $entityId);
            $oldIds = $query->column('id');
            if ($oldIds) WeiboCommentPreset::destroy($oldIds, true);
            foreach ($normalized as $sort => $content) {
                (new WeiboCommentPreset)->save([
                    'team_id' => $teamId,
                    'entity_id' => $entityId,
                    'content' => $content,
                    'sort' => $sort,
                ]);
            }
        });
    }

    private function contents(array $contents): array
    {
        if (count($contents) > 20) throw new HttpException(422, '评论预设最多 20 条');
        $result = [];
        foreach ($contents as $content) {
            if (!is_string($content)) throw new HttpException(422, '评论预设格式无效');
            $content = trim($content);
            if ($content === '' || mb_strlen($content) > 500) throw new HttpException(422, '每条评论预设需为 1 到 500 个字符');
            if (!in_array($content, $result, true)) $result[] = $content;
        }
        return $result;
    }

    private function dtoList(iterable $items, string $scope): array
    {
        $result = [];
        foreach ($items as $item) $result[] = ['id' => $item->id, 'content' => $item->content, 'scope' => $scope];
        return $result;
    }
}
