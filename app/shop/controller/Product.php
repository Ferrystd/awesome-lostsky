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
        'TeamWorkspaceAuth' => ['except' => []],
        'Permission:' . Permissions::SHOP_PRODUCT_READ => ['only' => ['index', 'get']],
        'Permission:' . Permissions::SHOP_PRODUCT_WRITE => ['only' => ['create', 'edit', 'setHandlers']],
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
        $data = [
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
            'redemption'  => $request->post('redemption', null),
            'benefit_package_id' => $request->post('benefit_package_id', null),
            'redemption_campaign_id' => $request->post('redemption_campaign_id', null),
        ];
        if ($request->has('items', 'post')) {
            $data['items'] = $request->post('items');
            foreach (['price', 'cost', 'handler_cut', 'sender_cut', 'cs_cut', 'team_cut'] as $field) {
                if (!$request->has($field, 'post')) unset($data[$field]);
            }
        }
        if ($request->has('handler_entity_ids', 'post')) $data['handler_entity_ids'] = $request->post('handler_entity_ids');
        if ($request->has('variants', 'post')) $data['variants'] = $request->post('variants');
        if ($request->has('purchase_fields', 'post')) $data['purchase_fields'] = $request->post('purchase_fields');
        $id = $service->create($request->team_id, $data);
        app(\app\service\BusinessAudit::class)->record($request, 'shop', 'create', 'product', $id);

        return success(['id' => $id], '商品已创建');
    }

    public function edit(Request $request)
    {
        $id = $request->route('id/d', 0);

        $data = [];
        foreach (['name', 'price', 'cost', 'description', 'cover_image', 'introduction_markdown', 'is_active',
            'handler_cut', 'sender_cut', 'cs_cut', 'team_cut', 'kind',
            'benefit_package_id', 'redemption_campaign_id', 'redemption', 'items', 'handler_entity_ids', 'variants', 'purchase_fields'] as $field) {
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

}
