<?php
declare(strict_types=1);

namespace app\team\controller;

use app\service\TeamMember as TeamMemberService;
use think\Request;

class Me
{
    private const PROFILE_FIELDS = ['nickname', 'avatar', 'description', 'intro_image', 'intro_video', 'introduction_markdown'];

    protected $middleware = ['JwtAuth', 'Context', 'MemberAccess'];

    /**
     * 获取自己在团队内的完整资料
     */
    public function get(Request $request)
    {
        $service = app(TeamMemberService::class);
        $result  = $service->get($request->team_id, $request->member_id);
        $fieldService = app(\app\service\TeamMemberField::class);
        $result['custom_fields'] = $fieldService->list(
            (int) $request->team_id,
            ['source' => 'custom'],
            (int) $request->user_id,
            (int) $request->member_id
        );
        $result['custom_field_values'] = $fieldService->values(
            (int) $request->team_id,
            (int) $request->member_id,
            (int) $request->user_id,
            (int) $request->member_id
        );

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
}
