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
        'JwtAuth'      => ['only' => ['index', 'get', 'add', 'joinForm', 'joinUpload', 'edit', 'block', 'unblock', 'slug', 'search']],
        'Context'      => ['only' => ['index', 'get', 'add', 'joinForm', 'joinUpload', 'edit', 'block', 'unblock', 'slug', 'search']],
        'EntityType:team,teamMember,teamCustomer,teamVirtual' => ['only' => ['index', 'get', 'add', 'joinForm', 'joinUpload', 'edit', 'block', 'unblock', 'slug', 'search']],
        'TeamWorkspaceAuth' => ['only' => ['index', 'get', 'add', 'joinForm', 'joinUpload', 'edit', 'block', 'unblock', 'slug', 'search']],
        'MemberAccess' => ['only' => ['add', 'joinForm', 'joinUpload', 'edit', 'block', 'unblock', 'slug', 'search']],
        'Permission:' . Permissions::TEAM_MEMBER_INVITE => ['only' => ['add', 'joinForm', 'joinUpload']],
        'Permission:' . Permissions::TEAM_MEMBER_UPDATE => ['only' => ['edit', 'block', 'unblock', 'slug', 'search']],
    ];

    /**
     * 获取所有成员
     */
    public function index(Request $request)
    {
        $service = app(TeamMemberService::class);
        $result  = $service->list(
            $request->team_id,
            $request->acting_entity,
            $request->get('status/s', '') ?: null
        );

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
        $joinForm = $request->post('join_form');
        if ($joinForm !== null && !is_array($joinForm)) {
            return error('入职表单数据格式不正确', 1, 422);
        }
        $memberId = app(\app\service\MemberJoinCode::class)->addMember(
            $request->team_id,
            $request->post('join_code/s', ''),
            $joinForm
        );
        app(\app\service\BusinessAudit::class)->record(
            $request, 'team', 'create', 'member', $memberId,
            ['changed_fields' => $joinForm === null ? ['user_id'] : ['user_id', 'join_form']]
        );

        return message('成员已添加');
    }

    public function joinForm(Request $request)
    {
        return success([
            'fields' => app(\app\service\TeamJoin::class)->fields($request->team_id, true),
            'file_upload' => app(\app\service\File::class)->uploadAvailability($request->team_id),
        ]);
    }

    public function joinUpload(Request $request)
    {
        $file = $request->file('file');
        if (!$file) {
            return error('请选择文件', 1, 422);
        }
        $result = app(\app\service\TeamJoin::class)->upload($file, $request->team_id);
        app(\app\service\BusinessAudit::class)->record(
            $request, 'team', 'upload', 'joinApplicationFile',
            isset($result['id']) ? (int) $result['id'] : null
        );
        return success($result, '上传成功');
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
        app(\app\service\BusinessAudit::class)->record(
            $request, 'team', 'update', 'member', $memberId,
            ['changed_fields' => array_keys($data), 'changed' => $data !== []]
        );

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
        app(\app\service\BusinessAudit::class)->record(
            $request, 'team', 'block', 'member', $memberId,
            ['changed_fields' => ['status'], 'changes' => [['field' => 'status', 'before' => 'active', 'after' => 'blocked']]]
        );

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
        app(\app\service\BusinessAudit::class)->record(
            $request, 'team', 'unblock', 'member', $memberId,
            ['changed_fields' => ['status'], 'changes' => [['field' => 'status', 'before' => 'blocked', 'after' => 'active']]]
        );

        return message('成员已解封');
    }

    public function slug(Request $request)
    {
        $memberId = $request->post('member_id/d', 0);

        $identity = app(\app\service\Entity::class)->claimMember(
            $request->team_id,
            $memberId,
            $request->post('slug/s', '')
        );
        app(\app\service\BusinessAudit::class)->record(
            $request, 'team', 'setSlug', 'member', $memberId,
            ['changed_fields' => ['slug']]
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
        $memberId = $request->post('member_id/d', 0);
        app(\app\service\BusinessAudit::class)->record(
            $request, 'team', 'setSearch', 'member', $memberId,
            ['changed_fields' => ['search_override']]
        );

        return message('成员搜索设置已更新');
    }
}
