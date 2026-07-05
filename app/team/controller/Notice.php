<?php
declare(strict_types=1);

namespace app\team\controller;

use app\service\Notice as NoticeService;
use think\Request;

class Notice
{
    protected $middleware = ['JwtAuth', 'Context', 'MemberAccess'];

    public function index(Request $request)
    {
        $service = app(NoticeService::class);
        $result  = $service->list((int) $request->team_id, [
            'is_read' => $request->get('is_read', ''),
            'keyword' => $request->get('keyword', ''),
        ], (int) $request->get('page', 1), (int) $request->get('limit', 20));

        return success($result);
    }

    public function get(Request $request)
    {
        $service = app(NoticeService::class);
        $result  = $service->get((int) $request->team_id, (int) $request->param('id', 0));

        return success($result);
    }

    public function confirm(Request $request)
    {
        $service = app(NoticeService::class);
        $service->confirm((int) $request->team_id, (int) $request->post('id', 0));

        return message('站内信已确认');
    }

    public function confirmAll(Request $request)
    {
        $service = app(NoticeService::class);
        $count   = $service->confirmAll((int) $request->team_id);

        return success(['count' => $count], '站内信已全部确认');
    }

    public function receive(Request $request)
    {
        $service = app(NoticeService::class);
        $service->receive((int) $request->team_id, (int) $request->post('id', 0));

        return message('站内信资产已收取');
    }

    public function receiveAll(Request $request)
    {
        $service = app(NoticeService::class);
        $service->receiveAll((int) $request->team_id);

        return message('站内信资产已全部收取');
    }
}
