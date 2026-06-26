<?php
declare(strict_types=1);

namespace app\validate;

use think\Validate;

class Document extends Validate
{
    protected $rule = [
        'title'   => 'require|max:255',
        'content' => 'max:65535', // 限制接口层输入为 64KB，DB 列为 LONGTEXT 可存更大
        'scope'   => 'in:1,2',
    ];

    protected $message = [
        'title.require'   => '文档标题不能为空',
        'title.max'       => '文档标题长度不能超过255位',
        'content.max'     => '文档内容过长',
        'scope.in'        => '文档作用域格式不正确',
    ];
}
