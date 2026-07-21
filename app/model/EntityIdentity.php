<?php
declare (strict_types = 1);

namespace app\model;

use app\model\Base;

/**
 * EntityIdentity 模型
 * @mixin \think\Model
 */
class EntityIdentity extends Base
{
    /**
     * 字段类型转换
     * @var array
     */
    protected $type = [
        'id'          => 'integer',
        'create_time' => 'integer',
        'update_time' => 'integer',
        'delete_time' => 'integer',
        'slug'             => 'string',
        'entityable_type'  => 'string',
        'entityable_id'    => 'integer',
        'search_override'  => 'integer',
    ];

    /** JSON 字段 */
    protected $json = [];

    /** 输出隐藏 */
    protected $hidden = ['delete_time'];

    /** 计算属性 */
    protected $append = ['is_valid', 'is_searchable'];

    /** 只读字段 */
    protected $readonly = ['slug', 'entityable_type', 'entityable_id'];

    public function entityable()
    {
        return $this->morphTo('entityable', [
            'team'         => Team::class,
            'teamMember'   => TeamMember::class,
            'teamCustomer' => TeamCustomer::class,
            'teamVirtual'  => TeamVirtual::class,
        ]);
    }

    public function markdownReferences()
    {
        return $this->hasMany(MarkdownReference::class, 'entity_identity_id');
    }

    public function scopeTeam($query)
    {
        return $query->where('entityable_type', 'team');
    }

    public function scopeMember($query)
    {
        return $query->where('entityable_type', 'teamMember');
    }

    public function scopeCustomer($query)
    {
        return $query->where('entityable_type', 'teamCustomer');
    }

    public function scopeVirtual($query)
    {
        return $query->where('entityable_type', 'teamVirtual');
    }

    public function getIsValidAttr(): bool
    {
        $entity = $this->entityable;
        return $entity ? (bool) $entity->is_valid : false;
    }

    public function getIsSearchableAttr(): bool
    {
        $entity = $this->entityable;
        return $entity ? (bool) $entity->is_searchable : false;
    }

    public function setSlugAttr($value): string
    {
        return strtolower(trim((string) $value));
    }

    public function searchSlugAttr($query, $value)
    {
        $prefix = addcslashes(strtolower(trim((string) $value)), '\\%_');
        return $query->where('slug', 'like', $prefix . '%');
    }
}
