<?php
declare(strict_types=1);

namespace app\model;

class Team extends Base
{
    /**
     * 字段类型转换
     * @var array
     */
    protected $type = [
        'id' => 'integer',
        'create_time' => 'integer',
        'update_time' => 'integer',
        'delete_time' => 'integer',

        'slug'         => 'string',
        'user_id'      => 'integer',
        'is_banned'    => 'integer',
        'is_cancelled' => 'integer',
    ];

    protected $json = [];

    /** 只读字段 — 创建后不可改 */
    protected $readonly = ['slug'];

    /** 追加计算属性 */
    protected $append = ['is_owner', 'is_valid', 'is_searchable'];

    /** 临时属性，由调用方设置，供 getIsOwnerAttr 使用 */
    public $currentUserId;

    /** 由实体搜索服务批量注入，避免逐条读取设置。 */
    public $entitySearchSettings;

    public function getIsOwnerAttr($value, $data): bool
    {
        return isset($this->currentUserId) && ($data['user_id'] ?? 0) == $this->currentUserId;
    }

    /**
     * 只查询有效 team（未封禁且未注销）
     */
    public function scopeActive($query)
    {
        return $query->where('is_banned', 0)->where('is_cancelled', 0);
    }

    public function members()
    {
        return $this->hasMany(TeamMember::class, 'team_id');
    }

    public function getIsValidAttr($value, $data): bool
    {
        return (int) ($data['is_banned'] ?? 0) === 0 && (int) ($data['is_cancelled'] ?? 0) === 0;
    }

    public function getIsSearchableAttr(): bool
    {
        if (!$this->is_valid) {
            return false;
        }

        $settings = is_array($this->entitySearchSettings)
            ? $this->entitySearchSettings
            : app(\app\service\TeamSetting::class)->internal((int) $this->id, 'entity');

        return (int) ($settings['team_searchable'] ?? 0) === 1;
    }

    public function roles()
    {
        return $this->hasMany(TeamRole::class, 'team_id');
    }

    public function entityRoles()
    {
        return $this->hasMany(TeamEntityRole::class, 'team_id');
    }

    public function joinFields()
    {
        return $this->hasMany(TeamJoinField::class, 'team_id');
    }

    public function joinApplications()
    {
        return $this->hasMany(TeamJoinApplication::class, 'team_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function profile()
    {
        return $this->hasOne(TeamEntityProfile::class, 'entity_id', 'root_entity_id')
            ->bind(['name' => 'display_name', 'avatar', 'description', 'introduction_markdown']);
    }

    public function domains()
    {
        return $this->hasMany(TeamDomain::class, 'team_id');
    }

    public function abilities()
    {
        return $this->hasMany(TeamAbility::class, 'team_id');
    }

    public function notices()
    {
        return $this->hasMany(TeamNotice::class, 'team_id');
    }

    public function sentNotices()
    {
        return $this->hasMany(TeamNotice::class, 'sender_team_id');
    }

    public function customers()
    {
        return $this->hasMany(TeamCustomer::class, 'team_id');
    }

    public function virtuals()
    {
        return $this->hasMany(TeamVirtual::class, 'team_id');
    }

    public function entityFields()
    {
        return $this->hasMany(TeamEntityField::class, 'team_id');
    }

    public function chatConversations()
    {
        return $this->hasMany(ChatConversation::class, 'team_id');
    }

    public function transactions()
    {
        return $this->hasMany(TeamTransaction::class, 'team_id');
    }

    public function documents()
    {
        return $this->hasMany(Document::class, 'entity_id', 'root_entity_id');
    }

    public function identity()
    {
        return $this->morphOne(Entity::class, 'entityable', 'team');
    }

    public function getRootEntityIdAttr(): int
    {
        return (int) ($this->identity?->id ?? 0);
    }

    public function settings()
    {
        return $this->hasMany(TeamSetting::class, 'team_id');
    }

    public function files()
    {
        return $this->hasMany(File::class, 'team_id');
    }
}
