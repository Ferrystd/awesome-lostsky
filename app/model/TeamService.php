<?php
declare (strict_types = 1);

namespace app\model;

use app\model\Base;

/**
 * TeamService 模型
 * @mixin \think\Model
 */
class TeamService extends Base
{
    use concern\BelongsToTeam;

    /**
     * 字段类型转换
     * @var array
     */
    protected $type = [
        'team_id' => 'integer',
        'name' => 'string',
        'description' => 'string',
        'unit_name' => 'string',
        'quantity_step' => 'string',
        'default_total_price' => 'string',
        'default_cost' => 'string',
        'default_handler_cut' => 'string',
        'default_sender_cut' => 'string',
        'default_cs_cut' => 'string',
        'default_team_cut' => 'string',
        'is_active' => 'integer',
    ] + self::COMMON_TYPES;

    /** JSON 字段 */
    protected $json = [];

    /** 计算属性 */
    protected $append = [];

    /** 只读字段 */
    protected $readonly = ['team_id', 'owner_entity_id'];

    public function owner() { return $this->belongsTo(Entity::class, 'owner_entity_id'); }
    public function handlers() { return $this->hasMany(TeamServiceHandler::class, 'service_id'); }
    public function instances() { return $this->hasMany(TeamServiceInstance::class, 'service_id'); }
    public function entitlements() { return $this->hasMany(TeamServiceEntitlement::class, 'service_id'); }
    public function assignmentOffers() { return $this->hasMany(TeamServiceAssignmentOffer::class, 'service_id'); }
    public function redemptionFields() { return $this->hasMany(TeamServiceRedemptionField::class, 'service_id'); }
}
