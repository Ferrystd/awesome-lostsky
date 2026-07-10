<?php
declare (strict_types = 1);

namespace app\model;

use app\model\Base;

/**
 * TeamProduct 模型 — 商品/服务
 * @mixin \think\Model
 */
class TeamProduct extends Base
{
    protected $type = [
        'id'          => 'integer',
        'team_id'     => 'integer',
        // member_id 允许为 NULL，不能声明 integer，否则 NULL 会被转换为 0
        // 'member_id'   => 'integer|null',
        'name'        => 'string',
        'description' => 'string',
        'price'       => 'float',
        'cost'        => 'float',
        'handler_cut' => 'float',
        'sender_cut'  => 'float',
        'cs_cut'      => 'float',
        'team_cut'    => 'float',
        'is_active'   => 'integer',
        'create_time' => 'integer',
        'update_time' => 'integer',
        'delete_time' => 'integer',
    ];

    protected $json = [];

    protected $hidden = ['delete_time'];

    protected $append = [];

    protected $readonly = ['team_id'];

    public function team()
    {
        return $this->belongsTo(Team::class, 'team_id');
    }

    public function member()
    {
        return $this->belongsTo(TeamMember::class, 'member_id');
    }

    public function handlers()
    {
        return $this->hasMany(TeamProductHandler::class, 'product_id');
    }
}
