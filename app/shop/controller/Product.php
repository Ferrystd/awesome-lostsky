<?php
declare(strict_types=1);

namespace app\shop\controller;

use app\service\Product as ProductService;
use think\Request;

class Product
{
    protected $middleware = [
        'JwtAuth'      => ['except' => []],
        'Context'      => ['except' => []],
        'MemberAccess' => ['except' => []],
        'Permission:shop.product.read' => ['only' => ['index', 'get']],
        'Permission:shop.product.write' => ['only' => ['create', 'edit', 'setHandlers']],
        'Permission:shop.product.delete' => ['only' => ['delete']],
    ];

    public function index(Request $request)
    {
        $service = app(ProductService::class);
        $result  = $service->list($request->team_id, [
            'member_id' => $request->get('member_id'),
            'is_active' => $request->get('is_active'),
            'keyword'   => $request->get('keyword'),
        ], (int) $request->get('page', 1), (int) $request->get('limit', 20));

        return success($result);
    }

    public function get(Request $request)
    {
        $id = (int) $request->param('id', 0);

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
            'price'       => $request->post('price'),
            'cost'        => $request->post('cost', 0),
            'member_id'   => $request->post('member_id', null),
            'handler_cut' => $request->post('handler_cut', null),
            'sender_cut'  => $request->post('sender_cut', null),
            'cs_cut'      => $request->post('cs_cut', null),
            'team_cut'    => $request->post('team_cut', null),
        ]);

        return success(['id' => $id], '商品已创建');
    }

    public function edit(Request $request)
    {
        $id = (int) $request->param('id', 0);

        $data = [];
        foreach (['name', 'price', 'cost', 'description', 'is_active',
            'handler_cut', 'sender_cut', 'cs_cut', 'team_cut'] as $field) {
            if ($request->has($field, 'post')) {
                $data[$field] = $request->post($field);
            }
        }

        $service = app(ProductService::class);
        $service->edit($request->team_id, $id, $data);

        return message('商品已更新');
    }

    public function delete(Request $request)
    {
        $id = (int) $request->param('id', 0);

        $service = app(ProductService::class);
        $service->delete($request->team_id, $id);

        return message('商品已删除');
    }

    public function setHandlers(Request $request)
    {
        $id        = (int) $request->param('id', 0);
        $memberIds = $request->post('member_ids', []);

        $service = app(ProductService::class);
        $service->setHandlers($request->team_id, $id, $memberIds);

        return message('接单人已更新');
    }
}
