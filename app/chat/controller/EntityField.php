<?php
declare (strict_types = 1);

namespace app\chat\controller;

class EntityField
{
    protected $middleware = ['JwtAuth', 'Context', 'MemberAccess'];

    public function index(\think\Request $request)
    {
        $this->assertTypePermission($request, (string) $request->get('entity_type', 'member'));
        return success(app(\app\service\TeamEntityField::class)->list(
            (int) $request->team_id, (string) $request->get('entity_type', 'member')
        ));
    }

    public function create(\think\Request $request)
    {
        $type = (string) $request->post('entity_type', 'member');
        $this->assertTypePermission($request, $type);
        app(\app\service\TeamEntityField::class)->create((int) $request->team_id, [
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
        $slug = (string) $request->param('slug', '');
        $this->assertEntityPermission($request, $slug);
        return success(app(\app\service\TeamEntityField::class)->values((int) $request->team_id, $slug));
    }

    public function saveValues(\think\Request $request)
    {
        $slug = (string) $request->param('slug', '');
        $this->assertEntityPermission($request, $slug);
        app(\app\service\TeamEntityField::class)->saveValues(
            (int) $request->team_id, $slug, (array) $request->post('values', [])
        );
        return message('字段值已保存');
    }

    private function assertTypePermission(\think\Request $request, string $type): void
    {
        $key = match ($type) {
            'customer' => 'team.entity_field.customer.manage',
            'virtual' => 'chat.virtual.*.field.manage',
            default => 'team.entity_field.member.manage',
        };
        app(\app\service\PermissionGate::class)->assert((int) $request->team_id, (int) $request->member_id, [$key]);
    }

    private function assertEntityPermission(\think\Request $request, string $slug): void
    {
        $actor = app(\app\service\ChatActor::class)->resolve((int) $request->team_id, $slug);
        $keys = $actor['type'] === \app\enum\ChatActorType::Virtual
            ? ['chat.virtual.*.field.manage', "chat.virtual.{$slug}.field.manage"]
            : ["team.entity_field.{$actor['type']->value}.manage"];
        app(\app\service\PermissionGate::class)->assert((int) $request->team_id, (int) $request->member_id, $keys);
    }
}
