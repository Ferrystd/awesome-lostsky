<?php
declare (strict_types = 1);

namespace app\model;

/**
 * ExternalCompensation 模型
 * @mixin \think\Model
 */
class ExternalCompensation extends Base
{
    protected $name = 'external_compensation';

    protected $type = [
        'id' => 'integer',
        'attempts' => 'integer',
        'available_at' => 'integer',
        'create_time' => 'integer',
        'update_time' => 'integer',
        'delete_time' => 'integer',
    ];

    protected $json = [];

    protected $hidden = ['delete_time'];
    protected $readonly = ['provider', 'action', 'resource_key'];
}
