<?php
declare(strict_types=1);

namespace app\model;

class TeamEntityRole extends Base
{
    use concern\BelongsToTeam;
    use concern\BelongsToEntity;

    protected $name = 'team_entity_role';
    protected $type = [
        'team_id' => 'integer', 'entity_id' => 'integer',
        'role_id' => 'integer',
    ] + self::COMMON_TYPES;
    protected $readonly = ['team_id', 'entity_id', 'role_id'];
    public function role() { return $this->belongsTo(TeamRole::class, 'role_id'); }
}
