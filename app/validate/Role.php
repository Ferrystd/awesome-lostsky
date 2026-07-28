<?php
declare(strict_types=1);

namespace app\validate;

use think\Validate;

class Role extends Validate
{
    protected $rule = [
        'id'          => 'require|integer|gt:0',
        'role_key'    => 'require|length:1,50|regex:/^[a-z][a-z0-9._-]*$/',
        'name'        => 'require|length:1,50',
        'description' => 'max:255',
        'sort'        => 'integer|egt:0',
        'is_displayed'=> 'in:0,1',
    ];

    protected $message = [
        'id.require'       => '角色ID不能为空',
        'id.integer'       => '角色ID格式不正确',
        'id.gt'            => '角色ID格式不正确',
        'role_key.require' => '角色标识不能为空',
        'role_key.length'  => '角色标识长度需在1-50位之间',
        'role_key.regex'   => '角色标识格式不正确',
        'name.require'     => '角色名称不能为空',
        'name.length'      => '角色名称长度需在1-50位之间',
        'description.max'  => '角色说明不能超过255位',
        'sort.integer'     => '排序格式不正确',
        'sort.egt'         => '排序不能小于0',
        'is_displayed.in'  => '公开展示设置不正确',
    ];

    protected $scene = [
        'create' => ['role_key', 'name', 'description', 'sort', 'is_displayed'],
        'delete' => ['id'],
    ];

    public function sceneUpdate(): self
    {
        return $this->only(['id', 'name', 'description', 'sort', 'is_displayed'])
            ->remove('name', 'require');
    }
}
