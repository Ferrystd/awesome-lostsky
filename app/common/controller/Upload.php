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
        'EntityType:teamMember' => ['except' => []],
        'TeamBelongs'  => ['except' => []],
        'MemberAccess' => ['except' => []],
    ];

    public function upload(Request $request)
    {
        $file = $request->file('file');
        if (!$file) {
            return error('请选择文件', 1, 422);
        }

        $maxSize = config('file.upload_max_size', 50 * 1024 * 1024);
        if (!$file->checkSize($maxSize)) {
            return error('文件大小超出限制', 1, 422);
        }

        $service = app(File::class);
        $result  = $service->upload($file, $request->member->id);

        return success($result, '上传成功');
    }
}
