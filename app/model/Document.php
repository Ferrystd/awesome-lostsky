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
        'documentable_id'  => 'integer',
        'scope'            => 'integer', // 普通展示：通过文档作用域区分内部/对外场景
        'is_displayed'     => 'integer', // 主动展示：是否在对应场景中主动展示
        'sort'             => 'integer',
        'title'            => 'string',
        'content'          => 'string',
        'documentable_type' => 'string',
    ];

    protected $json = [];

    protected $hidden = ['delete_time'];

    protected $readonly = ['documentable_type', 'documentable_id'];

    public function documentable()
    {
        return $this->morphTo('documentable', [
            'team'   => Team::class,
            'member' => TeamMember::class,
            'user'   => User::class,
        ]);
    }

    public function searchTitleAttr($query, $value)
    {
        return $query->where('title', 'like', "%{$value}%");
    }
}
