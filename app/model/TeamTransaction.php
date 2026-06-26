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
    protected $type = [
        'id'          => 'integer',
        'team_id'     => 'integer',
        'handler_id'  => 'integer',
        'sender_id'   => null,  // integer|null
        'cs_id'       => null,  // integer|null
        'customer_id' => null,  // integer|null
        'type'        => TransactionType::class,
        'total_price' => 'float',
        'cost'        => 'float',
        'cash'        => 'float',
        'prepaid'     => 'float',
        'handler_cut' => 'float',
        'sender_cut'  => 'float',
        'cs_cut'      => 'float',
        'team_cut'    => 'float',
        'trans_at'    => 'integer',
        'create_time' => 'integer',
        'update_time' => 'integer',
        'delete_time' => 'integer',
    ];

    protected $json = [];

    protected $hidden = ['delete_time'];

    protected $append = [];

    protected $readonly = ['team_id', 'handler_id'];

    public function team()
    {
        return $this->belongsTo(Team::class, 'team_id');
    }

    public function handler()
    {
        return $this->belongsTo(TeamMember::class, 'handler_id');
    }

    public function sender()
    {
        return $this->belongsTo(TeamMember::class, 'sender_id');
    }

    public function cs()
    {
        return $this->belongsTo(TeamMember::class, 'cs_id');
    }

    public function customer()
    {
        return $this->belongsTo(TeamCustomer::class, 'customer_id');
    }

    public function balanceLogs()
    {
        return $this->hasMany(TeamCustomerBalanceLog::class, 'trans_id');
    }
}
