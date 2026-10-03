<?php
declare(strict_types=1);

namespace app\service;

use think\db\ConnectionInterface;
use think\facade\Db;

final class ChatMigration
{
    private const TABLES = [
        'chat_conversation', 'chat_participant', 'chat_message', 'chat_event_outbox',
        'chat_webhook_delivery', 'chat_conversation_alias', 'chat_entity_block', 'team_role_permission',
    ];

    public function __construct(private ?ConnectionInterface $db = null)
    {
        $this->db ??= Db::connect();
    }

    public function inspect(): array
    {
        $this->assertBaseTables();
        $schema = $this->schemaStatus();
        $conversations = $this->directConversations();
        $sets = $this->directSets($conversations);
        $invalid = array_values(array_map(
            static fn (array $row): int => (int) $row['id'],
            array_filter($conversations, static fn (array $row): bool => !(bool) $row['is_temporary']
                && count($row['entity_ids']) !== 2)
        ));
        $duplicateSets = array_filter($sets, static fn (array $rows): bool => count($rows) > 1);
        $inactiveParticipants = $this->inactiveDirectParticipants();
        $snapshotEvents = $this->eventsNeedingRecipientSnapshot();

        return [
            'mode' => 'dry-run',
            'schema_ready' => $schema['missing'] === [],
            'schema_missing' => $schema['missing'],
            'direct_conversations' => count($conversations),
            'permanent_direct_conversations' => count(array_filter(
                $conversations,
                static fn (array $row): bool => !(bool) $row['is_temporary']
            )),
            'temporary_direct_conversations' => count(array_filter(
                $conversations,
                static fn (array $row): bool => (bool) $row['is_temporary']
            )),
            'invalid_permanent_direct_ids' => $invalid,
            'inactive_direct_participants' => $inactiveParticipants,
            'duplicate_direct_sets' => count($duplicateSets),
            'conversations_to_merge' => array_sum(array_map(
                static fn (array $rows): int => count($rows) - 1,
                $duplicateSets
            )),
            'aliases_to_create' => $this->aliasesToCreate($duplicateSets),
            'direct_team_values_to_clear' => $this->countDirectTeamValues(),
            'groups_without_owner_team' => $this->invalidGroupOwnerCount(),
            'legacy_chat_permissions_to_delete' => (int) $this->db->table('team_role_permission')
                ->whereRaw($this->legacyPermissionWhere())->count(),
            'outbox_recipient_snapshots_to_backfill' => count($snapshotEvents),
        ];
    }

    public function apply(): array
    {
        $before = $this->inspect();
        $this->assertSchema();
        if ($before['invalid_permanent_direct_ids']) {
            throw new \RuntimeException(
                '存在参与实体不是恰好两个的永久单聊：' . implode(',', $before['invalid_permanent_direct_ids'])
            );
        }
        if ($before['groups_without_owner_team'] > 0) {
            throw new \RuntimeException('存在缺少所属团队的群聊，拒绝迁移');
        }

        $snapshotsBackfilled = 0;
        $this->db->transaction(function () use (&$snapshotsBackfilled): void {
            $sets = $this->directSets($this->directConversations());
            foreach ($sets as $entityIds => $rows) {
                [$left, $right] = array_map('intval', explode(':', $entityIds));
                $this->mergePermanentDirectSet($rows, $left, $right);
            }
            $this->normalizeDirectReferences();
            $this->rewriteDirectOutboxPayloads();
            $snapshotsBackfilled = $this->backfillOutboxRecipientSnapshots();
            $this->db->table('team_role_permission')->whereRaw($this->legacyPermissionWhere())->delete();
        });

        $after = $this->inspect();
        $after['mode'] = 'apply';
        $after['applied'] = [
            'conversations_merged' => $before['conversations_to_merge'],
            'aliases_created' => $before['aliases_to_create'],
            'legacy_chat_permissions_deleted' => $before['legacy_chat_permissions_to_delete'],
            'outbox_recipient_snapshots_backfilled' => $snapshotsBackfilled,
        ];
        return $after;
    }

