<?php
declare(strict_types=1);

namespace app\model;

class PlatformAdminUserRole extends Base
{
    protected $type = [
        'user_id' => 'integer',
        'role_id' => 'integer',
        'assigned_by_user_id' => 'integer',
    ] + self::COMMON_TYPES;

    protected $readonly = ['user_id', 'role_id'];
}
