<?php
declare (strict_types = 1);

namespace app\model;

use app\model\Base;
use app\enum\LogType;

/**
 * TeamCustomerBalanceLog 模型
 * @mixin \think\Model
 */
class TeamCustomerBalanceLog extends Base
{
    protected $type = [
        'id'            => 'integer',
        'customer_id'   => 'integer',
        'type'          => LogType::class,
        'amount'        => 'float',
        'balance_after' => 'float',
        'trans_id'      => 'integer',
        'create_time'   => 'integer',
        'update_time'   => 'integer',
        'delete_time'   => 'integer',
    ];

    protected $json = [];

    protected $hidden = ['delete_time'];

    protected $append = [];

    protected $readonly = ['customer_id', 'trans_id'];

    public function customer()
    {
        return $this->belongsTo(TeamCustomer::class, 'customer_id');
    }

    public function transaction()
    {
        return $this->belongsTo(TeamTransaction::class, 'trans_id');
    }
}
