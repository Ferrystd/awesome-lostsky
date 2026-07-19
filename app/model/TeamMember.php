<?php
declare (strict_types = 1);

namespace app\model;

use app\model\Base;

/**
 * TeamMember 模型
 * @mixin \think\Model
 */
class TeamMember extends Base
{
    protected $type = [
        'id' => 'integer',
        'create_time' => 'integer',
        'update_time' => 'integer',
        'delete_time' => 'integer',

        'team_id' => 'integer',
        'user_id' => 'integer',
        'is_displayed' => 'integer',
        'is_blocked' => 'integer',
    ];

    protected $json = [];

    protected $append = ['is_valid', 'is_searchable'];

    public function getIsValidAttr($value, $data): bool
    {
        if ((int) ($data['is_blocked'] ?? 0) !== 0) {
            return false;
        }

        $team = $this->team;
        return $team ? (bool) $team->is_valid : false;
    }

    public function getIsSearchableAttr(): bool
    {
        if (!$this->is_valid || (int) $this->is_displayed !== 1) {
            return false;
        }

        $identity = $this->identity;
        if (!$identity) {
            return false;
        }

        $team = $this->team;
        if (!$team) {
            return false;
        }

        $settings = is_array($team->entitySearchSettings)
            ? $team->entitySearchSettings
            : app(\app\service\TeamSetting::class)->internal((int) $team->id, 'entity');
        $teamValue = (int) ($settings['member_searchable'] ?? 0) === 1;
        $priority  = ($settings['member_search_priority'] ?? 'team') === 'member' ? 'member' : 'team';
        $override  = $identity->search_override === null ? null : (int) $identity->search_override;

        if ($priority === 'member') {
            return $override === null ? $teamValue : $override === 1;
        }

        return $teamValue && $override !== 0;
    }

    public function team()
    {
        return $this->belongsTo(Team::class, 'team_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function profile()
    {
        return $this->hasOne(TeamMemberProfile::class, 'member_id')
            ->bind(['nickname', 'avatar', 'description', 'intro_image', 'intro_video', 'introduction_markdown']);
    }

    public function posts()
    {
        return $this->hasMany(TeamMemberPost::class, 'member_id');
    }

    public function memberRoles()
    {
        return $this->hasMany(TeamMemberRole::class, 'member_id');
    }

    public function fieldValues()
    {
        return $this->hasMany(TeamMemberFieldValue::class, 'member_id');
    }

    public function joinApplication()
    {
        return $this->hasOne(TeamJoinApplication::class, 'member_id');
    }

    public function handledTransactions()
    {
        return $this->hasMany(TeamTransaction::class, 'handler_id');
    }

    public function sentTransactions()
    {
        return $this->hasMany(TeamTransaction::class, 'sender_id');
    }

    public function csTransactions()
    {
        return $this->hasMany(TeamTransaction::class, 'cs_id');
    }

    public function bindings()
    {
        return $this->hasMany(TeamCustomerSender::class, 'member_id');
    }

    public function documents()
    {
        return $this->morphMany(Document::class, 'documentable');
    }

    public function identity()
    {
        return $this->morphOne(EntityIdentity::class, 'entityable', 'teamMember')
            ->bind(['slug', 'search_override']);
    }

    public function files()
    {
        return $this->hasMany(File::class, 'member_id');
    }

    // 占位：CS 角色尚未实现，始终返回空
    public function scopeCs($query)
    {
        return $query->whereRaw('1=0');
    }
}
