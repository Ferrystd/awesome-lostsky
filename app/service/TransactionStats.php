<?php
declare(strict_types=1);

namespace app\service;

use app\enum\LogType;
use app\model\TeamCustomerBalanceLog;
use app\model\TeamTransaction;

class TransactionStats
{
    /** 收款流水不参与履约金额、成本与分成统计。 */
    private const RECEIPT_TYPES = [3, 5];

    public function personal(int $teamId, int $actorEntityId, int $startTime, int $endTime): array
    {
        $senderCount = $this->senderCountExpression('team_transaction');
        $query = static fn(int $from, int $to) => TeamTransaction::where('team_id', $teamId)
            ->where('trans_at', '>=', $from)
            ->where('trans_at', '<', $to)
            ->where(function ($scope) use ($actorEntityId) {
                $scope->where('handler_entity_id', $actorEntityId)
                    ->whereOr('sender_entity_id', $actorEntityId)
                    ->whereOr('cs_entity_id', $actorEntityId);
            });
        $row = $query($startTime, $endTime)->field([
            "SUM(CASE WHEN handler_entity_id = {$actorEntityId} AND type IN (1, 2, 4) THEN 1 ELSE 0 END) as handler_count",
            "SUM(CASE WHEN sender_entity_id = {$actorEntityId} THEN {$senderCount} ELSE 0 END) as sender_count",
            "SUM(CASE WHEN cs_entity_id = {$actorEntityId} AND type NOT IN (3, 5) THEN 1 ELSE 0 END) as cs_count",
            "COALESCE(SUM(CASE WHEN handler_entity_id = {$actorEntityId} AND type IN (1, 2, 4, 6) THEN total_price ELSE 0 END), 0) as performance_total",
        ])->find();
        $result = $row?->toArray() ?? [];

        $referenceTime = max(1, $endTime - 1);
        $monthStart = strtotime(date('Y-m-01 00:00:00', $referenceTime));
        $monthEnd = strtotime('+1 month', $monthStart);
        $monthly = $query(max($startTime, $monthStart), min($endTime, $monthEnd))->field([
            "COALESCE(SUM(CASE WHEN handler_entity_id = {$actorEntityId} AND type IN (1, 2, 4, 6) THEN total_price ELSE 0 END), 0) as monthly_performance_total",
            'COALESCE(SUM(cash + prepaid), 0) as monthly_flow_total',
        ])->find();

        $result = array_merge($result, $monthly?->toArray() ?? []);
        return $result;
    }

    public function summary(int $teamId, int $startTime, int $endTime): array
    {
        $row = TeamTransaction::where('team_id', $teamId)
            ->where('trans_at', '>=', $startTime)
            ->where('trans_at', '<', $endTime)
            ->field([
                'COUNT(*) as total_count',
                'COALESCE(SUM(CASE WHEN type NOT IN (3, 5) THEN total_price ELSE 0 END), 0) as total_price',
                'COALESCE(SUM(cash + prepaid), 0) as receipt_total',
                'COALESCE(SUM(CASE WHEN type NOT IN (3, 5) THEN total_price ELSE 0 END), 0) as performance_total',
                'SUM(CASE WHEN type = 3 THEN 1 ELSE 0 END) as service_receipt_count',
                'SUM(CASE WHEN type = 4 THEN 1 ELSE 0 END) as service_redemption_count',
                'SUM(CASE WHEN type = 5 THEN 1 ELSE 0 END) as service_adjustment_receipt_count',
                'SUM(CASE WHEN type = 6 THEN 1 ELSE 0 END) as service_adjustment_performance_count',
                'COALESCE(SUM(CASE WHEN type NOT IN (3, 5) THEN cost ELSE 0 END), 0) as total_cost',
                'COALESCE(SUM(CASE WHEN type NOT IN (3, 5) THEN handler_cut + sender_cut + cs_cut + team_cut ELSE 0 END), 0) as total_cut',
                'COALESCE(SUM(cash), 0) as cash_total',
                'COALESCE(SUM(prepaid), 0) as prepaid_total',
                'COALESCE(AVG(CASE WHEN type NOT IN (3, 5) THEN total_price ELSE NULL END), 0) as avg_price',
            ])
            ->find();

        $result = $row ? $row->toArray() : [
            'total_count'   => 0,
            'total_price'   => 0,
            'receipt_total' => 0,
            'performance_total' => 0,
            'service_receipt_count' => 0,
            'service_redemption_count' => 0,
            'service_adjustment_receipt_count' => 0,
            'service_adjustment_performance_count' => 0,
            'total_cost'    => 0,
            'total_cut'     => 0,
            'cash_total'    => 0,
            'prepaid_total' => 0,
            'avg_price'     => 0,
        ];

        $result['recharge_total'] = TeamCustomerBalanceLog::alias('l')
            ->join('team_customer c', 'c.id = l.customer_id')
            ->where('c.team_id', $teamId)
            ->where('l.type', LogType::Recharge->value)
            ->where('l.create_time', '>=', $startTime)
            ->where('l.create_time', '<', $endTime)
            ->sum('l.amount') ?: 0;

        return $result;
    }

