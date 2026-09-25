<?php
declare(strict_types=1);

namespace app\service;

use app\model\Entity;
use app\model\Team;
use app\model\TeamNotice;
use think\exception\HttpException;

class Notice
{
    /**
     * LostSky -> Team。保留原有公开方法与团队收件语义。
     */
    public function send(int $teamId, string $title, ?string $content = null, bool $isPinned = false): array
    {
        $this->assertTeam($teamId);

        return $this->create([
            'team_id' => $teamId,
            'sender_team_id' => null,
            'entity_id' => null,
        ], $title, $content, $isPinned);
    }

    public function sendOnce(int $teamId, string $title, ?string $content, string $dedupKey): array
    {
        $this->assertTeam($teamId);
        $dedupKey = trim($dedupKey);
        if ($dedupKey === '' || strlen($dedupKey) > 191) {
            throw new HttpException(422, '通知去重标识不合法');
        }
        $existing = TeamNotice::where('dedup_key', $dedupKey)->find();
        if ($existing) {
            return ['id' => (int) $existing->id, 'team_id' => (int) $existing->team_id];
        }

        return $this->create([
            'team_id' => $teamId,
            'sender_team_id' => null,
            'entity_id' => null,
            'dedup_key' => $dedupKey,
        ], $title, $content, false);
    }

    /**
     * Team -> Entity。执行者权限由 HTTP 中间件校验，通知以 Team 名义发送。
     */
    public function sendToEntity(
        int $senderTeamId,
        int $entityId,
        string $title,
        ?string $content = null,
        bool $isPinned = false
    ): array {
        $this->assertTeam($senderTeamId);
        app(\app\service\Entity::class)->assertInTeam($entityId, $senderTeamId);

        return $this->create([
            'team_id' => null,
            'sender_team_id' => $senderTeamId,
            'entity_id' => $entityId,
        ], $title, $content, $isPinned);
    }

    public function list(int $teamId, array $filters = [], int $page = 1, int $limit = 20): array
    {
        return $this->listing('team_id', $teamId, $filters, $page, $limit);
    }

    public function listForEntity(int $entityId, array $filters = [], int $page = 1, int $limit = 20): array
    {
        if (!$this->canReceive($entityId)) {
            return ['list' => [], 'total' => 0, 'page' => max(1, $page), 'limit' => max(1, min(100, $limit))];
        }

        return $this->listing('entity_id', $entityId, $filters, $page, $limit);
    }

    public function listSent(int $teamId, array $filters = [], int $page = 1, int $limit = 20): array
    {
        return $this->listing('sender_team_id', $teamId, $filters, $page, $limit);
    }

    public function getSent(int $teamId, int $id): array
    {
        return $this->notice('sender_team_id', $teamId, $id)->toArray();
    }

    public function get(int $teamId, int $id): array
    {
        return $this->notice('team_id', $teamId, $id)->toArray();
    }

    public function getForEntity(int $entityId, int $id): array
    {
        return $this->notice('entity_id', $entityId, $id)->toArray();
    }

    public function confirm(int $teamId, int $id): void
    {
        $this->markRead($this->notice('team_id', $teamId, $id));
    }

    public function confirmForEntity(int $entityId, int $id): void
    {
        $this->markRead($this->notice('entity_id', $entityId, $id));
    }

    public function confirmAll(int $teamId): int
    {
        return $this->confirmAllFor('team_id', $teamId);
    }

    public function confirmAllForEntity(int $entityId): int
    {
        if (!$this->canReceive($entityId)) {
            return 0;
        }

        return $this->confirmAllFor('entity_id', $entityId);
    }

    public function receive(int $teamId, int $id): void
    {
        $this->notice('team_id', $teamId, $id);
        throw new HttpException(501, '站内通知资产收取暂未实现');
    }

    public function receiveForEntity(int $entityId, int $id): void
    {
        $this->notice('entity_id', $entityId, $id);
        throw new HttpException(501, '站内通知资产收取暂未实现');
    }

    public function receiveAll(int $teamId): void
    {
        throw new HttpException(501, '站内通知资产批量收取暂未实现');
    }

    public function receiveAllForEntity(int $entityId): void
    {
        throw new HttpException(501, '站内通知资产批量收取暂未实现');
    }

    private function create(array $recipient, string $title, ?string $content, bool $isPinned): array
    {
        $title = trim($title);
        $length = function_exists('mb_strlen') ? mb_strlen($title) : strlen($title);
        if ($title === '' || $length > 200) {
            throw new HttpException(422, '通知标题不能为空且不得超过 200 个字符');
        }

        $notice = app(TeamNotice::class, [], true);
        $notice->save(array_merge($recipient, [
            'title' => $title,
            'content' => $content,
            'is_pinned' => $isPinned ? 1 : 0,
            'is_read' => 0,
        ]));

        return [
            'id' => (int) $notice->id,
            'team_id' => $notice->team_id === null ? null : (int) $notice->team_id,
            'sender_team_id' => $notice->sender_team_id === null ? null : (int) $notice->sender_team_id,
            'entity_id' => $notice->entity_id === null ? null : (int) $notice->entity_id,
            'is_pinned' => (int) $notice->is_pinned,
        ];
    }

    private function listing(
        string $recipientColumn,
        int $recipientId,
        array $filters,
        int $page,
        int $limit
    ): array {
        $page = max(1, $page);
        $limit = max(1, min(100, $limit));
        $query = TeamNotice::where($recipientColumn, $recipientId)
            ->whereNull($recipientColumn === 'team_id' ? 'entity_id' : 'team_id');

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

        $paginator = $query->order('is_pinned', 'desc')
            ->order('id', 'desc')
            ->paginate(['list_rows' => $limit, 'page' => $page]);
        $total = $paginator->total();
        $list = $paginator->getCollection()->toArray();
        $page = $paginator->currentPage();
        $limit = $paginator->listRows();

        return ['list' => $list, 'total' => $total, 'page' => $page, 'limit' => $limit];
    }

    private function notice(string $recipientColumn, int $recipientId, int $id): TeamNotice
    {
        $notice = TeamNotice::where($recipientColumn, $recipientId)
            ->whereNull($recipientColumn === 'team_id' ? 'entity_id' : 'team_id')
            ->find($id);
        if (!$notice) {
            throw new HttpException(404, '通知不存在');
        }

        return $notice;
    }

    private function markRead(TeamNotice $notice): void
    {
        if ((int) $notice->is_read !== 1) {
            $notice->save(['is_read' => 1]);
        }
    }

    private function confirmAllFor(string $recipientColumn, int $recipientId): int
    {
        return TeamNotice::where($recipientColumn, $recipientId)
            ->whereNull($recipientColumn === 'team_id' ? 'entity_id' : 'team_id')
            ->where('is_read', 0)
            ->update(['is_read' => 1]);
    }

    private function assertTeam(int $teamId): void
    {
        if ($teamId <= 0) {
            throw new HttpException(422, '目标团队 ID 必须为正整数');
        }
        if (!Team::active()->find($teamId)) {
            throw new HttpException(404, '目标团队不存在或不可用');
        }
    }

    private function canReceive(int $entityId): bool
    {
        $entity = Entity::find($entityId);

        return $entity && $entity->is_valid;
    }
}
