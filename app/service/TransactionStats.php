<?php
declare(strict_types=1);

namespace app\service;

use app\model\TeamTransaction;
class TransactionStats
{
    /** 收款流水不参与履约金额、成本与分成统计。 */
    private const RECEIPT_TYPES = [3, 5];

    public function personal(int $teamId, int $actorEntityId, int $startTime, int $endTime): array
    {
        $query = static fn(int $from, int $to) => TeamTransaction::where('team_id', $teamId)
            ->where('trans_at', '>=', $from)
            ->where('trans_at', '<', $to)
            ->where(function ($scope) use ($actorEntityId) {
                $scope->where('handler_entity_id', $actorEntityId)
                    ->whereOr('sender_entity_id', $actorEntityId)
                    ->whereOr('cs_entity_id', $actorEntityId);
            });
        $row = $query($startTime, $endTime)->field([
            "SUM(CASE WHEN handler_entity_id = {$actorEntityId} AND type NOT IN (3, 5) THEN 1 ELSE 0 END) as handler_count",
            "SUM(CASE WHEN sender_entity_id = {$actorEntityId} AND type NOT IN (3, 5) THEN 1 ELSE 0 END) as sender_count",
            "SUM(CASE WHEN cs_entity_id = {$actorEntityId} AND type NOT IN (3, 5) THEN 1 ELSE 0 END) as cs_count",
            "COALESCE(SUM(CASE WHEN handler_entity_id = {$actorEntityId} AND type NOT IN (3, 5) THEN total_price ELSE 0 END), 0) as performance_total",
        ])->find();
        $result = $row?->toArray() ?? [];

        $referenceTime = max(1, $endTime - 1);
        $monthStart = strtotime(date('Y-m-01 00:00:00', $referenceTime));
        $monthEnd = strtotime('+1 month', $monthStart);
        $monthly = $query(max($startTime, $monthStart), min($endTime, $monthEnd))->field([
            "COALESCE(SUM(CASE WHEN handler_entity_id = {$actorEntityId} AND type NOT IN (3, 5) THEN total_price ELSE 0 END), 0) as monthly_performance_total",
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

        return $row ? $row->toArray() : [
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
    }

    public function byRole(int $teamId, int $startTime, int $endTime): array
    {
        $build = fn(string $column, string $cutColumn) => TeamTransaction::alias('t')
            ->where('t.team_id', $teamId)
            ->where('t.trans_at', '>=', $startTime)
            ->where('t.trans_at', '<', $endTime)
            ->whereNotIn('t.type', self::RECEIPT_TYPES)
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

        $rows = TeamTransaction::alias('t')
            ->where('t.team_id', $teamId)
            ->where('t.trans_at', '>=', $startTime)
            ->where('t.trans_at', '<', $endTime)
            ->whereNotIn('t.type', self::RECEIPT_TYPES)
            ->group("t.{$column}")
            ->order('amount', 'desc')
            ->field([
                "t.{$column} as entity_id",
                'COUNT(*) as count',
                "COALESCE(SUM(t.{$cutColumn}), 0) as amount",
            ])
            ->select()
            ->toArray();

        return array_values($this->withEntitySummaries($rows));
    }

    public function timeline(int $teamId, int $startTime, int $endTime, string $granularity = 'day'): array
    {
        $format = match ($granularity) {
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
