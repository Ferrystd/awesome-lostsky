<?php
declare(strict_types=1);

namespace app\validate;

use think\Validate;

class Order extends Validate
{
    protected $rule = [
        'product_id'  => 'require|integer',
        'handler_entity_id'  => 'integer',
        'sender_entity_id'   => 'integer',
        'cs_entity_id'       => 'integer',
        'customer_id' => 'integer',
        'quantity'    => 'integer|>=:1',
        'handler_cut' => 'float|>=:0',
        'sender_cut'  => 'float|>=:0',
        'cs_cut'      => 'float|>=:0',
        'team_cut'    => 'float|>=:0',
        'memo'        => 'max:500',
    ];

    protected $message = [
        'product_id.require'  => '商品ID不能为空',
        'product_id.integer'  => '商品ID格式不正确',
        'handler_entity_id.integer'  => '接单人ID格式不正确',
        'sender_entity_id.integer'   => '发单人ID格式不正确',
        'cs_entity_id.integer'       => '客服ID格式不正确',
        'customer_id.integer' => '客户ID格式不正确',
        'quantity.integer'    => '数量格式不正确',
        'quantity.>='         => '数量必须大于0',
        'handler_cut.float'   => '接单人抽成格式不正确',
        'handler_cut.>='      => '接单人抽成不能为负数',
        'sender_cut.float'    => '发单人抽成格式不正确',
        'sender_cut.>='       => '发单人抽成不能为负数',
        'cs_cut.float'        => '客服抽成格式不正确',
        'cs_cut.>='           => '客服抽成不能为负数',
        'team_cut.float'      => '团队抽成格式不正确',
        'team_cut.>='         => '团队抽成不能为负数',
        'memo.max'            => '备注长度不能超过500位',
    ];

    protected $scene = [
        'create' => ['product_id', 'handler_entity_id', 'sender_entity_id', 'cs_entity_id', 'customer_id', 'quantity', 'handler_cut', 'sender_cut', 'cs_cut', 'team_cut', 'memo'],
    ];
}