    public function byRole(int $teamId, int $startTime, int $endTime): array
    {
        $build = fn(string $column, string $cutColumn) => TeamTransaction::alias('t')
            ->where('t.team_id', $teamId)
            ->where('t.trans_at', '>=', $startTime)
            ->where('t.trans_at', '<', $endTime)
            ->whereNotIn('t.type', self::RECEIPT_TYPES)
            ->whereNotNull('t.' . $column)
            ->group("t.{$column}")
            ->field([
                "t.{$column} as entity_id",
                'COUNT(*) as count',
                "COALESCE(SUM(t.{$cutColumn}), 0) as amount",
            ])
            ->select()
            ->toArray();

        return [
            'handler' => $this->withEntitySummaries($build('handler_entity_id', 'handler_cut')),
            'sender'  => $this->withEntitySummaries($build('sender_entity_id', 'sender_cut')),
            'cs'      => $this->withEntitySummaries($build('cs_entity_id', 'cs_cut')),
        ];
    }

    public function byEntity(int $teamId, int $startTime, int $endTime, string $role): array
    {
        [$column, $cutColumn] = match ($role) {
            'sender'  => ['sender_entity_id', 'sender_cut'],
            'cs'      => ['cs_entity_id', 'cs_cut'],
            default   => ['handler_entity_id', 'handler_cut'],
        };

        $query = TeamTransaction::alias('t')
            ->where('t.team_id', $teamId)
            ->where('t.trans_at', '>=', $startTime)
            ->where('t.trans_at', '<', $endTime)
            ->group("t.{$column}")
            ->field([
                "t.{$column} as entity_id",
                'COUNT(*) as count',
                "COALESCE(SUM(t.{$cutColumn}), 0) as amount",
            ]);

        if ($role === 'handler') {
            $query->whereIn('t.type', [1, 2, 4])->order('count', 'desc');
        } else {
            $query->whereNotIn('t.type', self::RECEIPT_TYPES)->order('amount', 'desc');
        }

        $rows = $query
            ->select()
            ->toArray();

        return array_values($this->withEntitySummaries($rows));
    }

    public function timeline(int $teamId, int $startTime, int $endTime, string $granularity = 'day'): array
    {
        $format = match ($granularity) {
            'hour'  => '%Y-%m-%d %H:00',
            'week'  => '%Y-%u',
            'month' => '%Y-%m',
            default => '%Y-%m-%d',
        };

        return TeamTransaction::where('team_id', $teamId)
            ->where('trans_at', '>=', $startTime)
            ->where('trans_at', '<', $endTime)
            ->group("date")
            ->order('date', 'asc')
            ->field([
                "FROM_UNIXTIME(trans_at, '{$format}') as date",
                'COUNT(*) as count',
                'COALESCE(SUM(CASE WHEN type NOT IN (3, 5) THEN total_price ELSE 0 END), 0) as amount',
                'COALESCE(SUM(cash + prepaid), 0) as receipt_amount',
            ])
            ->select()
            ->toArray();
    }

