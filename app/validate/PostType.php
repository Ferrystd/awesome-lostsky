<?php
declare(strict_types=1);

namespace app\validate;

use think\Validate;

class PostType extends Validate
{
    protected $rule = [
        'id'          => 'require|integer',
        'name'        => 'require|length:1,50',
        'description' => 'max:255',
        'post_id'     => 'require|integer',
        'sort'        => 'integer',
    ];

    protected $message = [
        'id.require'           => '岗位类型ID不能为空',
        'id.integer'           => '岗位类型ID格式不正确',
        'name.require'         => '岗位类型名称不能为空',
        'name.length'          => '岗位类型名称长度需在1-50位之间',
        'description.max'      => '岗位类型描述长度不能超过255位',
        'post_id.require'      => '岗位ID不能为空',
        'post_id.integer'      => '岗位ID格式不正确',
        'sort.integer'         => '排序格式不正确',
    ];

    protected $scene = [
        'create' => ['name', 'description', 'post_id', 'sort'],
        'update' => ['id', 'name', 'description', 'post_id', 'sort'],
        'delete' => ['id'],
    ];
}
