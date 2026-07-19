<?php
declare (strict_types = 1);

namespace app\validate;

use think\Validate;

class EntityIdentity extends Validate
{
    /**
     * 定义验证规则
     * 格式：'字段名' =>  ['规则1','规则2'...]
     *
     * @var array
     */
    protected $rule = [
        'slug'            => 'require|regex:^[a-zA-Z][a-zA-Z0-9_-]+$|length:2,50',
        'member_id'       => 'require|integer',
        'search_override' => 'in:0,1',
    ];

    /**
     * 定义错误信息
     * 格式：'字段名.规则名' =>  '错误信息'
     *
     * @var array
     */
    protected $message = [
        'slug.require'             => '对象标识不能为空',
        'slug.regex'               => '对象标识格式不正确，字母开头，仅允许字母数字下划线和连字符',
        'slug.length'              => '对象标识长度需在2-50位之间',
        'member_id.require'        => '成员ID不能为空',
        'member_id.integer'        => '成员ID格式不正确',
        'search_override.in'       => '成员搜索设置格式不正确',
    ];

    protected $scene = [
        'claim'  => ['slug'],
        'admin'  => ['member_id', 'slug'],
        'search' => ['member_id', 'search_override'],
    ];
}