    public function byPerson(
        int $teamId,
        int $startTime,
        int $endTime,
        int $page = 1,
        int $limit = 20,
        string $sortBy = 'handler_performance_total',
        string $sortOrder = 'desc'
    ): array {
        $page = max(1, $page);
        $limit = max(1, min(100, $limit));
        $sortBy = in_array($sortBy, [
            'handler_performance_total',
            'handler_count',
            'sender_count',
            'sender_performance_total',
            'income_total',
        ], true) ? $sortBy : 'handler_performance_total';
        $sortOrder = strtolower($sortOrder) === 'asc' ? 'ASC' : 'DESC';

        $roleRows = [];
        foreach ([
            ['role' => 'handler', 'column' => 'handler_entity_id'],
            ['role' => 'sender', 'column' => 'sender_entity_id'],
            ['role' => 'cs', 'column' => 'cs_entity_id'],
        ] as $role) {
            $name = $role['role'];
            $column = $role['column'];
            $handlerCount = $name === 'handler' ? 'CASE WHEN t.type IN (1, 2, 4) THEN 1 ELSE 0 END' : '0';
            $senderCount = $name === 'sender' ? $this->senderCountExpression('t') : '0';
            $handlerPerformance = $name === 'handler' ? 'CASE WHEN t.type IN (1, 2, 4, 6) THEN t.total_price ELSE 0 END' : '0';
            $senderPerformance = $name === 'sender' ? 'CASE WHEN t.type IN (1, 2, 3, 5) THEN t.cash + t.prepaid ELSE 0 END' : '0';
            $income = match ($name) {
                'handler' => 't.handler_cut',
                'sender' => 't.sender_cut',
                default => 't.cs_cut',
            };
            $roleRows[] = <<<SQL
SELECT
    t.id AS transaction_id,
    t.{$column} AS entity_id,
    {$handlerCount} AS handler_count,
    {$senderCount} AS sender_count,
    {$handlerPerformance} AS handler_performance_total,
    {$senderPerformance} AS sender_performance_total,
    {$income} AS income_total
FROM team_transaction t
WHERE t.team_id = :team_{$name}
  AND t.trans_at >= :start_{$name}
  AND t.trans_at < :end_{$name}
  AND t.delete_time IS NULL
  AND t.{$column} IS NOT NULL
SQL;
        }

        $aggregateSql = 'SELECT entity_id, '
            . 'SUM(handler_count) AS handler_count, '
            . 'SUM(sender_count) AS sender_count, '
            . 'COALESCE(SUM(handler_performance_total), 0) AS handler_performance_total, '
            . 'COALESCE(SUM(sender_performance_total), 0) AS sender_performance_total, '
            . 'COALESCE(SUM(income_total), 0) AS income_total '
            . 'FROM (SELECT transaction_id, entity_id, '
            . 'MAX(handler_count) AS handler_count, '
            . 'MAX(sender_count) AS sender_count, '
            . 'MAX(handler_performance_total) AS handler_performance_total, '
            . 'MAX(sender_performance_total) AS sender_performance_total, '
            . 'SUM(income_total) AS income_total '
            . 'FROM (' . implode(' UNION ALL ', $roleRows) . ') role_rows '
            . 'GROUP BY transaction_id, entity_id) participant_rows '
            . 'GROUP BY entity_id';
        $bind = [];
        foreach (['handler', 'sender', 'cs'] as $name) {
            $bind["team_{$name}"] = $teamId;
            $bind["start_{$name}"] = $startTime;
            $bind["end_{$name}"] = $endTime;
        }

        $connection = app()->db->connect();
        $countRow = $connection->query("SELECT COUNT(*) AS total FROM ({$aggregateSql}) person_stats", $bind)[0] ?? [];
        $offset = ($page - 1) * $limit;
        $rows = $connection->query(
            "{$aggregateSql} ORDER BY {$sortBy} {$sortOrder}, entity_id ASC LIMIT {$limit} OFFSET {$offset}",
            $bind
        );

        return [
            'total' => (int) ($countRow['total'] ?? 0),
            'list' => array_values($this->withEntitySummaries($rows)),
            'page' => $page,
            'limit' => $limit,
        ];
    }

