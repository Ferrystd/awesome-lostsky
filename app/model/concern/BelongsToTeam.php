<?php
declare(strict_types=1);

namespace app\model\concern;

trait BelongsToTeam
{
    public function team()
    {
        return $this->belongsTo(\app\model\Team::class, 'team_id');
    }
}
