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
        'attempts' => 'integer',
        'available_at' => 'integer',
    ] + self::COMMON_TYPES;

    protected $json = [];

    protected $readonly = ['provider', 'action', 'resource_key'];
}
