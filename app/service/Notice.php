<?php
declare(strict_types=1);

namespace app\service;

use app\model\TeamNotice;
use think\exception\HttpException;

class Notice
{
    public function list(int $teamId, array $filters = [], int $page = 1, int $limit = 20): array
    {
        $page  = max(1, $page);
        $limit = max(1, min(100, $limit));

        $query = TeamNotice::where('team_id', $teamId);

        if (($filters['is_read'] ?? '') !== '') {
            $query->where('is_read', (int) $filters['is_read']);
        }

        if (($filters['keyword'] ?? '') !== '') {
            $keyword = trim((string) $filters['keyword']);
            $query->where(function ($query) use ($keyword) {
                $query->whereLike('title', "%{$keyword}%")
                    ->whereOr('content', 'like', "%{$keyword}%");
            });
        }

        $total = (clone $query)->count();
        $list  = $query
            ->order('is_pinned', 'desc')
            ->order('id', 'desc')
            ->page($page, $limit)
            ->select()
            ->toArray();

        return [
            'list'  => $list,
            'total' => $total,
            'page'  => $page,
            'limit' => $limit,
        ];
    }

    public function get(int $teamId, int $id): array
    {
        return $this->notice($teamId, $id)->toArray();
    }

    public function confirm(int $teamId, int $id): void
    {
        $notice = $this->notice($teamId, $id);
        if ((int) $notice->is_read === 1) {
            return;
        }

        $notice->save(['is_read' => 1]);
    }

    public function confirmAll(int $teamId): int
    {
        return TeamNotice::where('team_id', $teamId)
            ->where('is_read', 0)
            ->update(['is_read' => 1]);
    }

    public function receive(int $teamId, int $id): void
    {
        $this->notice($teamId, $id);
        throw new HttpException(501, '站内信资产收取暂未实现');
    }

    public function receiveAll(int $teamId): void
    {
        throw new HttpException(501, '站内信资产批量收取暂未实现');
    }

    private function notice(int $teamId, int $id): TeamNotice
    {
        $notice = TeamNotice::where('team_id', $teamId)->find($id);
        if (!$notice) {
            throw new HttpException(404, '站内信不存在');
        }

        return $notice;
    }
}
