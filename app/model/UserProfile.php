<?php
declare (strict_types = 1);

namespace app\model;

use app\enum\Gender;
use app\model\Base;

/**
 * UserProfile 模型
 * @mixin \think\Model
 */
class UserProfile extends Base
{
    /**
     * 字段类型转换
     * @var array
     */
    protected $type = [
        'id' => 'integer',
        'create_time' => 'integer',
        'update_time' => 'integer',
        'delete_time' => 'integer',
        //固定字段

        //拓展字段
        'user_id' => 'integer',
        'nickname' => 'string',
        'avatar' => 'string',
        'gender' => Gender::class,
        'birthday' => 'integer',

    ];

    /**
     * JSON 字段
     * @var array
     */
    protected $json = [];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
