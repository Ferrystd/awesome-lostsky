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
        $input = $request->post();
        $type = (string) ($input['entity_type'] ?? 'entity');
        $this->assertTypePermission($request, $type);
        $data = [
            'entity_type' => $type, 'field_key' => $input['field_key'] ?? '',
            'name' => $input['name'] ?? '', 'value_type' => $input['value_type'] ?? 'string',
            'input_type' => $input['input_type'] ?? 'text', 'options' => $input['options'] ?? null,
            'is_required' => $input['is_required'] ?? 0,
            'is_searchable' => $input['is_searchable'] ?? 0,
            'sort' => $input['sort'] ?? 0,
        ];
        foreach (['manager_scope', 'visibility', 'visibility_targets'] as $key) {
            if (array_key_exists($key, $input)) {
                $data[$key] = $input[$key];
            }
        }
        $id = app(\app\service\TeamEntityField::class)->create($request->team_id, $data);
        app(\app\service\BusinessAudit::class)->record(
            $request, 'chat', 'create', 'entityField', $id,
            ['changed_fields' => array_keys($data)]
        );
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
        $values = $request->post('values/a', []);
        $entityId = app(\app\service\TeamEntityField::class)->saveValues(
            $request->team_id, $slug, $request->post('values/a', [])
        );
        app(\app\service\BusinessAudit::class)->record(
            $request, 'chat', 'save', 'entityFieldValues', $entityId,
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
        app(\app\service\PermissionGate::class)->assert($request->team_id, $request->acting_entity, [$key]);
    }

    private function assertEntityPermission(\think\Request $request, string $slug): void
    {
        $actor = app(\app\service\ChatActor::class)->resolve($request->team_id, $slug);
        $keys = $actor['type'] === \app\enum\ChatActorType::Virtual
            ? [
                Permissions::TEAM_ENTITY_VIRTUAL_ALL_FIELD_MANAGE,
                Permissions::virtual($slug, 'field.manage'),
            ]
            : [Permissions::entityField($actor['type']->value)];
        app(\app\service\PermissionGate::class)->assert($request->team_id, $request->acting_entity, $keys);
    }
}
