<?php
declare(strict_types=1);

namespace app\team\controller;

use app\service\TeamJoin;
use think\Request;

class JoinReview
{
    protected $middleware = [
        'JwtAuth'    => ['only' => ['index', 'get', 'review', 'reject', 'approve', 'saveTasks', 'setTaskPassed']],
        'Context'    => ['only' => ['index', 'get', 'review', 'reject', 'approve', 'saveTasks', 'setTaskPassed']],
        'EntityType:team,teamMember,teamCustomer,teamVirtual' => ['only' => ['index', 'get', 'review', 'reject', 'approve', 'saveTasks', 'setTaskPassed']],
        'TeamBelongs' => ['only' => ['index', 'get', 'review', 'reject', 'approve', 'saveTasks', 'setTaskPassed']],
        'TeamAccess' => ['only' => ['index', 'get', 'review', 'reject', 'approve', 'saveTasks', 'setTaskPassed']],
    ];

    public function index(Request $request)
    {
        $service = app(TeamJoin::class);
        $result = $service->list($request->team_id, [
            'status' => $request->get('status'),
            'user_id' => $request->get('user_id'),
        ], (int) $request->get('page', 1), (int) $request->get('limit', 20));

        return success($result);
    }

    public function get(Request $request)
    {
        $id = (int) $request->get('id', 0);

        $service = app(TeamJoin::class);

        return success($service->get($request->team_id, $id));
    }

    public function review(Request $request)
    {
        $id = (int) $request->post('id', 0);

        $service = app(TeamJoin::class);
        $service->startReview($request->team_id, $id);

        return message('申请已进入审核中');
    }

    public function reject(Request $request)
    {
        $id = (int) $request->post('id', 0);

        $service = app(TeamJoin::class);
        $service->reject($request->team_id, $id, (string) $request->post('memo', ''));

        return message('申请已拒绝');
    }

    public function approve(Request $request)
    {
        $id = (int) $request->post('id', 0);

        $service = app(TeamJoin::class);
        $memberId = $service->approve($request->team_id, $id);

        return success(['member_id' => $memberId], '申请已同意');
    }

    public function saveTasks(Request $request)
    {
        $id = (int) $request->post('id', 0);

        $service = app(TeamJoin::class);
        $service->saveTasks($request->team_id, $id, $request->post('tasks', []));

        return message('审核任务已保存');
    }

    public function setTaskPassed(Request $request)
    {
        $id = (int) $request->post('id', 0);
        $taskId = (int) $request->post('task_id', 0);

        $service = app(TeamJoin::class);
        $service->setTaskPassed($request->team_id, $id, $taskId, (bool) $request->post('is_passed', false));

        return message('审核任务状态已更新');
    }
}
