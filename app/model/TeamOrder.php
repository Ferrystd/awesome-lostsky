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
        'customer_id' => 'integer',
        'handler_id'  => 'integer',
        // sender_id 允许为 NULL，不能声明 integer，否则 NULL 会被转换为 0
        // 'sender_id'   => 'integer|null',
        'product_id'  => 'integer',
        'quantity'    => 'integer',
        'unit_price'  => 'float',
        'total_price' => 'float',
        'cost'        => 'float',
        'handler_cut' => 'float',
        'sender_cut'  => 'float',
        'cs_cut'      => 'float',
        'team_cut'    => 'float',
        'cash'        => 'float',
        'prepaid'     => 'float',
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
        'handler_id',
        'sender_id',
        'product_id',
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
        return $this->belongsTo(TeamMember::class, 'handler_id');
    }

    public function sender()
    {
        return $this->belongsTo(TeamMember::class, 'sender_id');
    }

    public function product()
    {
        return $this->belongsTo(TeamProduct::class, 'product_id');
    }

    public function transaction()
    {
        return $this->belongsTo(TeamTransaction::class, 'trans_id');
    }
}
