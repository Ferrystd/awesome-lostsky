<?php
declare(strict_types=1);

namespace app\model;

class PlatformAdminUserRole extends Base
{
    protected $type = [
        'id' => 'integer',
        'user_id' => 'integer',
        'role_id' => 'integer',
        'assigned_by_user_id' => 'integer',
        'create_time' => 'integer',
        'update_time' => 'integer',
        'delete_time' => 'integer',
    ];

    protected $readonly = ['user_id', 'role_id'];
    protected $hidden = ['delete_time'];
}
