<?php
declare(strict_types=1);

namespace app\service;

use app\model\Team;
use app\model\TeamNotice;
use think\exception\HttpException;

class Notice
{
    public function send(int $teamId, string $title, ?string $content = null, bool $isPinned = false): array
    {
        $title = trim($title);
        $length = function_exists('mb_strlen') ? mb_strlen($title) : strlen($title);
        if ($title === '' || $length > 200) {
            throw new HttpException(422, '通知标题不能为空且不得超过 200 个字符');
        }

        if ($teamId <= 0) {
            throw new HttpException(422, '目标团队 ID 必须为正整数');
        }

        if (!Team::active()->find($teamId)) {
            throw new HttpException(404, '目标团队不存在或不可用');
        }

        $notice = app(TeamNotice::class);
        $notice->save([
            'team_id'   => $teamId,
            'title'     => $title,
            'content'   => $content,
            'is_pinned' => $isPinned ? 1 : 0,
            'is_read'   => 0,
        ]);

        return [
            'id'        => (int) $notice->id,
            'team_id'   => $teamId,
            'is_pinned' => (int) $notice->is_pinned,
        ];
    }

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
