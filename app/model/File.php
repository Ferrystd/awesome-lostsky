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
        'source'      => \app\enum\FileSource::class,
        // team_id 允许为 NULL(system file)，不能声明 integer，否则 NULL 会被转换为 0
        // 'team_id'     => 'integer|null',
        // entity_id 允许为 NULL，不能声明 integer，否则 NULL 会被转换为 0
        // 'entity_id'   => 'integer|null',
    ];

    protected $json = [];

    protected $hidden = ['delete_time'];

    protected $readonly = ['hash', 'team_id', 'entity_id', 'source'];

    public function team()
    {
        return $this->belongsTo(Team::class, 'team_id');
    }

    public function subject()
    {
        return $this->belongsTo(Entity::class, 'entity_id');
    }
}
