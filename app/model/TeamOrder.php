<?php
declare (strict_types = 1);

namespace app\model;

use app\model\Base;
use app\enum\OrderStatus;

/**
 * TeamOrder 模型 — 订单（不可修改）
 * @mixin \think\Model
 */
class TeamOrder extends Base
{
    protected $type = [
        'id'          => 'integer',
        'team_id'     => 'integer',
        // customer_id 允许为 NULL，不能声明 integer，否则 NULL 会被转换为 0
        // handler_entity_id 允许为 NULL，服务套餐与卡密订单没有购买时接单人
        'product_id'  => 'integer',
        'product_name' => 'string',
        'product_cover_image' => 'string',
        'quantity'    => 'integer',
        'unit_price'  => 'string',
        'total_price' => 'string',
        'cost'        => 'string',
        'handler_cut' => 'string',
        'sender_cut'  => 'string',
        'cs_cut'      => 'string',
        'team_cut'    => 'string',
        'cash'        => 'string',
        'prepaid'     => 'string',
        // trans_id 允许为 NULL，不能声明 integer，否则 NULL 会被转换为 0
        // 'trans_id'    => 'integer|null',
        'status'      => OrderStatus::class,
        'memo'        => 'string',
        'create_time' => 'integer',
        'update_time' => 'integer',
        'delete_time' => 'integer',
    ];

    protected $json = [];

    protected $hidden = ['delete_time'];

    protected $append = [];

    protected $readonly = [
        'team_id',
        'customer_id',
        'handler_entity_id',
        'sender_entity_id',
        'cs_entity_id',
        'product_id',
        'product_name',
        'product_cover_image',
        'quantity',
        'unit_price',
        'total_price',
        'cost',
        'handler_cut',
        'sender_cut',
        'cs_cut',
        'team_cut',
        'cash',
        'prepaid',
        'trans_id',
        'memo',
    ];

    public function team()
    {
        return $this->belongsTo(Team::class, 'team_id');
    }

