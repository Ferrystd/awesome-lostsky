<?php
declare (strict_types = 1);

namespace app\chat\controller;

use app\service\PermissionDictionary as Permissions;

class EntityField
{
    protected $middleware = [
        'JwtAuth', 'Context', 'EntityType:team,teamMember,teamCustomer,teamVirtual',
        'TeamAuth',
    ];

    public function index(\think\Request $request)
    {
        $this->assertTypePermission($request, $request->get('entity_type/s', 'entity'));
        return success(app(\app\service\TeamEntityField::class)->list(
            $request->team_id, $request->get('entity_type/s', 'entity')
        ));
    }

    public function create(\think\Request $request)
    {
        $type = $request->post('entity_type/s', 'entity');
        $this->assertTypePermission($request, $type);
        app(\app\service\TeamEntityField::class)->create($request->team_id, [
            'entity_type' => $type, 'field_key' => $request->post('field_key', ''),
            'name' => $request->post('name', ''), 'value_type' => $request->post('value_type', 'string'),
            'input_type' => $request->post('input_type', 'text'), 'options' => $request->post('options'),
            'is_required' => $request->post('is_required', 0), 'is_editable' => $request->post('is_editable', 1),
            'is_searchable' => $request->post('is_searchable', 0), 'is_visible' => $request->post('is_visible', 0),
            'sort' => $request->post('sort', 0),
        ]);
        return message('对象字段已创建');
    }

    public function values(\think\Request $request)
    {
        $slug = $request->get('slug/s', '');
        $this->assertEntityPermission($request, $slug);
        return success(app(\app\service\TeamEntityField::class)->values($request->team_id, $slug));
    }

    public function saveValues(\think\Request $request)
    {
        $slug = $request->post('slug/s', '');
        $this->assertEntityPermission($request, $slug);
        app(\app\service\TeamEntityField::class)->saveValues(
            $request->team_id, $slug, $request->post('values/a', [])
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
        app(\app\service\PermissionGate::class)->assert($request->team_id, $request->acting_entity, [$key]);
    }

    private function assertEntityPermission(\think\Request $request, string $slug): void
    {
        $actor = app(\app\service\ChatActor::class)->resolve($request->team_id, $slug);
        $keys = $actor['type'] === \app\enum\ChatActorType::Virtual
            ? [
                Permissions::CHAT_VIRTUAL_ALL_FIELD_MANAGE,
                Permissions::virtual($slug, 'field.manage'),
            ]
            : [Permissions::entityField($actor['type']->value)];
        app(\app\service\PermissionGate::class)->assert($request->team_id, $request->acting_entity, $keys);
    }
}
