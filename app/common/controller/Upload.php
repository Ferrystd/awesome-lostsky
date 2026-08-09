<?php
declare(strict_types=1);

namespace app\common\controller;

use app\service\File;
use think\Request;

class Upload
{
    protected $middleware = [
        'JwtAuth'      => ['except' => []],
        'Context'      => ['except' => []],
        'EntityType:team,teamMember,teamCustomer,teamVirtual' => ['except' => []],
        'TeamAuth'     => ['except' => []],
    ];

    public function upload(Request $request)
    {
        $file = $request->file('file');
        if (!$file) {
            return error('请选择文件', 1, 422);
        }

        $service = app(File::class);
        $result  = $service->upload(
            $file,
            $request->team_id,
            $request->acting_entity
        );
        app(\app\service\BusinessAudit::class)->record(
            $request,
            'common',
            'upload',
            'file',
            (int) ($result['id'] ?? 0)
        );

        return success($result, '上传成功');
    }
}
