<?php
declare (strict_types = 1);

namespace app\model;

use app\enum\Visibility;
use app\model\Base;

class TeamSetting extends Base
{
    use concern\BelongsToTeam;

    protected $type = [
        'team_id'     => 'integer',
        'app_name'    => 'string',
        'key'         => 'string',
        'value'       => 'string',
        'visibility'  => Visibility::class,
    ] + self::COMMON_TYPES;

    protected $json = [];
    protected $readonly = ['team_id', 'app_name', 'key'];

    public function visibilityTargets()
    {
        return $this->morphMany(VisibilityTarget::class, 'visibleable');
    }
}
