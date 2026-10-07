<?php
declare(strict_types=1);
namespace app\model;
class CommunityBoard extends Base
{
    protected $type = [
        'id' => 'integer',
        'community_id' => 'integer',
        'name' => 'string',
        'sort' => 'integer',
        'enabled' => 'boolean',
        'create_time' => 'integer',
        'update_time' => 'integer',
        'delete_time' => 'integer',
    ];
    protected $hidden = ['delete_time'];
    protected $readonly = ['community_id'];
    public function community() { return $this->belongsTo(Community::class, 'community_id'); }
}
