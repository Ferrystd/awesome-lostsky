<?php
declare(strict_types=1);

namespace app\team\controller;

use app\service\PermissionDictionary as Permissions;
use think\Request;

class File
{
    protected $middleware = [
        'JwtAuth'      => ['only' => ['index', 'get', 'upload', 'delete', 'usage']],
        'Context'      => ['only' => ['index', 'get', 'upload', 'delete', 'usage']],
        'EntityType:team,teamMember,teamCustomer,teamVirtual' => ['only' => ['index', 'get', 'upload', 'delete', 'usage']],
        'TeamWorkspaceAuth' => ['only' => ['index', 'get', 'upload', 'delete', 'usage']],
        'Permission:' . Permissions::FILE_READ => ['only' => ['index', 'get', 'usage']],
        'Permission:' . Permissions::FILE_UPLOAD => ['only' => ['upload']],
        'Permission:' . Permissions::FILE_DELETE => ['only' => ['delete']],
    ];

    public function index(Request $request)
    {
        $service = app(\app\service\File::class);
        $result  = $service->list($request->team_id, [
            'entity_id'  => $request->get('entity_id'),
            'mime_type'  => $request->get('mime_type'),
            'keyword'    => $request->get('keyword'),
            'start_time' => $request->get('start_time'),
            'end_time'   => $request->get('end_time'),
        ], $request->get('page/d', 1), $request->get('limit/d', 20));

        return success($result);
    }

    public function get(Request $request)
    {
        $id = $request->get('id/d', 0);

        $service = app(\app\service\File::class);
        $result  = $service->get($request->team_id, $id);

        return success($result);
    }

    public function upload(Request $request)
    {
        $file = $request->file('file');
        if (!$file) {
            return error('请选择文件', 1, 422);
        }

        $result = app(\app\service\File::class)->upload(
            $file,
            $request->team_id,
            $request->acting_entity,
            \app\enum\FileSource::Manual,
            true
        );
        app(\app\service\BusinessAudit::class)->record(
            $request,
            'team',
            'upload',
            'file',
            (int) ($result['id'] ?? 0)
        );

        return success($result, '上传成功');
    }

    public function delete(Request $request)
    {
        $id = $request->post('id/d', 0);

        $service = app(\app\service\File::class);
        $service->deleteByTeam($request->team_id, $id);
        app(\app\service\BusinessAudit::class)->record($request, 'team', 'delete', 'file', $id);

        return message('文件已删除');
    }

    public function usage(Request $request)
    {
        $service = app(\app\service\File::class);
        $result  = $service->usage($request->team_id);

        return success($result);
    }
}
