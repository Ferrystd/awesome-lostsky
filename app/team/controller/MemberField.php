<?php
declare(strict_types=1);

namespace app\team\controller;

use think\Request;

class MemberField
{
    protected $middleware = [
        'JwtAuth'      => ['only' => ['index', 'get', 'add', 'edit', 'delete', 'values', 'saveValues']],
        'Context'      => ['only' => ['index', 'get', 'add', 'edit', 'delete', 'values', 'saveValues']],
        'EntityType:team,teamMember,teamCustomer,teamVirtual' => ['only' => ['index', 'get', 'add', 'edit', 'delete', 'values', 'saveValues']],
        'TeamBelongs'  => ['only' => ['index', 'get', 'add', 'edit', 'delete', 'values', 'saveValues']],
        'MemberAccess' => ['only' => ['index', 'get', 'add', 'edit', 'delete', 'values', 'saveValues']],
        'TeamAccess'   => ['only' => ['add', 'edit', 'delete']],
    ];

    /**
     * 获取成员字段定义列表
     */
    public function index(Request $request)
    {
        $service = app(\app\service\TeamMemberField::class);
        $result = $service->list($request->team_id, [
            'keyword' => $request->param('keyword', ''),
            'source'  => $request->param('source', ''),
        ], (int) $request->user_id, (int) $request->member_id);

        return success($result);
    }

    /**
     * 获取单个成员字段定义
     */
    public function get(Request $request)
    {
        $id = (int) $request->param('id', 0);

        $service = app(\app\service\TeamMemberField::class);
        $result = $service->get($request->team_id, $id, (int) $request->user_id, (int) $request->member_id);

        return success($result);
    }

    /**
     * 新增成员字段定义
     */
    public function add(Request $request)
    {
        $service = app(\app\service\TeamMemberField::class);
        $service->create($request->team_id, $request->post());

        return message('成员字段已新增');
    }

    /**
     * 编辑成员字段定义
     */
    public function edit(Request $request)
    {
        $id = (int) $request->post('id', 0);

        $service = app(\app\service\TeamMemberField::class);
        $service->update($request->team_id, $id, $request->except(['id'], 'post'));

        return message('成员字段已更新');
    }

    /**
     * 删除成员字段定义
     */
    public function delete(Request $request)
    {
        $id = (int) $request->post('id', 0);

        $service = app(\app\service\TeamMemberField::class);
        $service->delete($request->team_id, $id);

        return message('成员字段已删除');
    }

    /**
     * 获取成员字段值
     */
    public function values(Request $request)
    {
        $memberId = (int) $request->param('member_id', 0);

        $service = app(\app\service\TeamMemberField::class);
        $result = $service->values($request->team_id, $memberId, (int) $request->user_id, (int) $request->member_id);

        return success($result);
    }

    /**
     * 保存成员字段值
     */
    public function saveValues(Request $request)
    {
        $memberId = (int) $request->post('member_id', 0);
        $values = $request->post('values', []);

        $service = app(\app\service\TeamMemberField::class);
        $service->saveValues($request->team_id, $memberId, $values, (int) $request->user_id, (int) $request->member_id);

        return message('成员字段值已保存');
    }
}
