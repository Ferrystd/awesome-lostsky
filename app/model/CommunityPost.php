<?php
declare(strict_types=1);
namespace app\model;
class CommunityPost extends Base
{
    protected $type = [
        'id' => 'integer',
        'community_id' => 'integer',
        'board_id' => 'integer',
        'author_entity_id' => 'integer',
        'title' => 'string',
        'content' => 'string',
        'pinned' => 'boolean',
        'status' => \app\enum\CommunityContentStatus::class,
        'hidden_reason' => 'string',
        'create_time' => 'integer',
        'update_time' => 'integer',
        'delete_time' => 'integer',
    ];
    protected $hidden = ['delete_time'];
    protected $readonly = ['community_id','author_entity_id'];
    public function community() { return $this->belongsTo(Community::class, 'community_id'); }
    public function author() { return $this->belongsTo(Entity::class, 'author_entity_id'); }
    public function board() { return $this->belongsTo(CommunityBoard::class, 'board_id'); }
}
