<?php
declare (strict_types = 1);

namespace app\model;

use app\model\Base;

/**
 * TeamProductHandler 模型 — 商品接单人白名单
 * @mixin \think\Model
 */
class TeamProductHandler extends Base
{
    protected $type = [
        'id'          => 'integer',
        'product_id'  => 'integer',
        'member_id'   => 'integer',
        'create_time' => 'integer',
        'update_time' => 'integer',
        'delete_time' => 'integer',
    ];

    protected $json = [];

    protected $hidden = ['delete_time'];

    protected $append = [];

    protected $readonly = ['product_id', 'member_id'];

    public function product()
    {
        return $this->belongsTo(TeamProduct::class, 'product_id');
    }

    public function member()
    {
        return $this->belongsTo(TeamMember::class, 'member_id');
    }
}
