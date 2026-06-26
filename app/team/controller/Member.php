<?php
declare(strict_types=1);

namespace app\team\controller;

use app\service\TeamMember as TeamMemberService;
use think\Request;

class Member
{
    private const PROFILE_FIELDS = ['nickname', 'avatar', 'intro_image', 'intro_video', 'introduction_markdown'];

    protected $middleware = [
        'JwtAuth'      => ['only' => ['index', 'get', 'add', 'edit', 'block', 'unblock', 'remove']],
        'Context'      => ['only' => ['index', 'get', 'add', 'edit', 'block', 'unblock', 'remove']],
        'MemberAccess' => ['only' => ['index', 'get', 'add', 'edit', 'block', 'unblock', 'remove']],
        'TeamAccess'   => ['only' => ['add', 'edit', 'block', 'unblock', 'remove']],
    ];

    /**
     * 获取所有成员
     */
    public function index(Request $request)
    {
        $service = app(TeamMemberService::class);
        $result  = $service->list($request->team_id);

        return success($result);
    }

    /**
     * 获取单个成员
     */
    public function get(Request $request)
    {
        $memberId = (int) $request->param('member_id', 0);

        $service = app(TeamMemberService::class);
        $result  = $service->get($request->team_id, $memberId);

        return success($result);
    }

    /**
     * 添加成员
     */
    public function add(Request $request)
    {
        $userId = (int) $request->post('user_id', 0);
        $data   = $request->only(self::PROFILE_FIELDS, 'post');
        $data['post_type_ids'] = $request->post('post_type_ids', []);

        $service = app(TeamMemberService::class);
        $service->add($request->team_id, $userId, $data);

        return message('成员已添加');
    }

    /**
     * 编辑成员
     */
    public function edit(Request $request)
    {
        $memberId = (int) $request->post('member_id', 0);

        $data = $request->only(self::PROFILE_FIELDS, 'post');
        if ($request->has('is_displayed')) {
            $data['is_displayed'] = (int) $request->post('is_displayed');
        }
        if ($request->has('post_type_ids')) {
            $data['post_type_ids'] = $request->post('post_type_ids', []);
        }

        $service = app(TeamMemberService::class);
        $service->edit($request->team_id, $memberId, $data);

        return message('成员已更新');
    }

    /**
     * 封禁成员
     */
    public function block(Request $request)
    {
        $memberId = (int) $request->post('member_id', 0);

        $service = app(TeamMemberService::class);
        $service->block($request->team_id, $memberId);

        return message('成员已封禁');
    }

    /**
     * 解封成员
     */
    public function unblock(Request $request)
    {
        $memberId = (int) $request->post('member_id', 0);

        $service = app(TeamMemberService::class);
        $service->unblock($request->team_id, $memberId);

        return message('成员已解封');
    }

    /**
     * 移出成员
     */
    public function remove(Request $request)
    {
        $memberId = (int) $request->post('member_id', 0);

        $service = app(TeamMemberService::class);
        $service->remove($request->team_id, $memberId);

        return message('成员已移出');
    }
}
