<?php
declare (strict_types = 1);

namespace app\model;

use app\model\Base;

class Document extends Base
{
    protected $type = [
        'id'               => 'integer',
        'create_time'      => 'integer',
        'update_time'      => 'integer',
        'delete_time'      => 'integer',
        'documentable_id'   => 'integer',
        'manager_scope'     => 'integer',
        'visibility'        => 'integer',
        'sort'              => 'integer',
        'title'             => 'string',
        'content'           => 'string',
        'documentable_type' => 'string',
    ];

    protected $json = [];

    protected $hidden = ['delete_time'];

    protected $readonly = ['documentable_type', 'documentable_id'];

    public function documentable()
    {
        return $this->morphTo('documentable', [
            'team'       => Team::class,
            'teamMember' => TeamMember::class,
        ]);
    }

    public function visibilityTargets()
    {
        return $this->morphMany(VisibilityTarget::class, 'visibleable');
    }

    public function searchTitleAttr($query, $value)
    {
        return $query->where('title', 'like', "%{$value}%");
    }
}
