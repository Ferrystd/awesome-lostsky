<?php
declare(strict_types=1);

namespace app\model;

use app\enum\ManageScope;
use app\enum\Visibility;

class Document extends Base
{
    use concern\BelongsToEntity;

    protected $type = [
        'entity_id' => 'integer',
        'manager_scope' => ManageScope::class,
        'visibility' => Visibility::class,
        'sort' => 'integer',
        'title' => 'string',
        'content' => 'string',
    ] + self::COMMON_TYPES;

    protected $json = ['tags'];
    protected $readonly = ['entity_id'];

    public function visibilityTargets()
    {
        return $this->morphMany(VisibilityTarget::class, 'visibleable');
    }

    public function markdownReferences()
    {
        return $this->morphMany(MarkdownReference::class, 'referenceable', 'document');
    }

    public function searchTitleAttr($query, $value)
    {
        return $query->where('title', 'like', "%{$value}%");
    }

    public function scopeVisibleTo($query, int $actingEntityId, bool $isTeamManager, bool $isSubject)
    {
        return $query->where(function ($query) use ($actingEntityId, $isTeamManager, $isSubject) {
            $query->where('visibility', Visibility::Public->value);

            if ($actingEntityId > 0) {
                $query->whereOr('visibility', Visibility::Entity->value);
            }
            if ($isTeamManager) {
                $query->whereOr('visibility', 'in', [
                    Visibility::Team->value,
                    Visibility::SubjectTeam->value,
                ]);
            } elseif ($isSubject) {
                $query->whereOr('visibility', Visibility::SubjectTeam->value);
            }
            if ($actingEntityId > 0) {
                $query->whereOr(function ($query) use ($actingEntityId) {
                    $query->where('visibility', Visibility::Custom->value)
                        ->whereExists(function ($targets) use ($actingEntityId) {
                            $targets->table('visibility_target')
                                ->where('visibleable_type', 'document')
                                ->whereColumn('visibleable_id', 'document.id')
                                ->whereNull('delete_time')
                                ->where('entity_id', $actingEntityId);
                        });
                });
            }
        });
    }
}
