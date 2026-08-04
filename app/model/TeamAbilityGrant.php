<?php
declare (strict_types = 1);

namespace app\model;

use app\model\Base;

/**
 * TeamAbilityGrant 模型
 * @mixin \think\Model
 */
class TeamAbilityGrant extends Base
{
    /**
     * 字段类型转换
     * @var array
     */
    protected $type = [
        'id'          => 'integer',
        'create_time' => 'integer',
        'update_time' => 'integer',
        'delete_time' => 'integer',
        'team_id' => 'integer',
        'ability_key' => 'string',
        'level' => 'integer',
        'starts_at' => 'integer',
        'ends_at' => 'integer',
        'source_type' => 'string',
        'revoke_reason' => 'string',
    ];

    /** JSON 字段 */
    protected $json = [];

    /** 输出隐藏 */
    protected $hidden = ['delete_time'];

    /** 计算属性 */
    protected $append = [];

    /** 只读字段 */
    protected $readonly = ['team_id', 'ability_key', 'starts_at', 'source_type', 'source_claim_id'];

    public function team() { return $this->belongsTo(Team::class, 'team_id'); }
    public function claim() { return $this->belongsTo(RedemptionClaim::class, 'source_claim_id'); }
}