    private function mergePermanentDirectSet(array $rows, int $leftEntityId, int $rightEntityId): void
    {
        $rows = $this->canonicalFirst($rows);
        $canonical = $rows[0];
        $canonicalId = (int) $canonical['id'];
        $allIds = array_map(static fn (array $row): int => (int) $row['id'], $rows);
        $losers = array_slice($rows, 1);

        foreach ($losers as $loser) {
            $existing = $this->db->table('chat_conversation_alias')
                ->where('alias_uuid', $loser['uuid'])->find();
            if ($existing && (int) $existing['conversation_id'] !== $canonicalId) {
                throw new \RuntimeException("会话别名 {$loser['uuid']} 已指向其他会话");
            }
            if (!$existing) {
                $this->db->table('chat_conversation_alias')->insert([
                    'alias_uuid' => $loser['uuid'], 'conversation_id' => $canonicalId,
                    'create_time' => time(), 'update_time' => time(),
                ]);
            }
        }

        $this->mergeParticipants($allIds, $canonicalId, [$leftEntityId, $rightEntityId]);
        if ($losers) {
            $loserIds = array_map(static fn (array $row): int => (int) $row['id'], $losers);
            $this->db->table('chat_conversation')->whereIn('id', $loserIds)->update(['direct_key' => null]);
            $this->db->table('chat_message')->whereIn('conversation_id', $loserIds)
                ->update(['conversation_id' => $canonicalId, 'team_id' => null]);
            $this->db->table('chat_event_outbox')->where('aggregate_type', 'conversation')
                ->whereIn('aggregate_id', $loserIds)->update(['aggregate_id' => $canonicalId, 'team_id' => null]);
            $this->db->table('chat_conversation')->whereIn('id', $loserIds)->delete();
        }

        $open = array_filter($rows, static fn (array $row): bool => $row['closed_at'] === null);
        $active = array_filter($rows, static fn (array $row): bool => $row['delete_time'] === null);
        $this->db->table('chat_conversation')->where('id', $canonicalId)->update([
            'team_id' => null,
            'direct_key' => self::directKey($leftEntityId, $rightEntityId),
            'closed_at' => $open ? null : max(array_column($rows, 'closed_at')),
            'delete_time' => $active ? null : max(array_column($rows, 'delete_time')),
            'expires_at' => in_array(null, array_column($rows, 'expires_at'), true)
                ? null : max(array_column($rows, 'expires_at')),
            'create_time' => min(array_column($rows, 'create_time')),
            'update_time' => max(array_column($rows, 'update_time')),
        ]);
        $this->recomputeLastMessage($canonicalId);
    }

    private function mergeParticipants(array $conversationIds, int $canonicalId, array $entityIds): void
    {
        foreach ($entityIds as $entityId) {
            $rows = $this->db->table('chat_participant')
                ->whereIn('conversation_id', $conversationIds)->where('entity_id', $entityId)
                ->order('id')->select()->toArray();
            if (!$rows) {
                throw new \RuntimeException("永久单聊缺少实体 {$entityId} 的参与记录");
            }
            $keeper = current(array_filter(
                $rows,
                static fn (array $row): bool => (int) $row['conversation_id'] === $canonicalId
            )) ?: $rows[0];
            $keeperId = (int) $keeper['id'];
            $dropIds = array_values(array_filter(
                array_map(static fn (array $row): int => (int) $row['id'], $rows),
                static fn (int $id): bool => $id !== $keeperId
            ));
            if ($dropIds) {
                $this->db->table('chat_participant')->whereIn('id', $dropIds)->delete();
            }
            $readIds = array_filter(array_map(
                static fn (array $row): ?int => $row['last_read_message_id'] === null
                    ? null : (int) $row['last_read_message_id'],
                $rows
            ));
            $lastRead = null;
            if ($readIds) {
                $lastRead = $this->db->table('chat_message')->whereIn('conversation_id', $conversationIds)
                    ->whereIn('id', $readIds)->whereNull('delete_time')->max('id');
                $lastRead = $lastRead === null ? null : (int) $lastRead;
            }
            usort($rows, static function (array $left, array $right): int {
                $rank = static function (array $row): int {
                    if ($row['delete_time'] === null && $row['left_at'] === null && $row['status'] === 'active') {
                        return 0;
                    }
                    if ($row['delete_time'] === null && $row['left_at'] === null && $row['status'] === 'pending') {
                        return 1;
                    }
                    return $row['delete_time'] === null ? 2 : 3;
                };
                return [$rank($left), -(int) $left['update_time'], -(int) $left['id']]
                    <=> [$rank($right), -(int) $right['update_time'], -(int) $right['id']];
            });
            $membership = $rows[0];
            $this->db->table('chat_participant')->where('id', $keeperId)->update([
                'team_id' => null, 'conversation_id' => $canonicalId,
                'status' => $membership['status'],
                'invited_by_entity_id' => $membership['invited_by_entity_id'],
                'invited_at' => $membership['invited_at'],
                'responded_at' => $membership['responded_at'],
                'joined_at' => min(array_column($rows, 'joined_at')),
                'left_at' => $membership['left_at'],
                'last_read_message_id' => $lastRead,
                'create_time' => min(array_column($rows, 'create_time')),
                'update_time' => max(array_column($rows, 'update_time')),
                'delete_time' => $membership['delete_time'],
            ]);
        }
    }

