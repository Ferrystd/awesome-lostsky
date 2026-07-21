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
            ->join('team_member m', "t.{$column} = m.id", 'LEFT')
            ->join('team_member_profile p', 'm.id = p.member_id', 'LEFT')
            ->where('t.team_id', $teamId)
            ->where('t.trans_at', '>=', $startTime)
            ->where('t.trans_at', '<', $endTime)
            ->group("t.{$column}")
            ->field([
                "t.{$column} as member_id",
                "CASE WHEN t.{$column} = 0 THEN '团队主体' ELSE COALESCE(p.nickname, '') END as nickname",
                'COUNT(*) as count',
                "COALESCE(SUM(t.{$cutColumn}), 0) as amount",
            ])
            ->select()
            ->toArray();

        return [
            'handler' => $build('handler_id', 'handler_cut'),
            'sender'  => $build('sender_id', 'sender_cut'),
            'cs'      => $build('cs_id', 'cs_cut'),
        ];
    }

    public function byMember(int $teamId, int $startTime, int $endTime, string $role): array
    {
        [$column, $cutColumn] = match ($role) {
            'sender'  => ['sender_id', 'sender_cut'],
            'cs'      => ['cs_id', 'cs_cut'],
            default   => ['handler_id', 'handler_cut'],
        };

        return TeamTransaction::alias('t')
            ->join('team_member m', "t.{$column} = m.id", 'LEFT')
            ->join('team_member_profile p', 'm.id = p.member_id', 'LEFT')
            ->where('t.team_id', $teamId)
            ->where('t.trans_at', '>=', $startTime)
            ->where('t.trans_at', '<', $endTime)
            ->group("t.{$column}")
            ->order('amount', 'desc')
            ->field([
                "t.{$column} as member_id",
                "CASE WHEN t.{$column} = 0 THEN '团队主体' ELSE COALESCE(p.nickname, '') END as nickname",
                'COUNT(*) as count',
                "COALESCE(SUM(t.{$cutColumn}), 0) as amount",
            ])
            ->select()
            ->toArray();
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
        return TeamTransaction::alias('t')
            ->join('team_customer c', 't.customer_id = c.id', 'LEFT')
            ->join('team_customer_profile cp', 'c.id = cp.customer_id', 'LEFT')
            ->where('t.team_id', $teamId)
            ->where('t.trans_at', '>=', $startTime)
            ->where('t.trans_at', '<', $endTime)
            ->group('t.customer_id')
            ->order('amount', 'desc')
            ->field([
                't.customer_id',
                'COALESCE(cp.nickname, \'\') as customer_name',
                'COUNT(*) as count',
                'COALESCE(SUM(t.total_price), 0) as amount',
            ])
            ->select()
            ->toArray();
    }
}
