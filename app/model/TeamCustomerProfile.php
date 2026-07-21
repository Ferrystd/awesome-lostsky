<?php
declare (strict_types = 1);

namespace app\model;

use app\model\Base;

/**
 * TeamCustomerProfile 模型
 * @mixin \think\Model
 */
class TeamCustomerProfile extends Base
{
    protected $type = [
        'id'          => 'integer',
        'customer_id' => 'integer',
        'nickname'    => 'string',
        // 'avatar'      => 'null|string',
        // 'description' => 'null|string',
        'create_time' => 'integer',
        'update_time' => 'integer',
        'delete_time' => 'integer',
    ];

    protected $json = [];

    protected $hidden = ['delete_time'];

    protected $append = [];

    protected $readonly = ['customer_id'];

    public function customer()
    {
        return $this->belongsTo(TeamCustomer::class, 'customer_id');
    }

    public function setNicknameAttr($value): string
    {
        return trim((string) $value);
    }
}
