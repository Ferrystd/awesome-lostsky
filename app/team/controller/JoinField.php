<?php
declare(strict_types=1);

namespace app\team\controller;

use app\service\TeamJoin;
use app\service\PermissionDictionary as Permissions;
use think\Request;

class JoinField
{
    protected $middleware = [
        'JwtAuth'    => ['only' => ['index', 'transferOptions', 'add', 'edit', 'delete']],
        'Context'    => ['only' => ['index', 'transferOptions', 'add', 'edit', 'delete']],
        'EntityType:team,teamMember,teamCustomer,teamVirtual' => ['only' => ['index', 'transferOptions', 'add', 'edit', 'delete']],
        'TeamWorkspaceAuth' => ['only' => ['index', 'transferOptions', 'add', 'edit', 'delete']],
        'Permission:' . Permissions::TEAM_JOIN_FIELD_READ => ['only' => ['index']],
        'Permission:' . Permissions::TEAM_JOIN_FIELD_WRITE => ['only' => ['transferOptions', 'add', 'edit', 'delete']],
    ];

    public function index(Request $request)
    {
        $service = app(TeamJoin::class);
        $result = $service->fields($request->team_id, false);

        return success($result);
    }

    public function transferOptions(Request $request)
    {
        $service = app(TeamJoin::class);

        return success($service->transferOptions($request->team_id));
    }

    public function add(Request $request)
    {
        $service = app(TeamJoin::class);
        $data = $this->data($request);
        $id = $service->createField($request->team_id, $data);
        app(\app\service\BusinessAudit::class)->record(
            $request, 'team', 'create', 'joinField', $id,
            ['changed_fields' => array_keys($data)]
        );

        return success(['id' => $id], '申请字段已创建');
    }

    public function edit(Request $request)
    {
        $id = $request->post('id/d', 0);

        $service = app(TeamJoin::class);
        $data = $this->data($request);
        $service->updateField($request->team_id, $id, $data);
        app(\app\service\BusinessAudit::class)->record(
            $request, 'team', 'update', 'joinField', $id,
            ['changed_fields' => array_keys($data), 'changed' => $data !== []]
        );

        return message('申请字段已更新');
    }

    public function delete(Request $request)
    {
        $id = $request->post('id/d', 0);

        $service = app(TeamJoin::class);
        $service->deleteField($request->team_id, $id);
        app(\app\service\BusinessAudit::class)->record($request, 'team', 'delete', 'joinField', $id);

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
