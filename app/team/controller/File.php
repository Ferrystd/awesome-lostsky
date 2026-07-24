<?php
declare(strict_types=1);

namespace app\team\controller;

use think\Request;

class File
{
    protected $middleware = [
        'JwtAuth'      => ['only' => ['index', 'get', 'delete', 'usage']],
        'Context'      => ['only' => ['index', 'get', 'delete', 'usage']],
        'EntityType:team,teamMember,teamCustomer,teamVirtual' => ['only' => ['index', 'get', 'delete', 'usage']],
        'TeamBelongs'  => ['only' => ['index', 'get', 'delete', 'usage']],
        'MemberAccess' => ['only' => ['index', 'get', 'delete', 'usage']],
        'TeamAccess'   => ['only' => ['index', 'get', 'delete', 'usage']],
    ];

    public function index(Request $request)
    {
        $service = app(\app\service\File::class);
        $result  = $service->list($request->team_id, [
            'member_id'  => $request->get('member_id'),
            'mime_type'  => $request->get('mime_type'),
            'keyword'    => $request->get('keyword'),
            'start_time' => $request->get('start_time'),
            'end_time'   => $request->get('end_time'),
        ], (int) $request->get('page', 1), (int) $request->get('limit', 20));

        return success($result);
    }

    public function get(Request $request)
    {
        $id = (int) $request->param('id', $request->get('id', 0));

        $service = app(\app\service\File::class);
        $result  = $service->get($request->team_id, $id);

        return success($result);
    }

    public function delete(Request $request)
    {
        $id = (int) $request->post('id', 0);

        $service = app(\app\service\File::class);
        $service->deleteByTeam($request->team_id, $id);

        return message('文件已删除');
    }

    public function usage(Request $request)
    {
        $service = app(\app\service\File::class);
        $result  = $service->usage($request->team_id);

        return success($result);
    }
}
