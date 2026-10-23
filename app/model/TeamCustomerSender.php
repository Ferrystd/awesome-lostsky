<?php
declare (strict_types = 1);

namespace app\model;

use app\model\Base;

/**
 * TeamCustomerSender 模型 顾客-发单人绑定
 * @mixin \think\Model
 */
class TeamCustomerSender extends Base
{
    use concern\BelongsToTeam;
    use concern\BelongsToEntity;

    protected $type = [
        'team_id'     => 'integer',
        'customer_id' => 'integer',
        'entity_id'   => 'integer',
    ] + self::COMMON_TYPES;

    protected $json = [];


    protected $append = [];

    protected $readonly = ['team_id', 'customer_id', 'entity_id'];

    public function customer()
    {
        return $this->belongsTo(TeamCustomer::class, 'customer_id');
    }

    public function scopeSender($query, int $entityId, int $customerId)
    {
        return $query->where('entity_id', $entityId)->where('customer_id', $customerId);
    }
}
