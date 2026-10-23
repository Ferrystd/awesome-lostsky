<?php
declare(strict_types=1);

namespace app\model;

class PlatformAdminRolePermission extends Base
{
    protected $type = [
        'role_id' => 'integer',
        'permission_key' => 'string',
    ] + self::COMMON_TYPES;

    protected $readonly = ['role_id', 'permission_key'];
}
