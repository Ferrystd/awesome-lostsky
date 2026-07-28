<?php
declare (strict_types = 1);

namespace app\validate;

use think\file\UploadedFile;
use think\Validate;

class File extends Validate
{
    protected $message = [
        'file.require' => '请选择文件',
        'file.fileSize' => '文件大小超出限制',
        'file.fileExt' => '不允许上传该文件扩展名',
    ];

    public function upload(UploadedFile $file): bool
    {
        $extensions = config('file.allowed_extensions', []);
        $maxSize = (int) config('file.upload_max_size', 50 * 1024 * 1024);
        $this->rule([
            'file' => 'require|fileSize:' . $maxSize . '|fileExt:' . implode(',', $extensions),
        ]);

        return $this->check(['file' => $file]);
    }
}
