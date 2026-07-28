<?php
declare(strict_types=1);

namespace app\team\controller;

use app\service\TeamJoin;
use app\service\PermissionDictionary as Permissions;
use think\Request;

class JoinField
{
    protected $middleware = [
        'JwtAuth'    => ['only' => ['index', 'add', 'edit', 'delete']],
        'Context'    => ['only' => ['index', 'add', 'edit', 'delete']],
        'EntityType:team,teamMember,teamCustomer,teamVirtual' => ['only' => ['index', 'add', 'edit', 'delete']],
        'TeamAuth' => ['only' => ['index', 'add', 'edit', 'delete']],
        'Permission:' . Permissions::TEAM_JOIN_FIELD_READ => ['only' => ['index']],
        'Permission:' . Permissions::TEAM_JOIN_FIELD_WRITE => ['only' => ['add', 'edit', 'delete']],
    ];

    public function index(Request $request)
    {
        $service = app(TeamJoin::class);
        $result = $service->fields($request->team_id, false);

        return success($result);
    }

    public function add(Request $request)
    {
        $service = app(TeamJoin::class);
        $id = $service->createField($request->team_id, $this->data($request));

        return success(['id' => $id], '申请字段已创建');
    }

    public function edit(Request $request)
    {
        $id = (int) $request->post('id', 0);

        $service = app(TeamJoin::class);
        $service->updateField($request->team_id, $id, $this->data($request));

        return message('申请字段已更新');
    }

    public function delete(Request $request)
    {
        $id = (int) $request->post('id', 0);

        $service = app(TeamJoin::class);
        $service->deleteField($request->team_id, $id);

        return message('申请字段已删除');
    }

    private function data(Request $request): array
    {
        $fields = [
            'field_key',
            'name',
            'value_type',
            'input_type',
            'options',
            'default_value',
            'is_apply_fillable',
            'is_apply_required',
            'is_transfer_entity_field',
            'entity_field_id',
            'is_active',
            'sort',
        ];

        return $request->only($fields, 'post');
    }
}
