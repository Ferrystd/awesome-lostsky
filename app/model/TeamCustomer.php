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

    protected $append = ['is_valid', 'is_searchable'];

    protected $readonly = ['team_id', 'user_id'];

    public function team()
    {
        return $this->belongsTo(Team::class, 'team_id');
    }

    public function scopeInTeam($query, int $teamId)
    {
        return $query->where('team_id', $teamId);
    }

    public function scopeOfUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
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

    public function orders()
    {
        return $this->hasMany(TeamOrder::class, 'customer_id');
    }

    public function senders()
    {
        return $this->hasMany(TeamCustomerSender::class, 'customer_id');
    }

    public function profile()
    {
        return $this->hasOne(TeamCustomerProfile::class, 'customer_id')
            ->bind(['nickname', 'avatar', 'description']);
    }

    public function identity()
    {
        return $this->morphOne(EntityIdentity::class, 'entityable', 'teamCustomer')
            ->bind(['slug']);
    }

    public function fieldValues()
    {
        return $this->morphMany(TeamEntityFieldValue::class, 'entity', 'customer');
    }

    public function getIsValidAttr($value, $data): bool
    {
        return (int) ($data['is_blocked'] ?? 0) === 0 && (bool) ($this->team?->is_valid ?? false);
    }

    public function getIsSearchableAttr(): bool
    {
        return false;
    }
}
