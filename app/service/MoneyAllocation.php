<?php
declare(strict_types=1);
namespace app\service;

use think\exception\HttpException;

/** 整数分分配，同时保持各行与各列金额守恒。 */
final class MoneyAllocation
{
    public function split(array $totals, array $weights): array
    {
        $pricing = app(BenefitPackagePricing::class);
        $weightTotal = array_sum($weights);
        if (!$weights || $weightTotal < 1 || min($weights) < 0) throw new HttpException(422, '分配数量无效');
        $components = ['cost', 'handler_cut', 'sender_cut', 'cs_cut', 'team_cut'];
        $total = $pricing->toCents((string) ($totals['total_price'] ?? 0));
        $cents = [];
        foreach ($components as $field) $cents[$field] = $pricing->toCents((string) ($totals[$field] ?? 0));
        if (array_sum($cents) !== $total) throw new HttpException(422, '金额分成不平衡');
        $rows = []; $capacity = []; $before = 0; $cumulative = 0;
        foreach ($weights as $index => $weight) {
            $cumulative += $weight;
            $after = intdiv($total * $cumulative, $weightTotal);
            $capacity[$index] = $after - $before;
            $rows[$index] = ['total_price' => $pricing->fromCents($capacity[$index])];
            $before = $after;
        }
        foreach ($components as $field) {
            $remaining = $cents[$field]; $allocated = []; $priority = [];
            foreach ($weights as $index => $weight) {
                $allocated[$index] = min($capacity[$index], intdiv($cents[$field] * $weight, $weightTotal));
                $capacity[$index] -= $allocated[$index];
                $remaining -= $allocated[$index];
                $priority[$index] = ($cents[$field] * $weight) % $weightTotal;
            }
            arsort($priority, SORT_NUMERIC);
            foreach ($priority as $index => $_) {
                $extra = min($remaining, $capacity[$index]);
                $allocated[$index] += $extra; $capacity[$index] -= $extra; $remaining -= $extra;
            }
            if ($remaining !== 0) throw new HttpException(422, '金额分配失败');
            foreach ($allocated as $index => $value) $rows[$index][$field] = $pricing->fromCents($value);
        }
        return array_values($rows);
    }
}
