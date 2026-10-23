<?php
declare(strict_types=1);

namespace app\model\concern;

trait BelongsToEntity
{
    public function subject()
    {
        return $this->belongsTo(\app\model\Entity::class, 'entity_id');
    }
}
