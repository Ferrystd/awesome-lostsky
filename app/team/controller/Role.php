<?php
declare(strict_types=1);

namespace app\team\controller;

use app\service\PermissionDictionary as Permissions;
use think\Request;

class Role
{
    protected $middleware = [
        'JwtAuth', 'Context', 'EntityType:team,teamMember,teamCustomer,teamVirtual',
        'TeamAuth',
        'Permission:' . Permissions::TEAM_ROLE_READ => ['only' => ['index', 'get']],
        'Permission:' . Permissions::TEAM_ROLE_WRITE => ['only' => ['add', 'edit', 'delete']],
    ];

    public function index(Request $request)
    {
        return success(app(\app\service\Role::class)->list($request->team_id));
    }

    public function get(Request $request)
    {
        $id = $request->get('id/d', 0);

        return success(app(\app\service\Role::class)->get($request->team_id, $id));
    }

    public function add(Request $request)
    {
        $id = app(\app\service\Role::class)->create($request->team_id, [
            'role_key'    => $request->post('role_key', ''),
            'name'        => $request->post('name', ''),
            'description' => $request->post('description'),
            'sort'        => $request->post('sort/d', 0),
            'is_displayed'=> $request->post('is_displayed/d', 0),
        ]);
        app(\app\service\BusinessAudit::class)->record(
            $request, 'team', 'create', 'role', $id,
            ['changed_fields' => ['role_key', 'name', 'description', 'sort', 'is_displayed']]
        );

        return success(['id' => $id], '角色已创建');
    }

    public function edit(Request $request)
    {
        $id   = $request->post('id/d', 0);
        $data = [];
        foreach (['name', 'description', 'sort', 'is_displayed'] as $field) {
            if ($request->has($field)) {
                $data[$field] = in_array($field, ['sort', 'is_displayed'], true)
                    ? $request->post("{$field}/d")
                    : $request->post($field);
            }
        }

        app(\app\service\Role::class)->update($request->team_id, $id, $data);
        app(\app\service\BusinessAudit::class)->record(
            $request, 'team', 'update', 'role', $id,
            ['changed_fields' => array_keys($data), 'changed' => $data !== []]
        );

        return message('角色已更新');
    }

    public function delete(Request $request)
    {
        $id = $request->post('id/d', 0);
        app(\app\service\Role::class)->delete(
            $request->team_id,
            $id
        );
        app(\app\service\BusinessAudit::class)->record($request, 'team', 'delete', 'role', $id);

        return message('角色已删除');
    }
}
