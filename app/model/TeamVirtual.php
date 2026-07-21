<?php
declare (strict_types = 1);

namespace app\model;

class TeamVirtual extends Base
{
    protected $type = [
        'id'          => 'integer',
        'create_time' => 'integer',
        'update_time' => 'integer',
        'delete_time' => 'integer',
        'team_id'     => 'integer',
        'name'        => 'string',
        'is_active'   => 'integer',
    ];

    protected $json = [];
    protected $hidden = ['delete_time'];
    protected $append = ['is_valid', 'is_searchable'];
    protected $readonly = ['team_id'];

    public function getIsValidAttr($value, $data): bool
    {
        return (int) ($data['is_active'] ?? 0) === 1 && (bool) ($this->team?->is_valid ?? false);
    }

    public function getIsSearchableAttr(): bool
    {
        return false;
    }

    public function setNameAttr($value): string
    {
        return trim((string) $value);
    }

    public function team()
    {
        return $this->belongsTo(Team::class, 'team_id');
    }

    public function identity()
    {
        return $this->morphOne(EntityIdentity::class, 'entityable', 'teamVirtual')
            ->bind(['slug']);
    }

    public function integrations()
    {
        return $this->hasMany(TeamVirtualIntegration::class, 'virtual_id');
    }

    public function fieldValues()
    {
        return $this->morphMany(TeamEntityFieldValue::class, 'entity', 'virtual');
    }
}
