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
        // 公开展示：决定成员/虚拟实体是否进入 {team}.display.lostsky.work；不影响团队后台目录或全局搜索。
        'is_displayed'     => 'integer',
        // 团队内可见：决定无 team.entity.read 的 Entity 是否能在当前 Team 工作空间目录发现非 Customer 实体；
        // Customer 属于敏感目录，即使该字段为 1 也仍需 team.entity.read。此字段不影响公开 Display 或全局搜索。
        'is_internal_visible' => 'integer',
        // 全局搜索覆盖：只影响跨页面实体搜索，NULL 继承 Team 搜索策略；不影响团队后台目录或 Display。
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

    public function products()
    {
        return $this->hasMany(TeamProduct::class, 'entity_id');
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
        // 全局实体搜索可发现性，由底层对象状态、Team 搜索策略和 search_override 共同计算。
        // 它与 is_internal_visible（团队后台目录）及 is_displayed（公开 Display）相互独立。
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
