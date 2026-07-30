<?php
declare(strict_types=1);

namespace app\model;

class PlatformAdminRolePermission extends Base
{
    protected $type = [
        'id' => 'integer',
        'role_id' => 'integer',
        'permission_key' => 'string',
        'create_time' => 'integer',
        'update_time' => 'integer',
        'delete_time' => 'integer',
    ];

    protected $readonly = ['role_id', 'permission_key'];
    protected $hidden = ['delete_time'];
}
