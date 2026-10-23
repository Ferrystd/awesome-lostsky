<?php
declare(strict_types=1);

namespace app\model;

/**
 * UserDevice 模型
 * 记录用户登录设备，配合 JWT 实现设备信任/踢出机制
 * @mixin \think\Model
 */
class UserDevice extends Base
{
    protected $name = 'user_device';

    protected $type = [
        'user_id'          => 'integer',
        'device_token'     => 'string',
        'device_name'      => 'string',
        'ua'               => 'string',
        'last_active_time' => 'integer',
    ] + self::COMMON_TYPES;

    protected $json = [];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
