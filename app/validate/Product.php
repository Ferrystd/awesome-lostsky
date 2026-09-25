<?php
declare(strict_types=1);

namespace app\validate;

use think\Validate;

class Product extends Validate
{
    protected $rule = [
        'name'        => 'require|max:100',
        'description' => 'max:500',
        'cover_image' => 'require|max:500',
        'introduction_markdown' => 'max:65535',
        'price'       => 'require|float|>=:0',
        'cost'        => 'float|>=:0',
        'handler_cut' => 'float|>=:0',
        'sender_cut'  => 'float|>=:0',
        'cs_cut'      => 'float|>=:0',
        'team_cut'    => 'float|>=:0',
        'entity_id'   => 'integer',
        'entity_ids'  => 'require|array',
        'is_active'   => 'in:0,1',
        'kind'        => 'in:1,2,3,4,5',
        'benefit_package_id' => 'integer',
        'redemption_campaign_id' => 'integer',
    ];

    protected $message = [
        'name.require'       => '商品名称不能为空',
        'name.max'           => '商品名称长度不能超过100位',
        'description.max'    => '商品描述长度不能超过500位',
        'cover_image.require' => '新建商品必须提供封面',
        'cover_image.max'    => '商品封面地址长度不能超过500位',
        'introduction_markdown.max' => '商品详情内容过长',
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
        'entity_id.integer'  => '专属人员ID格式不正确',
        'entity_ids.require' => '接单人列表不能为空',
        'entity_ids.array'   => '接单人列表格式不正确',
        'is_active.in'       => '上架状态格式不正确',
    ];

    protected $scene = [
        'create'      => ['name', 'price', 'description', 'cover_image', 'introduction_markdown', 'cost', 'entity_id', 'handler_cut', 'sender_cut', 'cs_cut', 'team_cut', 'kind', 'benefit_package_id', 'redemption_campaign_id'],
        'setHandlers' => ['entity_ids'],
    ];

    public function sceneEdit(): self
    {
        return $this->only([
            'name', 'price', 'description', 'cover_image', 'introduction_markdown',
            'cost', 'is_active', 'handler_cut', 'sender_cut', 'cs_cut', 'team_cut',
            'kind', 'benefit_package_id', 'redemption_campaign_id',
        ])->remove('name', 'require')
            ->remove('price', 'require')
            ->remove('cover_image', 'require');
    }
}
