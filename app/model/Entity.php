<?php
declare (strict_types = 1);

namespace app\model;

use app\model\Base;

/**
 * Entity 模型
 * @mixin \think\Model
 */
class Entity extends Base
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
        'is_displayed'     => 'integer',
        'search_override'  => 'integer',
    ];

    /** JSON 字段 */
    protected $json = [];

    /** 输出隐藏 */
    protected $hidden = ['delete_time'];

    /** 计算属性 */
    protected $append = ['is_valid', 'is_searchable', 'name', 'avatar'];

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
        return $this->hasMany(MarkdownReference::class, 'entity_id');
    }

    public function files()
    {
        return $this->hasMany(File::class, 'entity_id');
    }

    public function notices()
    {
        return $this->hasMany(TeamNotice::class, 'entity_id');
    }

    public function profile()
    {
        return $this->hasOne(TeamEntityProfile::class, 'entity_id');
    }

    public function roles()
    {
        return $this->hasMany(TeamEntityRole::class, 'entity_id');
    }

    public function ownedCustomers()
    {
        return $this->hasMany(TeamCustomer::class, 'owner_entity_id');
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

    public function getNameAttr(): string
    {
        return (string) (TeamEntityProfile::where('entity_id', $this->id)->value('name') ?: '实体');
    }

    public function getAvatarAttr(): ?string
    {
        $avatar = TeamEntityProfile::where('entity_id', $this->id)->value('avatar');

        return $avatar ? (string) $avatar : null;
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
