<?php
declare(strict_types=1);

namespace app\model;

class TeamEntityRole extends Base
{
    protected $name = 'team_entity_role';
    protected $type = [
        'id' => 'integer', 'team_id' => 'integer', 'entity_id' => 'integer',
        'role_id' => 'integer', 'create_time' => 'integer', 'update_time' => 'integer', 'delete_time' => 'integer',
    ];
    protected $hidden = ['delete_time'];
    protected $readonly = ['team_id', 'entity_id', 'role_id'];
    public function team() { return $this->belongsTo(Team::class, 'team_id'); }
    public function role() { return $this->belongsTo(TeamRole::class, 'role_id'); }
    public function subject() { return $this->belongsTo(Entity::class, 'entity_id'); }
}
