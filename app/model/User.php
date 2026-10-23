<?php
declare (strict_types = 1);

namespace app\model;

use app\model\Base;

/**
 * User 模型
 * @mixin \think\Model
 */
class User extends Base
{
    protected $type = [
        'phone'    => 'string',
        'email'    => 'string',
        'password' => 'string',
        'username' => 'string',
        'is_banned' => 'integer',
        'member_join_code_expires_at' => 'integer',
    ] + self::COMMON_TYPES;

    protected $json = [];

    /** 密码永不出现在输出中 */
    protected $hidden = ['password', 'delete_time', 'member_join_code_hash', 'member_join_code_expires_at'];

    public function profile()
    {
        return $this->hasOne(UserProfile::class, 'user_id')
            ->bind(['nickname', 'avatar', 'gender', 'birthday']);
    }

    public function devices()
    {
        return $this->hasMany(UserDevice::class, 'user_id');
    }

    public function settings()
    {
        return $this->hasMany(UserSetting::class, 'user_id');
    }

    public function members()
    {
        return $this->hasMany(TeamMember::class, 'user_id');
    }

    public function joinApplications()
    {
        return $this->hasMany(TeamJoinApplication::class, 'user_id');
    }

    public function customers()
    {
        return $this->hasMany(TeamCustomer::class, 'user_id');
    }

}
