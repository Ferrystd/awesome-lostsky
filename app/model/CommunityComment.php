<?php
declare(strict_types=1);
namespace app\model;
class CommunityComment extends Base
{
    protected $type = [
        'id' => 'integer',
        'community_id' => 'integer',
        'post_id' => 'integer',
        'author_entity_id' => 'integer',
        'content' => 'string',
        'status' => \app\enum\CommunityContentStatus::class,
        'hidden_reason' => 'string',
        'create_time' => 'integer',
        'update_time' => 'integer',
        'delete_time' => 'integer',
    ];
    protected $hidden = ['delete_time'];
    protected $readonly = ['community_id','post_id','author_entity_id'];
    public function community() { return $this->belongsTo(Community::class, 'community_id'); }
    public function author() { return $this->belongsTo(Entity::class, 'author_entity_id'); }
    public function post() { return $this->belongsTo(CommunityPost::class, 'post_id'); }
}
