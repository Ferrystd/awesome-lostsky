<?php
declare (strict_types = 1);

namespace app\model;

use app\model\Base;

/**
 * TeamCustomerSender 模型 客户-发单人绑定
 * @mixin \think\Model
 */
class TeamCustomerSender extends Base
{
    protected $type = [
        'id'          => 'integer',
        'team_id'     => 'integer',
        'customer_id' => 'integer',
        'member_id'   => 'integer',
        'create_time' => 'integer',
        'update_time' => 'integer',
        'delete_time' => 'integer',
    ];

    protected $json = [];

    protected $hidden = ['delete_time'];

    protected $append = [];

    protected $readonly = ['team_id', 'customer_id', 'member_id'];

    public function team()
    {
        return $this->belongsTo(Team::class, 'team_id');
    }

    public function customer()
    {
        return $this->belongsTo(TeamCustomer::class, 'customer_id');
    }

    public function member()
    {
        return $this->belongsTo(TeamMember::class, 'member_id');
    }

    public function scopeSender($query, int $memberId, int $customerId)
    {
        return $query->where('member_id', $memberId)->where('customer_id', $customerId);
    }
}
