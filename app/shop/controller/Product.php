<?php
declare(strict_types=1);

namespace app\shop\controller;

use app\service\Product as ProductService;
use app\service\PermissionDictionary as Permissions;
use think\Request;

class Product
{
    protected $middleware = [
        'JwtAuth'      => ['except' => []],
        'Context'      => ['except' => []],
        'EntityType:team,teamMember,teamCustomer,teamVirtual' => ['except' => []],
        'TeamAuth'     => ['except' => []],
        'Permission:' . Permissions::SHOP_PRODUCT_READ => ['only' => ['index', 'get', 'fields']],
        'Permission:' . Permissions::SHOP_PRODUCT_WRITE => ['only' => ['create', 'edit', 'setHandlers', 'createField', 'updateField', 'deleteField']],
        'Permission:' . Permissions::SHOP_PRODUCT_DELETE => ['only' => ['delete']],
    ];

    public function index(Request $request)
    {
        $service = app(ProductService::class);
        $result  = $service->list($request->team_id, [
            'entity_id' => $request->get('entity_id'),
            'is_active' => $request->get('is_active'),
            'keyword'   => $request->get('keyword'),
        ], $request->get('page/d', 1), $request->get('limit/d', 20));

        return success($result);
    }

    public function get(Request $request)
    {
        $id = $request->route('id/d', 0);

        $service = app(ProductService::class);
        $result  = $service->get($request->team_id, $id);

        return success($result);
    }

    public function create(Request $request)
    {
        $service = app(ProductService::class);
        $id = $service->create($request->team_id, [
            'name'        => $request->post('name'),
            'description' => $request->post('description', null),
            'cover_image' => $request->post('cover_image', null),
            'introduction_markdown' => $request->post('introduction_markdown', null),
            'price'       => $request->post('price'),
            'cost'        => $request->post('cost', 0),
            'entity_id'   => $request->post('entity_id', null),
            'handler_cut' => $request->post('handler_cut', null),
            'sender_cut'  => $request->post('sender_cut', null),
            'cs_cut'      => $request->post('cs_cut', null),
            'team_cut'    => $request->post('team_cut', null),
            'kind'        => $request->post('kind', 1),
            'benefit_package_id' => $request->post('benefit_package_id', null),
            'redemption_campaign_id' => $request->post('redemption_campaign_id', null),
        ]);
        app(\app\service\BusinessAudit::class)->record($request, 'shop', 'create', 'product', $id);

        return success(['id' => $id], '商品已创建');
    }

    public function edit(Request $request)
    {
        $id = $request->route('id/d', 0);

        $data = [];
        foreach (['name', 'price', 'cost', 'description', 'cover_image', 'introduction_markdown', 'is_active',
            'handler_cut', 'sender_cut', 'cs_cut', 'team_cut', 'kind',
            'benefit_package_id', 'redemption_campaign_id'] as $field) {
            if ($request->has($field, 'post')) {
                $data[$field] = $request->post($field);
            }
        }

        $service = app(ProductService::class);
        $service->edit($request->team_id, $id, $data);
        app(\app\service\BusinessAudit::class)->record($request, 'shop', 'update', 'product', $id);

        return message('商品已更新');
    }

    public function delete(Request $request)
    {
        $id = $request->route('id/d', 0);

        $service = app(ProductService::class);
        $service->delete($request->team_id, $id);
        app(\app\service\BusinessAudit::class)->record($request, 'shop', 'delete', 'product', $id);

        return message('商品已删除');
    }

    public function setHandlers(Request $request)
    {
        $id        = $request->route('id/d', 0);
        $entityIds = $request->post('entity_ids', []);

        $service = app(ProductService::class);
        $service->setHandlers($request->team_id, $id, $entityIds);
        app(\app\service\BusinessAudit::class)->record($request, 'shop', 'setHandlers', 'product', $id);

        return message('接单人已更新');
    }

    public function fields(Request $request)
    {
        return success(app(\app\service\ProductRedemptionField::class)->list($request->team_id, $request->route('id/d', 0)));
    }

    public function createField(Request $request)
    {
        $id = app(\app\service\ProductRedemptionField::class)->create(
            $request->team_id,
            $request->route('id/d', 0),
            $request->post()
        );
        return success(['id' => $id], '核销字段已创建');
    }

    public function updateField(Request $request)
    {
        app(\app\service\ProductRedemptionField::class)->update(
            $request->team_id,
            $request->route('id/d', 0),
            $request->route('field_id/d', 0),
            $request->post()
        );
        return message('核销字段已更新');
    }

    public function deleteField(Request $request)
    {
        app(\app\service\ProductRedemptionField::class)->delete(
            $request->team_id,
            $request->route('id/d', 0),
            $request->route('field_id/d', 0)
        );
        return message('核销字段已删除');
    }
}
