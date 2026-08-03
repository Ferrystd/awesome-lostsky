<?php
declare (strict_types = 1);

namespace app\model;

use app\enum\TeamMemberStatus;
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
        'status' => 'integer',
        'is_blocked' => 'integer',
    ];

    protected $json = [];

    protected $append = [
        'entity_id',
        'is_valid',
        'is_searchable',
        'status_code',
        'status_label',
    ];

    public function getEntityIdAttr(): int
    {
        return (int) ($this->identity?->id ?? 0);
    }

    public function getIsValidAttr($value, $data): bool
    {
        $team = $this->team;
        if (!$team || !(bool) $team->is_valid) {
            return false;
        }

        if ($this->statusCase() === TeamMemberStatus::Active) {
            return true;
        }

        $settings = app(\app\service\TeamSetting::class)->internal((int) $team->id, 'member');
        return (bool) ($settings['inactive_entity_available'] ?? false);
    }

    public function getStatusCodeAttr(): string
    {
        return $this->statusCase()->code();
    }

    public function getStatusLabelAttr(): string
    {
        return $this->statusCase()->value();
    }

    public function statusCase(): TeamMemberStatus
    {
        if (!array_key_exists('status', $this->getData())) {
            return (int) ($this->getData('is_blocked') ?? 0) === 1
                ? TeamMemberStatus::Blocked
                : TeamMemberStatus::Active;
        }

        return TeamMemberStatus::tryFrom((int) $this->getData('status'))
            ?? TeamMemberStatus::Active;
    }

    public function canDirectReceive(): bool
    {
        return $this->statusCase() === TeamMemberStatus::Active
            && (bool) ($this->team?->is_valid ?? false);
    }

    public function getIsSearchableAttr(): bool
    {
        // 全局实体搜索可发现性：决定成员是否出现在跨页面实体搜索结果中。
        // 不控制当前 Team 工作空间内的成员/实体目录，也不等同于公开 Display 展示。
        if (!$this->is_valid) {
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

    public function inviter()
    {
        return $this->belongsTo(Entity::class, 'inviter_entity_id');
    }

    public function profile()
    {
        return $this->hasOne(TeamEntityProfile::class, 'entity_id', 'root_entity_id')
            ->bind(['name' => 'nickname', 'avatar', 'description', 'intro_image', 'intro_video', 'introduction_markdown']);
    }

    public function fieldValues()
    {
        return $this->hasMany(TeamEntityFieldValue::class, 'entity_id', 'root_entity_id');
    }

    public function entityFieldValues()
    {
        return $this->fieldValues();
    }

    public function joinApplication()
    {
        return $this->hasOne(TeamJoinApplication::class, 'entity_id', 'root_entity_id');
    }

    public function tenures()
    {
        return $this->hasMany(TeamMemberTenure::class, 'member_id');
    }

    public function departures()
    {
        return $this->hasMany(TeamMemberDeparture::class, 'member_id');
    }

    public function handledTransactions()
    {
        return $this->hasMany(TeamTransaction::class, 'handler_entity_id', 'root_entity_id');
    }

    public function sentTransactions()
    {
        return $this->hasMany(TeamTransaction::class, 'sender_entity_id', 'root_entity_id');
    }

    public function csTransactions()
    {
        return $this->hasMany(TeamTransaction::class, 'cs_entity_id', 'root_entity_id');
    }

    public function bindings()
    {
        return $this->hasMany(TeamCustomerSender::class, 'entity_id', 'root_entity_id');
    }

    public function documents()
    {
        return $this->hasMany(Document::class, 'entity_id', 'root_entity_id');
    }

    public function identity()
    {
        return $this->morphOne(Entity::class, 'entityable', 'teamMember')
            ->bind(['slug', 'search_override']);
    }

    public function getRootEntityIdAttr(): int
    {
        return (int) ($this->identity?->id ?? 0);
    }

    public function entityRoles()
    {
        return $this->hasMany(TeamEntityRole::class, 'entity_id', 'root_entity_id');
    }

    // 占位：CS 角色尚未实现，始终返回空
    public function scopeCs($query)
    {
        return $query->whereRaw('1=0');
    }
}
