<?php
declare (strict_types = 1);

namespace app\validate;

use think\file\UploadedFile;
use think\Validate;

class File extends Validate
{
    public function attachmentSource(string $source): \app\enum\FileSource
    {
        return match ($source) {
            'attachment' => \app\enum\FileSource::Attachment,
            'markdown' => \app\enum\FileSource::Markdown,
            default => throw new \think\exception\HttpException(422, '上传来源类别无效'),
        };
    }

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

        if (!$this->check(['file' => $file])) return false;
        $mimeTypes = [
            'jpg' => ['image/jpeg'], 'jpeg' => ['image/jpeg'], 'png' => ['image/png'],
            'gif' => ['image/gif'], 'webp' => ['image/webp'], 'avif' => ['image/avif'],
            'mp4' => ['video/mp4'], 'webm' => ['video/webm'], 'mov' => ['video/quicktime'],
            'mp3' => ['audio/mpeg'], 'wav' => ['audio/wav', 'audio/x-wav'],
            'ogg' => ['audio/ogg', 'video/ogg', 'application/ogg'], 'm4a' => ['audio/mp4', 'video/mp4', 'audio/x-m4a'],
            'pdf' => ['application/pdf'],
        ];
        $extension = strtolower($file->getOriginalExtension());
        if (isset($mimeTypes[$extension]) && !in_array($file->getMime(), $mimeTypes[$extension], true)) {
            $this->error = '文件内容与扩展名不匹配';
            return false;
        }
        return true;
    }
}
