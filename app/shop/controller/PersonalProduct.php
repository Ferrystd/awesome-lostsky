<?php
declare(strict_types=1);

namespace app\shop\controller;

use app\service\PermissionDictionary as Permissions;
use app\service\ProductSelfManagement;
use think\Request;

final class PersonalProduct
{
    protected $middleware = [
        'JwtAuth', 'Context', 'EntityType:team,teamMember,teamVirtual', 'TeamAuth',
        'Permission:' . Permissions::SHOP_PRODUCT_SELF_MANAGE,
    ];

    public function index(Request $request)
    {
        return success(app(ProductSelfManagement::class)->list(
            $request->team_id,
            $request->acting_entity,
            [
                'is_active' => $request->get('is_active'),
                'keyword' => $request->get('keyword'),
            ],
            $request->get('page/d', 1),
            $request->get('limit/d', 20)
        ));
    }

    public function options(Request $request)
    {
        return success(app(ProductSelfManagement::class)->options(
            $request->team_id,
            $request->acting_entity
        ));
    }

    public function get(Request $request)
    {
        return success(app(ProductSelfManagement::class)->get(
            $request->team_id,
            $request->acting_entity,
            $request->route('id/d', 0)
        ));
    }

    public function create(Request $request)
    {
        $id = app(ProductSelfManagement::class)->create(
            $request->team_id,
            $request->acting_entity,
            $request->post('expected_entity_id/d', 0),
            $request->only([
                'name', 'description', 'cover_image', 'introduction_markdown', 'price', 'cost',
                'handler_cut', 'sender_cut', 'cs_cut', 'team_cut', 'kind',
                'benefit_package_id', 'redemption_campaign_id',
            ], 'post')
        );
        app(\app\service\BusinessAudit::class)->record($request, 'shop', 'create', 'product', $id);
        return success(['id' => $id], '商品已创建');
    }

    public function edit(Request $request)
    {
        $id = $request->route('id/d', 0);
        $data = [];
        foreach ([
            'name', 'price', 'cost', 'description', 'cover_image', 'introduction_markdown', 'is_active',
            'handler_cut', 'sender_cut', 'cs_cut', 'team_cut', 'kind',
            'benefit_package_id', 'redemption_campaign_id',
        ] as $field) {
            if ($request->has($field, 'post')) $data[$field] = $request->post($field);
        }
        app(ProductSelfManagement::class)->edit(
            $request->team_id,
            $request->acting_entity,
            $request->post('expected_entity_id/d', 0),
            $id,
            $data
        );
        app(\app\service\BusinessAudit::class)->record($request, 'shop', 'update', 'product', $id);
        return message('商品已更新');
    }

    public function setHandlers(Request $request)
    {
        $id = $request->route('id/d', 0);
        app(ProductSelfManagement::class)->setHandlers(
            $request->team_id,
            $request->acting_entity,
            $request->post('expected_entity_id/d', 0),
            $id,
            $request->post('entity_ids/a', [])
        );
        app(\app\service\BusinessAudit::class)->record($request, 'shop', 'setHandlers', 'product', $id);
        return message('接单人已更新');
    }

}