    private function normalizeDirectReferences(): void
    {
        $directIds = $this->db->table('chat_conversation')->where('kind', 'direct')->column('id');
        if (!$directIds) {
            return;
        }
        $this->db->table('chat_conversation')->whereIn('id', $directIds)->update(['team_id' => null]);
        $this->db->table('chat_conversation')->whereIn('id', $directIds)->where('is_temporary', 1)
            ->update(['direct_key' => null]);
        $this->db->table('chat_participant')->whereIn('conversation_id', $directIds)->update(['team_id' => null]);
        $this->db->table('chat_message')->whereIn('conversation_id', $directIds)->update(['team_id' => null]);

        $messageIds = $this->db->table('chat_message')->whereIn('conversation_id', $directIds)->column('id');
        $this->db->table('chat_event_outbox')->where('aggregate_type', 'conversation')
            ->whereIn('aggregate_id', $directIds)->update(['team_id' => null]);
        if ($messageIds) {
            $this->db->table('chat_event_outbox')->where('aggregate_type', 'message')
                ->whereIn('aggregate_id', $messageIds)->update(['team_id' => null]);
        }
        foreach ($directIds as $conversationId) {
            $this->recomputeLastMessage((int) $conversationId);
        }
    }

    private function recomputeLastMessage(int $conversationId): void
    {
        $last = $this->db->table('chat_message')->where('conversation_id', $conversationId)
            ->whereNull('delete_time')->order('create_time', 'desc')->order('id', 'desc')->find();
        $this->db->table('chat_conversation')->where('id', $conversationId)->update([
            'last_message_id' => $last ? (int) $last['id'] : null,
            'last_message_at' => $last ? (int) $last['create_time'] : null,
        ]);
    }

