<?php
declare (strict_types = 1);

namespace app\team\controller;

use app\service\EntityProfile;
use app\service\PermissionDictionary as Permissions;
use think\Request;

class Entity
{
    protected $middleware = [
        'JwtAuth', 'Context',
        'EntityType:team,teamMember,teamCustomer,teamVirtual' => ['only' => ['search', 'resolve', 'options', 'index', 'get', 'profile', 'display', 'visibility', 'presentation']],
        'TeamAuth' => ['only' => ['search', 'resolve', 'options', 'index', 'get', 'profile', 'display', 'visibility', 'presentation']],
        'Permission:' . Permissions::TEAM_ENTITY_PROFILE_MANAGE => ['only' => ['profile', 'display', 'visibility', 'presentation']],
    ];

    public function search(Request $request)
    {
        $result = app(\app\service\Entity::class)->search(
            $request->get('keyword/s', ''),
            $request->get('limit/d', 10),
            $request->user_id
        );

        return success($result);
    }

    public function resolve(Request $request)
    {
        $slugs = $request->get('slugs', []);
        if (!is_array($slugs)) {
            $slugs = explode(',', (string) $slugs);
        }

        // [Copilot] 传入 team_id，使 resolve() 能区分同团队显式引用与跨团队搜索可见性。
        return success(app(\app\service\Entity::class)->resolve(
            $slugs,
            $request->user_id,
            $request->team_id
        ));
    }

    public function options(Request $request)
    {
        return success(app(\app\service\Entity::class)->optionsForTeam(
            $request->team_id,
            $this->canReadAll($request)
        ));
    }

    public function index(Request $request)
    {
        $type = $request->get('type');
        if (!in_array($type, [null, '', 'team', 'teamMember', 'teamCustomer', 'teamVirtual'], true)) return error('实体类型不正确', 1, 422);
        return success(app(EntityProfile::class)->listing(
            $request->team_id,
            $type ?: null,
            $request->get('page/d', 1),
            $request->get('limit/d', 20),
            $this->canReadAll($request)
        ));
    }

    public function get(Request $request)
    {
        $result = app(EntityProfile::class)->get(
            $request->team_id,
            $request->get('entity_id/d', 0),
            $this->canReadAll($request)
        );
        $result['capabilities'] = [
            'read_all' => $this->canReadAll($request),
            'manage_profile' => $this->canManageProfile($request),
        ];
        return success($result);
    }

    public function profile(Request $request)
    {
        $entityId = $request->post('entity_id/d', 0);
        $data = $request->only(EntityProfile::FIELDS, 'post');
        app(EntityProfile::class)->update($request->team_id, $entityId, $data);
        app(\app\service\BusinessAudit::class)->record(
            $request, 'team', 'update', 'entity', $entityId,
            ['changed_fields' => array_keys($data), 'changed' => $data !== []]
        );
        return message('实体资料已更新');
    }

    public function display(Request $request)
    {
        $input = $request->post();
        if (!array_key_exists('is_displayed', $input)) {
            return error('请提供公开展示设置', 1, 422);
        }

        $entityId = $request->post('entity_id/d', 0);
        app(\app\service\Entity::class)->setDisplay(
            $request->team_id,
            $entityId,
            $input['is_displayed']
        );
        app(\app\service\BusinessAudit::class)->record(
            $request,
            'team',
            'update',
            'entity_display',
            $entityId,
            ['changed_fields' => ['is_displayed'], 'changes' => [['field' => 'is_displayed', 'after' => (bool) $input['is_displayed']]]]
        );

        return message('公开展示设置已更新');
    }

    public function visibility(Request $request)
    {
        $input = $request->post();
        if (!array_key_exists('is_internal_visible', $input)) {
            return error('请提供团队内可见设置', 1, 422);
        }

        $entityId = $request->post('entity_id/d', 0);
        app(\app\service\Entity::class)->setInternalVisibility(
            $request->team_id,
            $entityId,
            $input['is_internal_visible']
        );
        app(\app\service\BusinessAudit::class)->record(
            $request,
            'team',
            'update',
            'entity_internal_visibility',
            $entityId,
            ['changed_fields' => ['is_internal_visible'], 'changes' => [['field' => 'is_internal_visible', 'after' => (bool) $input['is_internal_visible']]]]
        );

        return message('团队内可见设置已更新');
    }

    public function presentation(Request $request)
    {
        $input = $request->post();
        if (!array_key_exists('is_displayed', $input) || !array_key_exists('is_internal_visible', $input)) {
            return error('请提供完整的可见性设置', 1, 422);
        }

        $entityId = $request->post('entity_id/d', 0);
        $result = app(\app\service\Entity::class)->updatePresentation(
            $request,
            $request->team_id,
            $entityId,
            $input['is_internal_visible'],
            $input['is_displayed']
        );

        return success($result, '可见性设置已更新');
    }

    private function canReadAll(Request $request): bool
    {
        return app(\app\service\PermissionGate::class)->allows(
            $request->team_id,
            $request->acting_entity,
            [Permissions::TEAM_ENTITY_READ]
        );
    }

    private function canManageProfile(Request $request): bool
    {
        return app(\app\service\PermissionGate::class)->allows(
            $request->team_id,
            $request->acting_entity,
            [Permissions::TEAM_ENTITY_PROFILE_MANAGE]
        );
    }
}
