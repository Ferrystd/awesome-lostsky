<?php
declare(strict_types=1);

namespace app\model;

class PlatformAdminRole extends Base
{
    protected $type = [
        'role_key' => 'string',
        'name' => 'string',
        'description' => 'string',
        'is_system' => 'integer',
    ] + self::COMMON_TYPES;

    protected $readonly = ['role_key', 'is_system'];
}
