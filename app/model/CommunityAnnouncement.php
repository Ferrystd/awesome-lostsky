<?php
declare(strict_types=1);
namespace app\model;
class CommunityAnnouncement extends Base
{
    /** Previous persisted body lets valid retained attachments survive cross-team governance. */
    public string $previousContent = '';
    protected $type = [
        'id' => 'integer',
        'community_id' => 'integer',
        'title' => 'string',
        'content' => 'string',
        'pinned' => 'boolean',
        'attachment_team_id' => 'integer',
        'create_time' => 'integer',
        'update_time' => 'integer',
        'delete_time' => 'integer',
    ];
    protected $hidden = ['delete_time'];
    protected $readonly = ['community_id'];
    public function community() { return $this->belongsTo(Community::class, 'community_id'); }
}
