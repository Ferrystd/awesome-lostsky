<?php
declare (strict_types = 1);

namespace app\team\controller;

use app\service\PermissionDictionary as Permissions;

class ChatVirtual
{
    protected $middleware = [
        'JwtAuth',
        'Context',
        'EntityType:team,teamMember,teamCustomer,teamVirtual',
        'TeamAuth',
        'Permission:' . Permissions::TEAM_ENTITY_VIRTUAL_CREATE => ['only' => ['create']],
        [
            'middleware' => ['Permission', [Permissions::TEAM_ENTITY_VIRTUAL_MANAGE_TEMPLATE]],
            'options' => ['only' => ['get', 'update', 'delete']],
        ],
    ];

    public function index(\think\Request $request)
    {
        return success(app(\app\service\ChatVirtual::class)->list(
            $request->team_id,
            $request->acting_entity
        ));
    }

    public function get(\think\Request $request)
    {
        return success(app(\app\service\ChatVirtual::class)->get(
            $request->team_id,
            $request->get('slug/s', '')
        ));
    }

    public function create(\think\Request $request)
    {
        return success(app(\app\service\ChatVirtual::class)->create($request->team_id, [
            'slug' => $request->post('slug', ''),
            'name' => $request->post('name', ''),
            'avatar' => $request->post('avatar'),
            'description' => $request->post('description'),
        ]), '虚拟实体已创建');
    }

    public function update(\think\Request $request)
    {
        $data = [];
        foreach (['name', 'avatar', 'description', 'is_active'] as $field) {
            if ($request->has($field, 'post')) {
                $data[$field] = $request->post($field);
            }
        }
        app(\app\service\ChatVirtual::class)->update(
            $request->team_id,
            $request->post('slug/s', ''),
            $data
        );
        return message('虚拟实体已更新');
    }

    public function delete(\think\Request $request)
    {
        app(\app\service\ChatVirtual::class)->delete(
            $request->team_id,
            $request->post('slug/s', '')
        );
        return message('虚拟实体已删除');
    }
}
