<?php
declare (strict_types = 1);

namespace app\model;

use app\model\Base;

/**
 * TeamCustomer 模型
 * @mixin \think\Model
 */
class TeamCustomer extends Base
{
    protected $type = [
        'id'          => 'integer',
        'team_id'     => 'integer',
        'user_id'     => 'integer',
        'is_blocked'  => 'integer',
        'create_time' => 'integer',
        'update_time' => 'integer',
        'delete_time' => 'integer',
    ];

    protected $json = [];

    protected $hidden = ['delete_time'];

    protected $append = [];

    protected $readonly = ['team_id', 'user_id'];

    public function team()
    {
        return $this->belongsTo(Team::class, 'team_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function balance()
    {
        return $this->hasOne(TeamCustomerBalance::class, 'customer_id');
    }

    public function balanceLogs()
    {
        return $this->hasMany(TeamCustomerBalanceLog::class, 'customer_id');
    }

    public function transactions()
    {
        return $this->hasMany(TeamTransaction::class, 'customer_id');
    }

    public function senders()
    {
        return $this->hasMany(TeamCustomerSender::class, 'customer_id');
    }

    public function profile()
    {
        return $this->hasOne(TeamCustomerProfile::class, 'customer_id')
            ->bind(['name', 'memo']);
    }
}
