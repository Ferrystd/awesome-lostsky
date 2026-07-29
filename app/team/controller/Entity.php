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
        'EntityType:team,teamMember,teamCustomer,teamVirtual' => ['only' => ['search', 'resolve', 'options', 'index', 'get', 'profile', 'display']],
        'TeamAuth' => ['only' => ['search', 'resolve', 'options', 'index', 'get', 'profile', 'display']],
        'Permission:' . Permissions::TEAM_ENTITY_READ => ['only' => ['index', 'get']],
        'Permission:' . Permissions::TEAM_ENTITY_PROFILE_MANAGE => ['only' => ['profile', 'display']],
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

        return success(app(\app\service\Entity::class)->resolve($slugs, $request->user_id));
    }

    public function options(Request $request)
    {
        return success(app(\app\service\Entity::class)->optionsForTeam($request->team_id));
    }

    public function index(Request $request)
    {
        $type = $request->get('type');
        if (!in_array($type, [null, '', 'team', 'teamMember', 'teamCustomer', 'teamVirtual'], true)) return error('实体类型不正确', 1, 422);
        return success(app(EntityProfile::class)->listing($request->team_id, $type ?: null, $request->get('page/d', 1), $request->get('limit/d', 20)));
    }

    public function get(Request $request)
    {
        return success(app(EntityProfile::class)->get($request->team_id, $request->get('entity_id/d', 0)));
    }

    public function profile(Request $request)
    {
        app(EntityProfile::class)->update($request->team_id, $request->post('entity_id/d', 0), $request->only(EntityProfile::FIELDS, 'post'));
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
            $entityId
        );

        return message('公开展示设置已更新');
    }
}
