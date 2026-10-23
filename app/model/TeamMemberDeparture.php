<?php
declare(strict_types=1);

namespace app\model;

use app\enum\TeamMemberDepartureStatus;

class TeamMemberDeparture extends Base
{
    protected $type = [
        'team_id' => 'integer',
        'member_id' => 'integer',
        'requester_entity_id' => 'integer',
        'decision_entity_id' => 'integer',
        'status' => TeamMemberDepartureStatus::class,
        'decided_at' => 'integer',
    ] + self::COMMON_TYPES;

    protected $append = ['status_code', 'status_label'];
    protected $readonly = ['team_id', 'member_id', 'requester_entity_id'];

    public function getStatusCodeAttr(): string
    {
        return $this->enumCase('status')->code();
    }

    public function getStatusLabelAttr(): string
    {
        return $this->enumCase('status')->value();
    }

    public function member()
    {
        return $this->belongsTo(TeamMember::class, 'member_id');
    }

    public function requester()
    {
        return $this->belongsTo(Entity::class, 'requester_entity_id');
    }

    public function decisionEntity()
    {
        return $this->belongsTo(Entity::class, 'decision_entity_id');
    }
}