    public function customer()
    {
        return $this->belongsTo(TeamCustomer::class, 'customer_id');
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

    public function product()
    {
        return $this->belongsTo(TeamProduct::class, 'product_id');
    }

    public function transaction()
    {
        return $this->belongsTo(TeamTransaction::class, 'trans_id');
    }

    public function serviceInstances()
    {
        return $this->hasMany(TeamServiceInstance::class, 'source_order_id');
    }

    public function serviceEntitlements()
    {
        return $this->hasMany(TeamServiceEntitlement::class, 'source_order_id');
    }

    public function quote(TeamProduct $product, int $quantity, array $overrides, bool $usesPrepaid): array
    {
        $bind = [
            'quantity'             => $quantity,
            'price'                => $product->price,
            'cost'                 => $product->cost ?? 0,
            'handler_cut'          => $product->handler_cut,
            'sender_cut'           => $product->sender_cut,
            'cs_cut'               => $product->cs_cut,
            'team_cut'             => $product->team_cut,
            'handler_override'     => $overrides['handler_cut'] ?? 0,
            'sender_override'      => $overrides['sender_cut'] ?? 0,
            'cs_override'          => $overrides['cs_cut'] ?? 0,
            'team_override'        => $overrides['team_cut'] ?? 0,
            'handler_override_set' => array_key_exists('handler_cut', $overrides) && $overrides['handler_cut'] !== null ? 1 : 0,
            'sender_override_set'  => array_key_exists('sender_cut', $overrides) && $overrides['sender_cut'] !== null ? 1 : 0,
            'cs_override_set'      => array_key_exists('cs_cut', $overrides) && $overrides['cs_cut'] !== null ? 1 : 0,
            'team_override_set'    => array_key_exists('team_cut', $overrides) && $overrides['team_cut'] !== null ? 1 : 0,
            'uses_prepaid'         => $usesPrepaid ? 1 : 0,
        ];

        foreach (['price', 'cost', 'handler_cut', 'sender_cut', 'cs_cut', 'team_cut',
                  'handler_override', 'sender_override', 'cs_override', 'team_override'] as $field) {
            if ($bind[$field] !== null
                && !preg_match('/^\d{1,10}(?:\.\d{1,2})?$/D', (string) $bind[$field])) {
                throw new \InvalidArgumentException('订单金额格式无效');
            }
        }

        $sql = <<<'SQL'
SELECT
    calculated.unit_price,
    calculated.total_price,
    calculated.cost,
    calculated.handler_cut,
    calculated.sender_cut,
    calculated.cs_cut,
    COALESCE(
        calculated.team_cut,
        calculated.total_price - calculated.cost - calculated.handler_cut
            - calculated.sender_cut - calculated.cs_cut
    ) AS team_cut,
    CASE WHEN calculated.uses_prepaid = 1 THEN 0.00 ELSE calculated.total_price END AS cash,
    CASE WHEN calculated.uses_prepaid = 1 THEN calculated.total_price ELSE 0.00 END AS prepaid
FROM (
    SELECT
        params.price AS unit_price,
        CAST(params.price * params.quantity AS DECIMAL(12,2)) AS total_price,
        CAST(params.cost * params.quantity AS DECIMAL(12,2)) AS cost,
        CAST(CASE
            WHEN params.handler_override_set = 1 THEN params.handler_override
            WHEN params.handler_cut IS NULL THEN 0
            ELSE params.handler_cut * params.quantity
        END AS DECIMAL(12,2)) AS handler_cut,
        CAST(CASE
            WHEN params.sender_override_set = 1 THEN params.sender_override
            WHEN params.sender_cut IS NULL THEN 0
            ELSE params.sender_cut * params.quantity
        END AS DECIMAL(12,2)) AS sender_cut,
        CAST(CASE
            WHEN params.cs_override_set = 1 THEN params.cs_override
            WHEN params.cs_cut IS NULL THEN 0
            ELSE params.cs_cut * params.quantity
        END AS DECIMAL(12,2)) AS cs_cut,
        CASE
            WHEN params.team_override_set = 1 THEN params.team_override
            WHEN params.team_cut IS NULL THEN NULL
            ELSE CAST(params.team_cut * params.quantity AS DECIMAL(12,2))
        END AS team_cut,
        params.uses_prepaid
    FROM (
        SELECT
            CAST(:quantity AS UNSIGNED) AS quantity,
            CAST(:price AS DECIMAL(12,2)) AS price,
            CAST(:cost AS DECIMAL(12,2)) AS cost,
            CAST(:handler_cut AS DECIMAL(12,2)) AS handler_cut,
            CAST(:sender_cut AS DECIMAL(12,2)) AS sender_cut,
            CAST(:cs_cut AS DECIMAL(12,2)) AS cs_cut,
            CAST(:team_cut AS DECIMAL(12,2)) AS team_cut,
            CAST(:handler_override AS DECIMAL(12,2)) AS handler_override,
            CAST(:sender_override AS DECIMAL(12,2)) AS sender_override,
            CAST(:cs_override AS DECIMAL(12,2)) AS cs_override,
            CAST(:team_override AS DECIMAL(12,2)) AS team_override,
            CAST(:handler_override_set AS UNSIGNED) AS handler_override_set,
            CAST(:sender_override_set AS UNSIGNED) AS sender_override_set,
            CAST(:cs_override_set AS UNSIGNED) AS cs_override_set,
            CAST(:team_override_set AS UNSIGNED) AS team_override_set,
            CAST(:uses_prepaid AS UNSIGNED) AS uses_prepaid
    ) AS params
) AS calculated
SQL;

        $row = $this->db()->getConnection()->query($sql, $bind)[0] ?? [];
        $money = (new TeamTransaction)->normalizeMoney([
            'total_price' => $row['total_price'] ?? 0,
            'cost'        => $row['cost'] ?? 0,
            'cash'        => $row['cash'] ?? 0,
            'prepaid'     => $row['prepaid'] ?? 0,
            'handler_cut' => $row['handler_cut'] ?? 0,
            'sender_cut'  => $row['sender_cut'] ?? 0,
            'cs_cut'      => $row['cs_cut'] ?? 0,
            'team_cut'    => $row['team_cut'] ?? 0,
        ]);

        return array_merge($row, $money);
    }
}
