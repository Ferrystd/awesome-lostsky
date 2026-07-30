<?php
declare(strict_types=1);

namespace app\model;

class PlatformAdminRole extends Base
{
    protected $type = [
        'id' => 'integer',
        'role_key' => 'string',
        'name' => 'string',
        'description' => 'string',
        'is_system' => 'integer',
        'create_time' => 'integer',
        'update_time' => 'integer',
        'delete_time' => 'integer',
    ];

    protected $readonly = ['role_key', 'is_system'];
    protected $hidden = ['delete_time'];
}
