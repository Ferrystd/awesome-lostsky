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
        'product_id'  => 'integer',
        'entity_id'   => 'integer',
    ] + self::COMMON_TYPES;

    protected $json = [];


    protected $append = [];

    protected $readonly = ['product_id', 'entity_id'];

    public function product()
    {
        return $this->belongsTo(TeamProduct::class, 'product_id');
    }

    public function subject()
    {
        return $this->belongsTo(Entity::class, 'entity_id');
    }
}
