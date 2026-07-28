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
        $result  = $service->get($request->team_id, $request->member_id);
        $fieldService = app(\app\service\TeamEntityField::class);
        $result['custom_fields'] = array_values(array_filter(
            $fieldService->list((int) $request->team_id, 'entity'),
            static fn (array $field): bool => (int) ($field['is_visible'] ?? 0) === 1
        ));
        $visibleFieldIds = array_fill_keys(array_map(
            static fn (array $field): int => (int) $field['id'],
            $result['custom_fields']
        ), true);
        $result['custom_field_values'] = empty($result['slug'])
            ? []
            : array_values(array_filter(
                $fieldService->values((int) $request->team_id, (string) $result['slug']),
                static fn (array $value): bool => isset($visibleFieldIds[(int) ($value['field_id'] ?? 0)])
            ));
        $roleSummary = empty($result['slug'])
            ? ['role_assignments' => [], 'effective_permissions' => []]
            : app(\app\service\EntityRole::class)->summary(
                (int) $request->team_id,
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
            (int) $request->team_id,
            (int) $request->member_id,
            (string) $request->post('slug', '')
        );

        return success(['slug' => $identity->slug], '成员标识已确定');
    }

    public function fields(Request $request)
    {
        $member = app(TeamMemberService::class)->get(
            (int) $request->team_id,
            (int) $request->member_id
        );
        $slug = (string) ($member['slug'] ?? '');
        if ($slug === '') {
            throw new \think\exception\HttpException(422, '请先确定对象标识');
        }

        app(\app\service\TeamEntityField::class)->saveOwnValues(
            (int) $request->team_id,
            $slug,
            (array) $request->post('values', [])
        );

        return message('字段值已保存');
    }

}
