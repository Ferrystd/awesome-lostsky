<?php
declare (strict_types = 1);

namespace app\team\controller;

use app\service\PermissionDictionary as Permissions;

class EntityField
{
    protected $middleware = [
        'JwtAuth', 'Context', 'EntityType:team,teamMember,teamCustomer,teamVirtual',
        'TeamAuth',
    ];

    public function index(\think\Request $request)
    {
        $type = (string) $request->get('entity_type', 'entity');
        $this->assertTypePermission($request, $type);
        return success(app(\app\service\TeamEntityField::class)->list((int) $request->team_id, $type));
    }

    public function get(\think\Request $request)
    {
        $id = (int) $request->get('id', 0);
        $type = app(\app\service\TeamEntityField::class)->typeFor((int) $request->team_id, $id);
        $this->assertTypePermission($request, $type);
        return success(app(\app\service\TeamEntityField::class)->get((int) $request->team_id, $id));
    }

    public function create(\think\Request $request)
    {
        $data = $request->post();
        $type = (string) ($data['entity_type'] ?? 'entity');
        $this->assertTypePermission($request, $type);
        app(\app\service\TeamEntityField::class)->create((int) $request->team_id, $data);
        return message('对象字段已创建');
    }

    public function update(\think\Request $request)
    {
        $id = (int) $request->post('id', 0);
        $type = app(\app\service\TeamEntityField::class)->typeFor((int) $request->team_id, $id);
        $this->assertTypePermission($request, $type);
        app(\app\service\TeamEntityField::class)->update(
            (int) $request->team_id,
            $id,
            $request->except(['id'], 'post')
        );
        return message('对象字段已更新');
    }

    public function delete(\think\Request $request)
    {
        $id = (int) $request->post('id', 0);
        $type = app(\app\service\TeamEntityField::class)->typeFor((int) $request->team_id, $id);
        $this->assertTypePermission($request, $type);
        app(\app\service\TeamEntityField::class)->delete((int) $request->team_id, $id);
        return message('对象字段已删除');
    }

    public function values(\think\Request $request)
    {
        $slug = (string) $request->param('slug', '');
        $this->assertEntityPermission($request, $slug);
        return success(app(\app\service\TeamEntityField::class)->values((int) $request->team_id, $slug));
    }

    public function saveValues(\think\Request $request)
    {
        $slug = (string) $request->post('slug', '');
        $this->assertEntityPermission($request, $slug);
        app(\app\service\TeamEntityField::class)->saveValues(
            (int) $request->team_id,
            $slug,
            (array) $request->post('values', [])
        );
        return message('字段值已保存');
    }

    private function assertTypePermission(\think\Request $request, string $type): void
    {
        $key = match ($type) {
            'customer' => Permissions::TEAM_ENTITY_FIELD_CUSTOMER_MANAGE,
            'virtual' => Permissions::CHAT_VIRTUAL_ALL_FIELD_MANAGE,
            default => Permissions::TEAM_ENTITY_FIELD_MANAGE,
        };
        app(\app\service\PermissionGate::class)->assert(
            (int) $request->team_id,
            (array) $request->acting_entity,
            [$key]
        );
    }

    private function assertEntityPermission(\think\Request $request, string $slug): void
    {
        $actor = app(\app\service\ChatActor::class)->resolve((int) $request->team_id, $slug);
        $keys = $actor['type'] === \app\enum\ChatActorType::Virtual
            ? [
                Permissions::CHAT_VIRTUAL_ALL_FIELD_MANAGE,
                Permissions::virtual((string) $actor['slug'], 'field.manage'),
            ]
            : [Permissions::entityField($actor['type']->value)];
        app(\app\service\PermissionGate::class)->assert(
            (int) $request->team_id,
            (array) $request->acting_entity,
            $keys
        );
    }
}
