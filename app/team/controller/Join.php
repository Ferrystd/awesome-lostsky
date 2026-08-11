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

        return success($service->form($request->team_id, $request->user_id));
    }

    public function apply(Request $request)
    {
        $service = app(TeamJoin::class);
        $id = $service->apply($request->team_id, $request->user_id, [
            'values' => $request->post('values', []),
            'memo' => $request->post('memo'),
            'inviter_slug' => $request->post('inviter_slug/s', ''),
        ]);
        app(\app\service\BusinessAudit::class)->record(
            $request, 'team', 'apply', 'joinApplication', $id,
            ['changed_fields' => ['values', 'memo', 'inviter_slug']]
        );

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
        app(\app\service\BusinessAudit::class)->record(
            $request, 'team', 'cancel', 'joinApplication', $id
        );

        return message('申请已取消');
    }

    public function upload(Request $request)
    {
        $file = $request->file('file');
        if (!$file) {
            return error('请选择文件', 1, 422);
        }

        $service = app(TeamJoin::class);

        $result = $service->upload($file, $request->team_id);
        app(\app\service\BusinessAudit::class)->record(
            $request, 'team', 'upload', 'joinApplicationFile',
            isset($result['id']) ? (int) $result['id'] : null
        );
        return success($result, '上传成功');
    }
}
