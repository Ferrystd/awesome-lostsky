<?php
declare(strict_types=1);

namespace app\validate;

use think\Validate;

class ChatVirtual extends Validate
{
    protected $rule = [
        'slug' => 'require|regex:^[a-zA-Z][a-zA-Z0-9_-]+$|length:2,50',
        'name' => 'require|length:1,50',
        'avatar' => 'max:500',
        'description' => 'max:500',
        'is_active' => 'in:0,1',
    ];

    protected $message = [
        'slug.require' => '虚拟实体标识不能为空', 'slug.regex' => '标识只能使用字母、数字、下划线和连字符',
        'slug.length' => '标识长度需在2-50位', 'name.require' => '显示名称不能为空',
        'name.length' => '显示名称不能超过50位', 'avatar.max' => '头像地址过长',
        'description.max' => '简介不能超过500位', 'is_active.in' => '启用状态不正确',
    ];

    protected $scene = ['create' => ['slug', 'name', 'avatar', 'description']];

    public function sceneUpdate(): self
    {
        return $this->only(['name', 'avatar', 'description', 'is_active'])
            ->remove('name', 'require');
    }
}
