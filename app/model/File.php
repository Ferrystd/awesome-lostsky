<?php
declare (strict_types = 1);

namespace app\model;

use app\model\Base;

class File extends Base
{
    protected $type = [
        'id'          => 'integer',
        'create_time' => 'integer',
        'update_time' => 'integer',
        'delete_time' => 'integer',
        'size'        => 'integer',
        'member_id'   => 'integer',
    ];

    protected $json = [];

    protected $hidden = ['delete_time'];

    protected $readonly = ['hash', 'member_id'];

    public function member()
    {
        return $this->belongsTo(TeamMember::class, 'member_id');
    }
}
