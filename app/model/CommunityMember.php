<?php
declare(strict_types=1);
namespace app\model;
class CommunityMember extends Base
{
    protected $type = [
        'id' => 'integer',
        'community_id' => 'integer',
        'entity_id' => 'integer',
        'create_time' => 'integer',
        'update_time' => 'integer',
        'delete_time' => 'integer',
    ];
    protected $hidden = ['delete_time'];
    protected $readonly = ['community_id','entity_id'];
    public function community() { return $this->belongsTo(Community::class, 'community_id'); }
    public function subject() { return $this->belongsTo(Entity::class, 'entity_id'); }
}
