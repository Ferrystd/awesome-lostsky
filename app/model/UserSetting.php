<?php
declare (strict_types = 1);

namespace app\model;

/**
 * UserSetting 模型
 * @mixin \think\Model
 */
class UserSetting extends Base
{
    protected $name = 'user_setting';

    protected $type = [
        'user_id'     => 'integer',
        'app_name'    => 'string',
        'key'         => 'string',
        'value'       => 'string',
    ] + self::COMMON_TYPES;

    protected $json = [];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
