<?php
declare(strict_types=1);

namespace app\enum;

use think\model\contract\EnumTransform;

enum FileSource: string implements EnumTransform
{
    case Unknown = 'unknown';
    case Manual = 'manual';
    case Markdown = 'markdown';
    case Attachment = 'attachment';
    case Join = 'join';
    case Command = 'command';
    case System = 'system';

    public function value(): string
    {
        return $this->value;
    }
}
