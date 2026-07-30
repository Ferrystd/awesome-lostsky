<?php
declare(strict_types=1);

namespace app\team\controller;

use app\service\TeamMember as TeamMemberService;
use app\service\PermissionDictionary as Permissions;
use think\Request;

class Member
{
    private const PROFILE_FIELDS = [];

    protected $middleware = [
        'JwtAuth'      => ['only' => ['index', 'get', 'add', 'edit', 'block', 'unblock', 'remove', 'slug', 'search']],
        'Context'      => ['only' => ['index', 'get', 'add', 'edit', 'block', 'unblock', 'remove', 'slug', 'search']],
        'EntityType:team,teamMember,teamCustomer,teamVirtual' => ['only' => ['index', 'get', 'add', 'edit', 'block', 'unblock', 'remove', 'slug', 'search']],
        'TeamAuth'     => ['only' => ['index', 'get', 'add', 'edit', 'block', 'unblock', 'remove', 'slug', 'search']],
        'MemberAccess' => ['only' => ['add', 'edit', 'block', 'unblock', 'remove', 'slug', 'search']],
        'Permission:' . Permissions::TEAM_MEMBER_INVITE => ['only' => ['add']],
        'Permission:' . Permissions::TEAM_MEMBER_UPDATE => ['only' => ['edit', 'block', 'unblock', 'slug', 'search']],
        'Permission:' . Permissions::TEAM_MEMBER_REMOVE => ['only' => ['remove']],
    ];

    /**
     * 获取所有成员
     */
    public function index(Request $request)
    {
        $service = app(TeamMemberService::class);
        $result  = $service->list($request->team_id, $request->acting_entity);

        return success($result);
    }

    /**
     * 获取单个成员
     */
    public function get(Request $request)
    {
        $memberId = $request->get('member_id/d', 0);

        $service = app(TeamMemberService::class);
        $result  = $service->get($request->team_id, $memberId, $request->acting_entity);
        $result['capabilities'] = $service->capabilities(
            $request->team_id,
            $request->acting_entity,
            $result
        );
        return success($result);
    }

    /**
     * 添加成员
     */
    public function add(Request $request)
    {
        $userId = $request->post('user_id/d', 0);
        $data   = $request->only(self::PROFILE_FIELDS, 'post');

        $service = app(TeamMemberService::class);
        $service->add($request->team_id, $userId, $data);

        return message('成员已添加');
    }

    /**
     * 编辑成员
     */
    public function edit(Request $request)
    {
        $memberId = $request->post('member_id/d', 0);

        $data = $request->only(self::PROFILE_FIELDS, 'post');

        $service = app(TeamMemberService::class);
        $service->edit($request->team_id, $memberId, $data);

        return message('成员已更新');
    }

    /**
     * 封禁成员
     */
    public function block(Request $request)
    {
        $memberId = $request->post('member_id/d', 0);

        $service = app(TeamMemberService::class);
        $service->block($request->team_id, $memberId);

        return message('成员已封禁');
    }

    /**
     * 解封成员
     */
    public function unblock(Request $request)
    {
        $memberId = $request->post('member_id/d', 0);

        $service = app(TeamMemberService::class);
        $service->unblock($request->team_id, $memberId);

        return message('成员已解封');
    }

    /**
     * 移出成员
     */
    public function remove(Request $request)
    {
        $memberId = $request->post('member_id/d', 0);

        $service = app(TeamMemberService::class);
        $service->remove($request->team_id, $memberId);

        return message('成员已移出');
    }

    public function slug(Request $request)
    {
        $memberId = $request->post('member_id/d', 0);

        $identity = app(\app\service\Entity::class)->claimMember(
            $request->team_id,
            $memberId,
            $request->post('slug/s', '')
        );

        return success(['slug' => $identity->slug], '成员标识已确定');
    }

    public function search(Request $request)
    {
        $input = $request->post();
        if (!array_key_exists('search_override', $input)) {
            return error('请提供成员搜索设置', 1, 422);
        }

        app(\app\service\Entity::class)->setMemberSearch(
            $request->team_id,
            $request->post('member_id/d', 0),
            $input['search_override']
        );

        return message('成员搜索设置已更新');
    }
}
