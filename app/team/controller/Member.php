<?php
declare(strict_types=1);

namespace app\team\controller;

use app\service\TeamMember as TeamMemberService;
use think\Request;

class Member
{
    private const PROFILE_FIELDS = ['nickname', 'avatar', 'description', 'intro_image', 'intro_video', 'introduction_markdown'];

    protected $middleware = [
        'JwtAuth'      => ['only' => ['index', 'get', 'add', 'edit', 'block', 'unblock', 'remove', 'slug', 'search']],
        'Context'      => ['only' => ['index', 'get', 'add', 'edit', 'block', 'unblock', 'remove', 'slug', 'search']],
        'MemberAccess' => ['only' => ['index', 'get', 'add', 'edit', 'block', 'unblock', 'remove', 'slug', 'search']],
        'TeamAccess'   => ['only' => ['add', 'edit', 'block', 'unblock', 'remove', 'slug', 'search']],
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

    public function slug(Request $request)
    {
        $memberId = (int) $request->post('member_id', 0);
        if (!\app\model\TeamMember::where('team_id', (int) $request->team_id)->find($memberId)) {
            return error('成员不存在', 1, 404);
        }

        $identity = app(\app\service\EntityIdentity::class)->claimMember(
            $memberId,
            (string) $request->post('slug', '')
        );

        return success(['slug' => $identity->slug], '成员标识已确定');
    }

    public function search(Request $request)
    {
        $input = $request->post();
        if (!array_key_exists('search_override', $input)) {
            return error('请提供成员搜索设置', 1, 422);
        }

        app(\app\service\EntityIdentity::class)->setMemberSearch(
            (int) $request->team_id,
            (int) $request->post('member_id', 0),
            $input['search_override']
        );

        return message('成员搜索设置已更新');
    }
}
