<?php
declare(strict_types=1);

namespace app\service;

use app\model\TeamTransaction;

class TransactionStats
{
    public function summary(int $teamId, int $startTime, int $endTime): array
    {
        $row = TeamTransaction::where('team_id', $teamId)
            ->where('trans_at', '>=', $startTime)
            ->where('trans_at', '<', $endTime)
            ->field([
                'COUNT(*) as total_count',
                'COALESCE(SUM(total_price), 0) as total_price',
                'COALESCE(SUM(cost), 0) as total_cost',
                'COALESCE(SUM(handler_cut + sender_cut + cs_cut + team_cut), 0) as total_cut',
                'COALESCE(SUM(cash), 0) as cash_total',
                'COALESCE(SUM(prepaid), 0) as prepaid_total',
                'COALESCE(AVG(total_price), 0) as avg_price',
            ])
            ->find();

        return $row ? $row->toArray() : [
            'total_count'   => 0,
            'total_price'   => 0,
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
                'COALESCE(SUM(total_price), 0) as amount',
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
                'COALESCE(SUM(t.total_price), 0) as amount',
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
