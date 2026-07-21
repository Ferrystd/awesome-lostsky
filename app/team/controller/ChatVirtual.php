<?php
declare (strict_types = 1);

namespace app\team\controller;

class ChatVirtual
{
    protected $middleware = [
        'JwtAuth',
        'Context',
        'MemberAccess',
        'Permission:chat.virtual.create' => ['only' => ['create']],
        [
            'middleware' => ['Permission', ['chat.virtual.<slug>.manage']],
            'options' => ['only' => ['get', 'update', 'delete']],
        ],
    ];

    public function index(\think\Request $request)
    {
        return success(app(\app\service\ChatVirtual::class)->list(
            (int) $request->team_id,
            (int) $request->member_id
        ));
    }

    public function get(\think\Request $request)
    {
        return success(app(\app\service\ChatVirtual::class)->get(
            (int) $request->team_id,
            (string) $request->param('slug', '')
        ));
    }

    public function create(\think\Request $request)
    {
        return success(app(\app\service\ChatVirtual::class)->create((int) $request->team_id, [
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
            (int) $request->team_id,
            (string) $request->param('slug', ''),
            $data
        );
        return message('虚拟实体已更新');
    }

    public function delete(\think\Request $request)
    {
        app(\app\service\ChatVirtual::class)->delete(
            (int) $request->team_id,
            (string) $request->param('slug', '')
        );
        return message('虚拟实体已删除');
    }
}
