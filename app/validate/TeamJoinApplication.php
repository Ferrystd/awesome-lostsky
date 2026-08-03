<?php
declare (strict_types = 1);

namespace app\validate;

use think\Validate;

class TeamJoinApplication extends Validate
{
    protected $rule = [
        'id'          => 'require|integer',
        'values'      => 'array',
        'memo'        => 'max:500',
        'inviter_slug' => 'max:50',
        'reject_memo' => 'require|max:500',
        'tasks'       => 'array',
    ];

    protected $message = [
        'id.require'          => '申请ID不能为空',
        'id.integer'          => '申请ID格式不正确',
        'values.array'        => '申请表单数据格式不正确',
        'memo.max'            => '备注不能超过500位',
        'inviter_slug.max'    => '邀请人标识不能超过50位',
        'reject_memo.require' => '拒绝原因不能为空',
        'reject_memo.max'     => '拒绝原因不能超过500位',
        'tasks.array'         => '审核任务格式不正确',
    ];

    protected $scene = [
        'apply'  => ['values', 'memo', 'inviter_slug'],
        'id'     => ['id'],
        'reject' => ['id', 'reject_memo'],
        'tasks'  => ['id', 'tasks'],
    ];
}
