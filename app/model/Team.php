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
        'display_name' => 'string',
        'user_id'      => 'integer',
        'is_banned'    => 'integer',
        'is_cancelled' => 'integer',
    ];

    protected $json = [];

    /** 只读字段 — 创建后不可改 */
    protected $readonly = ['slug'];

    /** 追加计算属性 */
    protected $append = ['is_owner'];

    /** 临时属性，由调用方设置，供 getIsOwnerAttr 使用 */
    public $currentUserId;

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

    public function postTypes()
    {
        return $this->hasMany(TeamMemberPostType::class, 'team_id');
    }

    public function memberFields()
    {
        return $this->hasMany(TeamMemberField::class, 'team_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function profile()
    {
        return $this->hasOne(TeamProfile::class, 'team_id')
            ->bind(['title', 'description', 'introduction']);
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

    public function customers()
    {
        return $this->hasMany(TeamCustomer::class, 'team_id');
    }

    public function transactions()
    {
        return $this->hasMany(TeamTransaction::class, 'team_id');
    }

    public function documents()
    {
        return $this->morphMany(Document::class, 'documentable');
    }

    public function settings()
    {
        return $this->hasMany(TeamSetting::class, 'team_id');
    }

    public function files()
    {
        return $this->hasManyThrough(File::class, TeamMember::class, 'team_id', 'member_id');
    }
}
