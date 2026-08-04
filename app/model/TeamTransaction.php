<?php
declare (strict_types = 1);

namespace app\model;

use app\model\Base;
use app\enum\TransactionType;

/**
 * TeamTransaction 模型
 * @mixin \think\Model
 */
class TeamTransaction extends Base
{
    private const MONEY_FIELDS = [
        'total_price',
        'cost',
        'cash',
        'prepaid',
        'service_credit',
        'handler_cut',
        'sender_cut',
        'cs_cut',
        'team_cut',
    ];

    protected $type = [
        'id'          => 'integer',
        'team_id'     => 'integer',
        // handler_entity_id 允许为 NULL，服务包收款没有接单人
        // customer_id 允许为 NULL，不能声明 integer，否则 NULL 会被转换为 0
        // 'customer_id' => 'integer|null',
        'type'        => TransactionType::class,
        'total_price' => 'string',
        'cost'        => 'string',
        'cash'        => 'string',
        'prepaid'     => 'string',
        'service_credit' => 'string',
        'handler_cut' => 'string',
        'sender_cut'  => 'string',
        'cs_cut'      => 'string',
        'team_cut'    => 'string',
        'trans_at'    => 'integer',
        'create_time' => 'integer',
        'update_time' => 'integer',
        'delete_time' => 'integer',
    ];

    protected $json = [];

    protected $hidden = ['delete_time'];

    protected $append = [];

    protected $readonly = ['team_id', 'handler_entity_id'];

    public function team()
    {
        return $this->belongsTo(Team::class, 'team_id');
    }

    public function handler()
    {
        return $this->belongsTo(Entity::class, 'handler_entity_id');
    }

    public function sender()
    {
        return $this->belongsTo(Entity::class, 'sender_entity_id');
    }

    public function cs()
    {
        return $this->belongsTo(Entity::class, 'cs_entity_id');
    }

    public function customer()
    {
        return $this->belongsTo(TeamCustomer::class, 'customer_id');
    }

    public function balanceLogs()
    {
        return $this->hasMany(TeamCustomerBalanceLog::class, 'trans_id');
    }

    public function serviceInstance()
    {
        return $this->belongsTo(TeamServiceInstance::class, 'service_instance_id');
    }

    public function normalizeMoney(array $values): array
    {
        $bind = [];
        $columns = [];

        foreach (self::MONEY_FIELDS as $field) {
            $value = $this->decimalInput($values[$field] ?? 0);
            $bind[$field] = $value;
            $columns[] = "CAST(:{$field} AS DECIMAL(12,2)) AS `{$field}`";
        }

        $sql = 'SELECT money.*, '
            . '(money.total_price = money.cash + money.prepaid + money.service_credit) AS payment_balanced, '
            . '(money.total_price = money.cost + money.handler_cut + money.sender_cut + money.cs_cut + money.team_cut) AS distribution_balanced, '
            . '(money.prepaid > 0) AS prepaid_positive '
            . 'FROM (SELECT ' . implode(', ', $columns) . ') AS money';
        $row = $this->db()->getConnection()->query($sql, $bind)[0] ?? [];

        if ((int) ($row['payment_balanced'] ?? 0) !== 1
            || (int) ($row['distribution_balanced'] ?? 0) !== 1) {
            throw new \InvalidArgumentException('金额不平衡');
        }

        unset($row['payment_balanced'], $row['distribution_balanced'], $row['prepaid_positive']);
        return $row;
    }

    public function prepaidChange(mixed $oldAmount, mixed $newAmount): array
    {
        $old = $this->decimalInput($oldAmount);
        $new = $this->decimalInput($newAmount);
        $sql = <<<'SQL'
SELECT
    CAST(ABS(amounts.new_amount - amounts.old_amount) AS DECIMAL(12,2)) AS amount,
    SIGN(amounts.new_amount - amounts.old_amount) AS direction
FROM (
    SELECT
        CAST(:old_amount AS DECIMAL(12,2)) AS old_amount,
        CAST(:new_amount AS DECIMAL(12,2)) AS new_amount
) AS amounts
SQL;

        return $this->db()->getConnection()->query($sql, [
            'old_amount' => $old,
            'new_amount' => $new,
        ])[0];
    }

    private function decimalInput(mixed $value): string
    {
        if (is_int($value)) {
            $value = (string) $value;
        } elseif (is_float($value) && is_finite($value)) {
            $value = rtrim(rtrim(number_format($value, 2, '.', ''), '0'), '.');
        }

        if (!is_string($value) || !preg_match('/^\d{1,10}(?:\.\d{1,2})?$/D', $value)) {
            throw new \InvalidArgumentException('金额格式无效');
        }

        return $value;
    }
}
