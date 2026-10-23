<?php
declare (strict_types = 1);

namespace app\model;

class TeamVirtual extends Base
{
    protected $type = [
        'team_id'     => 'integer',
        'is_active'   => 'integer',
    ] + self::COMMON_TYPES;

    protected $json = [];
    protected $append = ['is_valid', 'is_searchable'];
    protected $readonly = ['team_id'];

    public function getIsValidAttr($value, $data): bool
    {
        return (int) ($data['is_active'] ?? 0) === 1 && (bool) ($this->team?->is_valid ?? false);
    }

    public function getIsSearchableAttr(): bool
    {
        // 虚拟实体固定不进入全局实体搜索；Entity.is_internal_visible 控制团队工作空间目录，
        // Entity.is_displayed 控制公开 Display。两个展示对象独立，迁移时仅用公开状态生成初始内部状态。
        return false;
    }

    public function team()
    {
        return $this->belongsTo(Team::class, 'team_id');
    }

    public function identity()
    {
        return $this->morphOne(Entity::class, 'entityable', 'teamVirtual')
            ->bind(['slug']);
    }

    public function profile()
    {
        return $this->hasOne(TeamEntityProfile::class, 'entity_id', 'root_entity_id')
            ->bind(['name', 'avatar', 'description']);
    }

    public function getRootEntityIdAttr(): int { return (int) ($this->identity?->id ?? 0); }

    public function integrations()
    {
        return $this->hasMany(TeamVirtualIntegration::class, 'virtual_id');
    }

    public function fieldValues()
    {
        return $this->morphMany(TeamEntityFieldValue::class, 'entity', 'virtual');
    }
}
