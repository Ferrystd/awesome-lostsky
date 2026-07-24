<?php
declare(strict_types=1);

namespace app\team\controller;

use app\service\PostType as PostTypeService;
use think\Request;

class PostType
{
    protected $middleware = [
        'JwtAuth'      => ['only' => ['index', 'get', 'add', 'edit', 'delete']],
        'Context'      => ['only' => ['index', 'get', 'add', 'edit', 'delete']],
        'EntityType:team,teamMember,teamCustomer,teamVirtual' => ['only' => ['index', 'get', 'add', 'edit', 'delete']],
        'TeamBelongs'  => ['only' => ['index', 'get', 'add', 'edit', 'delete']],
        'MemberAccess' => ['only' => ['index', 'get', 'add', 'edit', 'delete']],
        'TeamAccess'   => ['only' => ['add', 'edit', 'delete']],
    ];

    /**
     * 获取全部岗位类型
     */
    public function index(Request $request)
    {
        $service = app(PostTypeService::class);
        $result  = $service->list($request->team_id);

        return success($result);
    }

    /**
     * 获取单个岗位类型
     */
    public function get(Request $request)
    {
        $id = (int) $request->param('id', 0);

        $service = app(PostTypeService::class);
        $result  = $service->get($request->team_id, $id);

        return success($result);
    }

    /**
     * 新增岗位类型
     */
    public function add(Request $request)
    {
        $service = app(PostTypeService::class);
        $service->create($request->team_id, [
            'name'        => $request->post('name', ''),
            'description' => $request->post('description', ''),
            'post_id'     => (int) $request->post('post_id', 0),
            'sort'        => (int) $request->post('sort', 0),
        ]);

        return message('岗位类型已新增');
    }

    /**
     * 编辑岗位类型
     */
    public function edit(Request $request)
    {
        $id = (int) $request->post('id', 0);

        $data = [];
        if ($request->has('name')) {
            $data['name'] = $request->post('name', '');
        }
        if ($request->has('description')) {
            $data['description'] = $request->post('description', '');
        }
        if ($request->has('post_id')) {
            $data['post_id'] = (int) $request->post('post_id');
        }
        if ($request->has('sort')) {
            $data['sort'] = (int) $request->post('sort');
        }

        $service = app(PostTypeService::class);
        $service->update($request->team_id, $id, $data);

        return message('岗位类型已更新');
    }

    /**
     * 删除岗位类型
     */
    public function delete(Request $request)
    {
        $id = (int) $request->post('id', 0);

        $service = app(PostTypeService::class);
        $service->delete($request->team_id, $id);

        return message('岗位类型已删除');
    }
}
