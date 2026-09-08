<?php
declare(strict_types=1);

namespace app\team\controller;

use app\service\TeamJoin;
use app\service\PermissionDictionary as Permissions;
use think\Request;

class JoinReview
{
    protected $middleware = [
        'JwtAuth'    => ['only' => ['index', 'get', 'review', 'reject', 'approve', 'saveTasks', 'setTaskPassed']],
        'Context'    => ['only' => ['index', 'get', 'review', 'reject', 'approve', 'saveTasks', 'setTaskPassed']],
        'EntityType:team,teamMember,teamCustomer,teamVirtual' => ['only' => ['index', 'get', 'review', 'reject', 'approve', 'saveTasks', 'setTaskPassed']],
        'TeamWorkspaceAuth' => ['only' => ['index', 'get', 'review', 'reject', 'approve', 'saveTasks', 'setTaskPassed']],
        'Permission:' . Permissions::TEAM_JOIN_REVIEW_READ => ['only' => ['index', 'get']],
        'Permission:' . Permissions::TEAM_JOIN_REVIEW_WRITE => ['only' => ['review', 'reject', 'approve', 'saveTasks', 'setTaskPassed']],
    ];

    public function index(Request $request)
    {
        $service = app(TeamJoin::class);
        $result = $service->list($request->team_id, [
            'status' => $request->get('status'),
            'user_id' => $request->get('user_id'),
        ], $request->get('page/d', 1), $request->get('limit/d', 20));

        return success($result);
    }

    public function get(Request $request)
    {
        $id = $request->get('id/d', 0);

        $service = app(TeamJoin::class);

        return success($service->get($request->team_id, $id));
    }

    public function review(Request $request)
    {
        $id = $request->post('id/d', 0);

        $service = app(TeamJoin::class);
        $service->startReview($request->team_id, $id);
        app(\app\service\BusinessAudit::class)->record(
            $request, 'team', 'update', 'joinApplication', $id,
            ['changed_fields' => ['status'], 'changes' => [['field' => 'status', 'after' => 'reviewing']]]
        );

        return message('申请已进入审核中');
    }

    public function reject(Request $request)
    {
        $id = $request->post('id/d', 0);

        $service = app(TeamJoin::class);
        $service->reject($request->team_id, $id, $request->post('memo/s', ''));
        app(\app\service\BusinessAudit::class)->record(
            $request, 'team', 'reject', 'joinApplication', $id,
            ['changed_fields' => ['status', 'memo']]
        );

        return message('申请已拒绝');
    }

    public function approve(Request $request)
    {
        $id = $request->post('id/d', 0);

        $service = app(TeamJoin::class);
        $memberId = $service->approve($request->team_id, $id);
        app(\app\service\BusinessAudit::class)->record(
            $request, 'team', 'approve', 'joinApplication', $id,
            ['changed_fields' => ['status', 'member_id'], 'member_id' => $memberId]
        );

        return success(['member_id' => $memberId], '申请已同意');
    }

    public function saveTasks(Request $request)
    {
        $id = $request->post('id/d', 0);

        $service = app(TeamJoin::class);
        $tasks = $request->post('tasks', []);
        $service->saveTasks($request->team_id, $id, $tasks);
        app(\app\service\BusinessAudit::class)->record(
            $request, 'team', 'setTasks', 'joinApplication', $id,
            ['changed_fields' => ['tasks'], 'task_count' => is_array($tasks) ? count($tasks) : 0]
        );

        return message('审核任务已保存');
    }

    public function setTaskPassed(Request $request)
    {
        $id = $request->post('id/d', 0);
        $taskId = $request->post('task_id/d', 0);

        $service = app(TeamJoin::class);
        $isPassed = $request->post('is_passed/b', false);
        $service->setTaskPassed($request->team_id, $id, $taskId, $isPassed);
        app(\app\service\BusinessAudit::class)->record(
            $request, 'team', 'setTaskPassed', 'joinApplication', $id,
            ['changed_fields' => ['is_passed'], 'task_id' => $taskId, 'is_passed' => $isPassed]
        );

        return message('审核任务状态已更新');
    }
}