    public function byCustomer(int $teamId, int $startTime, int $endTime): array
    {
        return array_values(TeamTransaction::alias('t')
            ->join('team_customer c', 't.customer_id = c.id', 'LEFT')
            ->join('entity e', "e.entityable_type = 'teamCustomer' AND e.entityable_id = c.id", 'LEFT')
            ->join('team_entity_profile p', 'p.entity_id = e.id', 'LEFT')
            ->where('t.team_id', $teamId)
            ->where('t.trans_at', '>=', $startTime)
            ->where('t.trans_at', '<', $endTime)
            ->group('t.customer_id')
            ->order('amount', 'desc')
            ->field([
                't.customer_id',
                'COALESCE(p.name, \'\') as customer_name',
                'COUNT(*) as count',
                'COALESCE(SUM(CASE WHEN t.type NOT IN (3, 5) THEN t.total_price ELSE 0 END), 0) as amount',
                'COALESCE(SUM(t.cash + t.prepaid), 0) as receipt_amount',
            ])
            ->select()
            ->toArray());
    }

    public function byAssignee(int $teamId, int $startTime, int $endTime): array
    {
        $rows = TeamTransaction::alias('t')
            ->where('t.team_id', $teamId)
            ->where('t.trans_at', '>=', $startTime)
            ->where('t.trans_at', '<', $endTime)
            ->whereNotIn('t.type', self::RECEIPT_TYPES)
            ->whereNotNull('t.customer_id')
            ->whereNotNull('t.sender_entity_id')
            ->group('t.sender_entity_id')
            ->order('total_price', 'desc')
            ->field([
                't.sender_entity_id as entity_id',
                'COUNT(DISTINCT t.customer_id) as customer_count',
                'COUNT(*) as transaction_count',
                'COALESCE(SUM(t.total_price), 0) as total_price',
                'COALESCE(SUM(t.cost), 0) as total_cost',
                'COALESCE(SUM(t.team_cut), 0) as team_cut',
            ])
            ->select()
            ->toArray();

        return array_values($this->withEntitySummaries($rows));
    }

    private function senderCountExpression(string $alias): string
    {
        return "CASE WHEN {$alias}.type IN (1, 2, 3) AND NOT EXISTS (
            SELECT 1 FROM team_order counted_order
            WHERE counted_order.team_id = {$alias}.team_id
              AND counted_order.delete_time IS NULL
              AND ((counted_order.source_claim_id IS NOT NULL AND counted_order.trans_id = {$alias}.id)
                OR (counted_order.trans_id <> {$alias}.id AND JSON_CONTAINS(
                    COALESCE(JSON_EXTRACT(counted_order.fulfillment_snapshot, '$.transaction_ids'), '[]'),
                    JSON_ARRAY({$alias}.id))))
        ) THEN 1 ELSE 0 END";
    }

    private function withEntitySummaries(array $rows): array
    {
        foreach ($rows as &$row) {
            $entityId = (int) ($row['entity_id'] ?? 0);
            $summary = $entityId > 0
                ? app(ChatActor::class)->summaryEntity($entityId)
                : ['slug' => null, 'name' => '未知人员', 'avatar' => null];
            $row = array_merge($row, [
                'slug' => $summary['slug'],
                'name' => $summary['name'],
                'avatar' => $summary['avatar'],
            ]);
        }
        unset($row);

        return $rows;
    }
}
