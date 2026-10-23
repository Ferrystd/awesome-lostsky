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
        'team_id'     => 'integer',
        // user_id / owner_entity_id / assignee_entity_id 允许为 NULL，不能声明 integer，否则 NULL 会被转换为 0
        'is_blocked'  => 'integer',
    ] + self::COMMON_TYPES;

    protected $json = [];


    protected $append = ['is_valid', 'is_searchable'];

    protected $readonly = ['team_id', 'user_id', 'owner_entity_id'];

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

    public function ownerEntity()
    {
        return $this->belongsTo(Entity::class, 'owner_entity_id');
    }

    public function assignee()
    {
        return $this->belongsTo(Entity::class, 'assignee_entity_id');
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
        return $this->hasOne(TeamEntityProfile::class, 'entity_id', 'root_entity_id')
            ->bind(['name' => 'nickname', 'avatar', 'description']);
    }

    public function serviceInstances()
    {
        return $this->hasMany(TeamServiceInstance::class, 'customer_id');
    }

    public function serviceAssignmentOffers()
    {
        return $this->hasMany(TeamServiceAssignmentOffer::class, 'customer_id');
    }

    public function serviceEntitlements()
    {
        return $this->hasMany(TeamServiceEntitlement::class, 'customer_id');
    }

    public function identity()
    {
        return $this->morphOne(Entity::class, 'entityable', 'teamCustomer')
            ->bind(['slug']);
    }

    public function getRootEntityIdAttr(): int { return (int) ($this->identity?->id ?? 0); }

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
        // 顾客实体固定不进入全局实体搜索和普通团队目录；读取 Customer 始终需要 team.entity.read。
        // Entity.is_internal_visible 不会降低该权限边界，Customer 也不支持公开 Display。
        return false;
    }
}
