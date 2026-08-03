<?php
declare(strict_types=1);

namespace app\model;

class TeamMemberTenure extends Base
{
    protected $type = [
        'id' => 'integer',
        'team_id' => 'integer',
        'member_id' => 'integer',
        'join_application_id' => 'integer',
        'joined_at' => 'integer',
        'departed_at' => 'integer',
        'create_time' => 'integer',
        'update_time' => 'integer',
        'delete_time' => 'integer',
    ];

    protected $readonly = ['team_id', 'member_id', 'join_application_id', 'joined_at'];

    public function member()
    {
        return $this->belongsTo(TeamMember::class, 'member_id');
    }

    public function joinApplication()
    {
        return $this->belongsTo(TeamJoinApplication::class, 'join_application_id');
    }
}
