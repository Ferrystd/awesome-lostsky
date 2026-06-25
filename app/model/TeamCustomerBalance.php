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
        'balance'     => 'float',
        'recharged'   => 'float',
        'spent'       => 'float',
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
}
