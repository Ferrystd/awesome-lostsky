<?php
declare(strict_types=1);
namespace app\model;
class Community extends Base
{
    protected $type = [
        'id' => 'integer',
        'slug' => 'string',
        'name' => 'string',
        'description' => 'string',
        'owner_type' => \app\enum\CommunityOwner::class,
        'team_id' => 'integer',
        'is_official' => 'boolean',
        'status' => \app\enum\CommunityStatus::class,
        'create_time' => 'integer',
        'update_time' => 'integer',
        'delete_time' => 'integer',
    ];
    protected $hidden = ['delete_time'];
    protected $readonly = ['owner_type','team_id'];
    public function team() { return $this->belongsTo(Team::class, 'team_id'); }
    public function boards() { return $this->hasMany(CommunityBoard::class, 'community_id'); }
    public function announcements() { return $this->hasMany(CommunityAnnouncement::class, 'community_id'); }
    public function posts() { return $this->hasMany(CommunityPost::class, 'community_id'); }
    public function members() { return $this->hasMany(CommunityMember::class, 'community_id'); }
    public function administrators() { return $this->hasMany(CommunityAdministrator::class, 'community_id'); }
}
