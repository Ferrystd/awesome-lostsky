<?php
declare(strict_types=1);

namespace app\validate;

use think\Validate;

class Team extends Validate
{
    protected $rule = [
        'slug'         => 'require|regex:^[a-zA-Z][a-zA-Z0-9_-]+$|length:2,50',
        'display_name' => 'require|length:1,100',
    ];

    protected $message = [
        'slug.require'         => '团队标识不能为空',
        'slug.regex'           => '团队标识格式不正确，字母开头，仅允许字母数字下划线和连字符',
        'slug.length'          => '团队标识长度需在2-50位之间',
        'display_name.require' => '团队名称不能为空',
        'display_name.length'  => '团队名称长度需在1-100位之间',
        'team_id.require'      => '团队ID不能为空',
        'team_id.integer'      => '团队ID格式不正确',
    ];

    protected $scene = [
        'create' => ['slug', 'display_name'],
        'delete' => ['team_id'],
    ];
}
