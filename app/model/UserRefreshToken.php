<?php
declare (strict_types = 1);

namespace app\model;

/**
 * UserRefreshToken 模型
 * @mixin \think\Model
 */
class UserRefreshToken extends Base
{
    protected $name = 'user_refresh_token';

    protected $type = [
        'id'             => 'integer',
        'user_id'        => 'integer',
        'device_id'      => 'integer',
        'expires_at'     => 'integer',
        'create_time'    => 'integer',
        'update_time'    => 'integer',
        'delete_time'    => 'integer',
    ];

    protected $json = [];

    protected $hidden = ['token_hash', 'delete_time'];

    protected $readonly = ['user_id', 'device_id', 'family_id', 'token_hash', 'expires_at'];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function device()
    {
        return $this->belongsTo(UserDevice::class, 'device_id');
    }
}
