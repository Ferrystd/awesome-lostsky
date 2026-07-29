<?php
declare(strict_types=1);

namespace app\team\controller;

use app\service\TeamJoin;
use think\Request;

class Join
{
    protected $middleware = [
        'JwtAuth'   => ['only' => ['form', 'apply', 'mine', 'get', 'cancel', 'upload']],
        'Context'   => ['only' => ['form', 'apply', 'mine', 'get', 'cancel', 'upload']],
        'EntityType:teamless' => ['only' => ['form', 'apply', 'mine', 'get', 'cancel', 'upload']],
        'TeamGuest' => ['only' => ['form', 'apply', 'upload']],
    ];

    public function form(Request $request)
    {
        $service = app(TeamJoin::class);

        return success($service->fields($request->team_id, true));
    }

    public function apply(Request $request)
    {
        $service = app(TeamJoin::class);
        $id = $service->apply($request->team_id, $request->user_id, [
            'values' => $request->post('values', []),
            'memo' => $request->post('memo'),
        ]);

        return success(['id' => $id], '申请已提交');
    }

    public function mine(Request $request)
    {
        $service = app(TeamJoin::class);

        return success($service->mine($request->team_id, $request->user_id));
    }

    public function get(Request $request)
    {
        $id = $request->get('id/d', 0);

        $service = app(TeamJoin::class);

        return success($service->get($request->team_id, $id, $request->user_id));
    }

    public function cancel(Request $request)
    {
        $id = $request->post('id/d', 0);

        $service = app(TeamJoin::class);
        $service->cancel($request->team_id, $request->user_id, $id);

        return message('申请已取消');
    }

    public function upload(Request $request)
    {
        $file = $request->file('file');
        if (!$file) {
            return error('请选择文件', 1, 422);
        }

        $service = app(TeamJoin::class);

        return success($service->upload($file, $request->team_id), '上传成功');
    }
}
