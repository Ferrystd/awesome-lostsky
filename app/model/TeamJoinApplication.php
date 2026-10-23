<?php
declare (strict_types = 1);

namespace app\model;

use app\enum\TeamJoinStatus;
use app\enum\TeamJoinPurpose;
use app\model\Base;

/**
 * TeamJoinApplication 模型
 * @mixin \think\Model
 */
class TeamJoinApplication extends Base
{
    /**
     * 字段类型转换
     * @var array
     */
    protected $type = [
        'team_id'   => 'integer',
        'user_id'   => 'integer',
        'entity_id' => 'integer',
        'purpose'   => TeamJoinPurpose::class,
        'status'    => TeamJoinStatus::class,
        'memo'      => 'string',
    ] + self::COMMON_TYPES;

    /** JSON 字段 */
    protected $json = [];

    /** 计算属性 */
    protected $append = ['purpose_code', 'purpose_label', 'status_code', 'status_label'];

    /** 只读字段 */
    protected $readonly = ['team_id', 'user_id'];

    public function getPurposeCodeAttr(): string
    {
        /** @var TeamJoinPurpose $purpose */
        $purpose = $this->enumCase('purpose');
        return $purpose->code();
    }

    public function getPurposeLabelAttr(): string
    {
        /** @var TeamJoinPurpose $purpose */
        $purpose = $this->enumCase('purpose');
        return $purpose->value();
    }

    public function getStatusCodeAttr(): string
    {
        return strtolower($this->enumCase('status')->name);
    }

    public function getStatusLabelAttr(): string
    {
        return $this->enumCase('status')->value();
    }

    public function team()
    {
        return $this->belongsTo(Team::class, 'team_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function subject()
    {
        return $this->belongsTo(Entity::class, 'entity_id');
    }

    public function inviter()
    {
        return $this->belongsTo(Entity::class, 'inviter_entity_id');
    }

    public function values()
    {
        return $this->hasMany(TeamJoinFieldValue::class, 'application_id');
    }

    public function tasks()
    {
        return $this->hasMany(TeamJoinTask::class, 'application_id');
    }

    public function searchTeamIdAttr($query, $value)
    {
        $query->where('team_id', (int) $value);
    }

    public function searchUserIdAttr($query, $value)
    {
        $query->where('user_id', (int) $value);
    }

    public function searchStatusAttr($query, $value)
    {
        if ($value !== null && $value !== '') {
            $query->where('status', (int) $value);
        }
    }
}
