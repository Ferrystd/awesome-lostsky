<?php
declare(strict_types=1);

namespace app\team\controller;

use app\service\TeamMember as TeamMemberService;
use think\Request;

class Me
{
    private const PROFILE_FIELDS = ['nickname', 'avatar', 'description', 'intro_image', 'intro_video', 'introduction_markdown'];

    protected $middleware = [
        'JwtAuth', 'Context', 'EntityType:teamMember', 'TeamAuth', 'MemberAccess',
    ];

    /**
     * 获取自己在团队内的完整资料
     */
    public function get(Request $request)
    {
        $service = app(TeamMemberService::class);
        $result  = $service->get(
            $request->team_id,
            $request->member_id,
            $request->acting_entity
        );
        $fieldService = app(\app\service\TeamEntityField::class);
        $subjectEntityId = (int) ($result['entity_id'] ?? 0);
        $isFieldManager = app(\app\service\PermissionGate::class)->allows(
            $request->team_id,
            $request->acting_entity,
            [\app\service\PermissionDictionary::TEAM_ENTITY_FIELD_MANAGE]
        );
        $result['custom_fields'] = $fieldService->visibleFields(
            $request->team_id,
            'entity',
            $subjectEntityId,
            $request->acting_entity,
            $isFieldManager
        );
        $result['custom_field_values'] = $subjectEntityId > 0
            ? $fieldService->visibleValues(
                $request->team_id,
                $subjectEntityId,
                'entity',
                $request->acting_entity,
                $isFieldManager
            )
            : [];
        $roleSummary = empty($result['slug'])
            ? ['role_assignments' => [], 'effective_permissions' => []]
            : app(\app\service\EntityRole::class)->summary(
                $request->team_id,
                (string) $result['slug']
            );
        $result = array_merge($result, $roleSummary);
        return success($result);
    }

    /**
     * 编辑自己在团队内的资料
     */
    public function edit(Request $request)
    {
        $data = $request->only(self::PROFILE_FIELDS, 'post');

        $service = app(TeamMemberService::class);
        $service->edit($request->team_id, $request->member_id, $data);

        return message('资料已更新');
    }

    public function slug(Request $request)
    {
        $identity = app(\app\service\Entity::class)->claimMember(
            $request->team_id,
            $request->member_id,
            $request->post('slug/s', '')
        );

        return success(['slug' => $identity->slug], '成员标识已确定');
    }

    public function fields(Request $request)
    {
        $member = app(TeamMemberService::class)->get(
            $request->team_id,
            $request->member_id,
            $request->acting_entity
        );
        $slug = (string) ($member['slug'] ?? '');
        if ($slug === '') {
            throw new \think\exception\HttpException(422, '请先确定对象标识');
        }

        app(\app\service\TeamEntityField::class)->saveOwnValues(
            $request->team_id,
            $slug,
            $request->post('values/a', [])
        );

        return message('字段值已保存');
    }

}
