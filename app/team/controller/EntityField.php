<?php
declare (strict_types = 1);

namespace app\team\controller;

use app\service\PermissionDictionary as Permissions;

class EntityField
{
    protected $middleware = [
        'JwtAuth', 'Context', 'EntityType:team,teamMember,teamCustomer,teamVirtual',
        'TeamWorkspaceAuth',
    ];

    public function index(\think\Request $request)
    {
        $type = $request->get('entity_type/s', 'entity');
        $this->assertTypePermission($request, $type);
        return success(app(\app\service\TeamEntityField::class)->list($request->team_id, $type));
    }

    public function get(\think\Request $request)
    {
        $id = $request->get('id/d', 0);
        $type = app(\app\service\TeamEntityField::class)->typeFor($request->team_id, $id);
        $this->assertTypePermission($request, $type);
        return success(app(\app\service\TeamEntityField::class)->get($request->team_id, $id));
    }

    public function create(\think\Request $request)
    {
        $data = $request->post();
        $type = (string) ($data['entity_type'] ?? 'entity');
        $this->assertTypePermission($request, $type);
        $id = app(\app\service\TeamEntityField::class)->create($request->team_id, $data);
        app(\app\service\BusinessAudit::class)->record(
            $request, 'team', 'create', 'entityField', $id,
            ['changed_fields' => array_keys($data)]
        );
        return message('对象字段已创建');
    }

    public function update(\think\Request $request)
    {
        $id = $request->post('id/d', 0);
        $type = app(\app\service\TeamEntityField::class)->typeFor($request->team_id, $id);
        $this->assertTypePermission($request, $type);
        $data = $request->except(['id'], 'post');
        app(\app\service\TeamEntityField::class)->update(
            $request->team_id,
            $id,
            $data
        );
        app(\app\service\BusinessAudit::class)->record(
            $request, 'team', 'update', 'entityField', $id,
            ['changed_fields' => array_keys($data), 'changed' => $data !== []]
        );
        return message('对象字段已更新');
    }

    public function delete(\think\Request $request)
    {
        $id = $request->post('id/d', 0);
        $type = app(\app\service\TeamEntityField::class)->typeFor($request->team_id, $id);
        $this->assertTypePermission($request, $type);
        app(\app\service\TeamEntityField::class)->delete($request->team_id, $id);
        app(\app\service\BusinessAudit::class)->record($request, 'team', 'delete', 'entityField', $id);
        return message('对象字段已删除');
    }

    public function values(\think\Request $request)
    {
        $slug = $request->get('slug/s', '');
        $this->assertEntityPermission($request, $slug);
        return success(app(\app\service\TeamEntityField::class)->values($request->team_id, $slug));
    }

    public function fieldValues(\think\Request $request)
    {
        $id = $request->get('id/d', 0);
        $service = app(\app\service\TeamEntityField::class);
        $this->assertTypePermission($request, $service->typeFor($request->team_id, $id));
        $canReadAll = app(\app\service\PermissionGate::class)->allows(
            $request->team_id,
            $request->acting_entity,
            [Permissions::TEAM_ENTITY_READ]
        );
        return success($service->fieldValues(
            $request->team_id,
            $id,
            $request->get('page/d', 1),
            $request->get('limit/d', 20),
            $canReadAll
        ));
    }

    public function saveValues(\think\Request $request)
    {
        $slug = $request->post('slug/s', '');
        $this->assertEntityPermission($request, $slug);
        $values = $request->post('values/a', []);
        $entityId = app(\app\service\TeamEntityField::class)->saveValues(
            $request->team_id,
            $slug,
            $values
        );
        app(\app\service\BusinessAudit::class)->record(
            $request, 'team', 'save', 'entityFieldValues', $entityId,
            ['changed_fields' => array_map('strval', array_keys($values)), 'changed' => $values !== []]
        );
        return message('字段值已保存');
    }

    private function assertTypePermission(\think\Request $request, string $type): void
    {
        $key = match ($type) {
            'customer' => Permissions::TEAM_ENTITY_FIELD_CUSTOMER_MANAGE,
            'virtual' => Permissions::TEAM_ENTITY_VIRTUAL_ALL_FIELD_MANAGE,
            default => Permissions::TEAM_ENTITY_FIELD_MANAGE,
        };
        app(\app\service\PermissionGate::class)->assert(
            $request->team_id,
            $request->acting_entity,
            [$key]
        );
    }

    private function assertEntityPermission(\think\Request $request, string $slug): void
    {
        $actor = app(\app\service\TeamEntityField::class)->teamActor($request->team_id, $slug);
        $keys = $actor['type'] === \app\enum\ChatActorType::Virtual
            ? [
                Permissions::TEAM_ENTITY_VIRTUAL_ALL_FIELD_MANAGE,
                Permissions::virtual((string) $actor['slug'], 'field.manage'),
            ]
            : [Permissions::entityField($actor['type']->value)];
        app(\app\service\PermissionGate::class)->assert(
            $request->team_id,
            $request->acting_entity,
            $keys
        );
    }
}
