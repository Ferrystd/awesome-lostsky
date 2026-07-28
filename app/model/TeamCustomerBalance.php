<?php
declare (strict_types = 1);

namespace app\model;

use app\model\Base;

/**
 * TeamCustomerBalance 模型
 * @mixin \think\Model
 */
class TeamCustomerBalance extends Base
{
    protected $type = [
        'id'          => 'integer',
        'customer_id' => 'integer',
        'balance'     => 'string',
        'recharged'   => 'string',
        'spent'       => 'string',
        'create_time' => 'integer',
        'update_time' => 'integer',
        'delete_time' => 'integer',
    ];

    protected $json = [];

    protected $hidden = ['delete_time'];

    protected $append = [];

    protected $readonly = ['customer_id'];

    public function customer()
    {
        return $this->belongsTo(TeamCustomer::class, 'customer_id');
    }

    public function normalizePositiveAmount(mixed $value): string
    {
        if (is_int($value)) {
            $value = (string) $value;
        } elseif (is_float($value) && is_finite($value)) {
            $value = rtrim(rtrim(number_format($value, 2, '.', ''), '0'), '.');
        }

        if (!is_string($value) || !preg_match('/^\d{1,10}(?:\.\d{1,2})?$/D', $value)) {
            throw new \InvalidArgumentException('金额格式无效');
        }

        $row = $this->db()->getConnection()->query(
            'SELECT CAST(:amount AS DECIMAL(12,2)) AS amount, '
            . '(CAST(:positive_amount AS DECIMAL(12,2)) > 0) AS positive',
            ['amount' => $value, 'positive_amount' => $value]
        )[0];
        if ((int) $row['positive'] !== 1) {
            throw new \InvalidArgumentException('金额必须大于零');
        }

        return $row['amount'];
    }

    public function consume(int $customerId, string $amount): ?self
    {
        $amount = $this->normalizePositiveAmount($amount);
        $affected = self::where('customer_id', $customerId)
            ->where('balance', '>=', $amount)
            ->exp('balance', "balance - CAST('{$amount}' AS DECIMAL(12,2))")
            ->exp('spent', "spent + CAST('{$amount}' AS DECIMAL(12,2))")
            ->update();

        return $affected === 1 ? self::where('customer_id', $customerId)->find() : null;
    }

    public function refund(int $customerId, string $amount): ?self
    {
        $amount = $this->normalizePositiveAmount($amount);
        $affected = self::where('customer_id', $customerId)
            ->where('spent', '>=', $amount)
            ->exp('balance', "balance + CAST('{$amount}' AS DECIMAL(12,2))")
            ->exp('spent', "spent - CAST('{$amount}' AS DECIMAL(12,2))")
            ->update();

        return $affected === 1 ? self::where('customer_id', $customerId)->find() : null;
    }

    public function recharge(int $customerId, string $amount): ?self
    {
        $amount = $this->normalizePositiveAmount($amount);
        $affected = self::where('customer_id', $customerId)
            ->exp('balance', "balance + CAST('{$amount}' AS DECIMAL(12,2))")
            ->exp('recharged', "recharged + CAST('{$amount}' AS DECIMAL(12,2))")
            ->update();

        return $affected === 1 ? self::where('customer_id', $customerId)->find() : null;
    }

    public function negative(string $amount): string
    {
        return $this->db()->getConnection()->query(
            'SELECT CAST(-CAST(:amount AS DECIMAL(12,2)) AS DECIMAL(12,2)) AS amount',
            ['amount' => $amount]
        )[0]['amount'];
    }
}