    private function rewriteDirectOutboxPayloads(): void
    {
        $rows = $this->db->query(
            "SELECT o.id,o.payload,c.uuid FROM chat_event_outbox o "
            . "LEFT JOIN chat_message m ON o.aggregate_type='message' AND m.id=o.aggregate_id "
            . "JOIN chat_conversation c ON (o.aggregate_type='conversation' AND c.id=o.aggregate_id) "
            . "OR (o.aggregate_type='message' AND c.id=m.conversation_id) WHERE c.kind='direct'"
        );
        foreach ($rows as $row) {
            $payload = is_array($row['payload']) ? $row['payload'] : json_decode((string) $row['payload'], true);
            if (!is_array($payload) || !array_key_exists('conversation', $payload)) {
                continue;
            }
            $payload['conversation'] = $row['uuid'];
            $this->db->table('chat_event_outbox')->where('id', $row['id'])->update([
                'payload' => json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR),
            ]);
        }
    }

    private function backfillOutboxRecipientSnapshots(): int
    {
        $count = 0;
        foreach ($this->eventsNeedingRecipientSnapshot() as $event) {
            $recipients = $this->db->table('chat_participant')
                ->where('conversation_id', $event['conversation_id'])
                ->where('status', 'active')->whereNull('left_at')->whereNull('delete_time')
                ->where('joined_at', '<=', $event['create_time'])->order('entity_id')->column('entity_id');
            $payload = $event['payload'];
            $payload['recipient_entity_ids'] = array_values(array_unique(array_map('intval', $recipients)));
            $this->db->table('chat_event_outbox')->where('id', $event['id'])->update([
                'payload' => json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR),
            ]);
            $count++;
        }
        return $count;
    }

    private function eventsNeedingRecipientSnapshot(): array
    {
        $rows = $this->db->query(
            "SELECT DISTINCT o.id,o.payload,o.create_time,c.id AS conversation_id FROM chat_event_outbox o "
            . "LEFT JOIN chat_webhook_delivery d ON d.outbox_id=o.id AND d.status='pending' AND d.delete_time IS NULL "
            . "LEFT JOIN chat_message m ON o.aggregate_type='message' AND m.id=o.aggregate_id "
            . "JOIN chat_conversation c ON (o.aggregate_type='conversation' AND c.id=o.aggregate_id) "
            . "OR (o.aggregate_type='message' AND c.id=m.conversation_id) "
            . "WHERE o.published_at IS NULL OR d.id IS NOT NULL ORDER BY o.id"
        );
        $events = [];
        foreach ($rows as $row) {
            $payload = is_array($row['payload']) ? $row['payload'] : json_decode((string) $row['payload'], true);
            if (!is_array($payload) || array_key_exists('recipient_entity_ids', $payload)) {
                continue;
            }
            $events[] = [
                'id' => (int) $row['id'], 'payload' => $payload,
                'create_time' => (int) $row['create_time'],
                'conversation_id' => (int) $row['conversation_id'],
            ];
        }
        return $events;
    }

    private function directConversations(): array
    {
        $rows = $this->db->table('chat_conversation')->where('kind', 'direct')->order('id')->select()->toArray();
        foreach ($rows as &$row) {
            $row['entity_ids'] = array_values(array_unique(array_map(
                'intval',
                $this->db->table('chat_participant')->where('conversation_id', $row['id'])
                    ->column('entity_id')
            )));
            sort($row['entity_ids']);
        }
        unset($row);
        return $rows;
    }

    private function directSets(array $conversations): array
    {
        $sets = [];
        foreach ($conversations as $conversation) {
            if ((bool) $conversation['is_temporary'] || count($conversation['entity_ids']) !== 2) {
                continue;
            }
            $sets[implode(':', $conversation['entity_ids'])][] = $conversation;
        }
        return $sets;
    }

    private function aliasesToCreate(array $sets): int
    {
        $uuids = [];
        foreach ($sets as $rows) {
            $rows = $this->canonicalFirst($rows);
            foreach (array_slice($rows, 1) as $row) {
                $uuids[] = $row['uuid'];
            }
        }
        if (!$uuids) {
            return 0;
        }
        if (!$this->tableExists('chat_conversation_alias')) {
            return count($uuids);
        }
        return count($uuids) - (int) $this->db->table('chat_conversation_alias')
            ->whereIn('alias_uuid', $uuids)->count();
    }

    private function countDirectTeamValues(): int
    {
        $conversationIds = $this->db->table('chat_conversation')->where('kind', 'direct')->column('id');
        if (!$conversationIds) {
            return 0;
        }
        return (int) $this->db->table('chat_conversation')->whereIn('id', $conversationIds)->whereNotNull('team_id')->count()
            + (int) $this->db->table('chat_participant')->whereIn('conversation_id', $conversationIds)->whereNotNull('team_id')->count()
            + (int) $this->db->table('chat_message')->whereIn('conversation_id', $conversationIds)->whereNotNull('team_id')->count();
    }

    private function assertSchema(): void
    {
        $status = $this->schemaStatus();
        if ($status['missing']) {
            throw new \RuntimeException('请先执行结构补丁，缺少：' . implode(',', $status['missing']));
        }
    }

    private function assertBaseTables(): void
    {
        foreach (['team', 'entity', 'chat_conversation', 'chat_participant', 'chat_message', 'chat_event_outbox', 'team_role_permission'] as $table) {
            if (!$this->tableExists($table)) {
                throw new \RuntimeException("缺少统计所需数据表 {$table}");
            }
        }
    }

    private function schemaStatus(): array
    {
        $missing = [];
        foreach (self::TABLES as $table) {
            if (!$this->tableExists($table)) {
                $missing[] = "table:{$table}";
            }
        }
        $required = [
            'chat_participant' => ['status', 'invited_by_entity_id', 'invited_at', 'responded_at'],
            'chat_conversation_alias' => ['alias_uuid', 'conversation_id'],
        ];
        foreach ($required as $table => $columns) {
            if (!$this->tableExists($table)) {
                continue;
            }
            $actual = array_column($this->db->query("SHOW COLUMNS FROM `{$table}`"), 'Field');
            foreach (array_diff($columns, $actual) as $column) {
                $missing[] = "column:{$table}.{$column}";
            }
        }
        foreach (['chat_conversation', 'chat_participant', 'chat_message', 'chat_event_outbox'] as $table) {
            if (!$this->tableExists($table)) {
                continue;
            }
            $columns = $this->db->query("SHOW COLUMNS FROM `{$table}`");
            $team = current(array_filter($columns, static fn (array $column): bool => $column['Field'] === 'team_id'));
            if (!$team || strtoupper((string) $team['Null']) !== 'YES') {
                $missing[] = "nullable:{$table}.team_id";
            }
        }
        return ['missing' => $missing];
    }

    private function invalidGroupOwnerCount(): int
    {
        $row = $this->db->query(
            "SELECT COUNT(*) AS total FROM chat_conversation c "
            . "LEFT JOIN team t ON t.id=c.team_id AND t.delete_time IS NULL "
            . "WHERE c.kind='group' AND (c.team_id IS NULL OR c.team_id=0 OR t.id IS NULL)"
        );
        return (int) ($row[0]['total'] ?? 0);
    }

    private function inactiveDirectParticipants(): array
    {
        $rows = $this->db->query(
            "SELECT DISTINCT p.conversation_id,p.entity_id FROM chat_participant p "
            . "JOIN chat_conversation c ON c.id=p.conversation_id AND c.kind='direct' "
            . "LEFT JOIN entity e ON e.id=p.entity_id "
            . "WHERE e.id IS NULL OR e.delete_time IS NOT NULL ORDER BY p.conversation_id,p.entity_id"
        );
        return array_map(static fn (array $row): array => [
            'conversation_id' => (int) $row['conversation_id'],
            'entity_id' => (int) $row['entity_id'],
        ], $rows);
    }

    private function canonicalFirst(array $rows): array
    {
        usort($rows, static function (array $left, array $right): int {
            return [
                $left['delete_time'] === null ? 0 : 1,
                $left['closed_at'] === null ? 0 : 1,
                (int) $left['create_time'],
                (int) $left['id'],
            ] <=> [
                $right['delete_time'] === null ? 0 : 1,
                $right['closed_at'] === null ? 0 : 1,
                (int) $right['create_time'],
                (int) $right['id'],
            ];
        });
        return $rows;
    }

    private function tableExists(string $table): bool
    {
        try {
            $this->db->query("SHOW COLUMNS FROM `{$table}`");
            return true;
        } catch (\Throwable) {
            return false;
        }
    }

    private function legacyPermissionWhere(): string
    {
        return "permission_key IN ('chat.conversation.create','chat.temporary.create','chat.message.moderate','chat.virtual') "
            . "OR permission_key LIKE 'chat.virtual.%'";
    }

    public static function directKey(int $leftEntityId, int $rightEntityId): string
    {
        $ids = [$leftEntityId, $rightEntityId];
        sort($ids, SORT_NUMERIC);
        return hash('sha256', implode('|', $ids));
    }
}
