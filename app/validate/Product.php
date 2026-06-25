<?php
declare(strict_types=1);

namespace app\validate;

use think\Validate;

class Product extends Validate
{
    protected $rule = [
        'name'        => 'require|max:100',
        'description' => 'max:500',
        'price'       => 'require|float|>=:0',
        'cost'        => 'float|>=:0',
        'handler_cut' => 'float|>=:0',
        'sender_cut'  => 'float|>=:0',
        'cs_cut'      => 'float|>=:0',
        'team_cut'    => 'float|>=:0',
        'member_id'   => 'integer',
        'member_ids'  => 'require|array',
        'is_active'   => 'in:0,1',
    ];

    protected $message = [
        'name.require'       => '商品名称不能为空',
        'name.max'           => '商品名称长度不能超过100位',
        'description.max'    => '商品描述长度不能超过500位',
        'price.require'      => '单价不能为空',
        'price.float'        => '单价格式不正确',
        'price.>='           => '单价不能为负数',
        'cost.float'         => '成本格式不正确',
        'cost.>='            => '成本不能为负数',
        'handler_cut.float'  => '接单人抽成格式不正确',
        'handler_cut.>='     => '接单人抽成不能为负数',
        'sender_cut.float'   => '发单人抽成格式不正确',
        'sender_cut.>='      => '发单人抽成不能为负数',
        'cs_cut.float'       => '客服抽成格式不正确',
        'cs_cut.>='          => '客服抽成不能为负数',
        'team_cut.float'     => '团队抽成格式不正确',
        'team_cut.>='        => '团队抽成不能为负数',
        'member_id.integer'  => '专属成员ID格式不正确',
        'member_ids.require' => '接单人列表不能为空',
        'member_ids.array'   => '接单人列表格式不正确',
        'is_active.in'       => '上架状态格式不正确',
    ];

    protected $scene = [
        'create'      => ['name', 'price', 'description', 'cost', 'member_id', 'handler_cut', 'sender_cut', 'cs_cut', 'team_cut'],
        'edit'        => ['name', 'price', 'description', 'cost', 'is_active', 'handler_cut', 'sender_cut', 'cs_cut', 'team_cut'],
        'setHandlers' => ['member_ids'],
    ];
}
