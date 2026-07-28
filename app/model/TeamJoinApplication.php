<?php
declare (strict_types = 1);

namespace app\model;

use app\enum\TeamJoinStatus;
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
        'id'          => 'integer',
        'create_time' => 'integer',
        'update_time' => 'integer',
        'delete_time' => 'integer',

        'team_id'   => 'integer',
        'user_id'   => 'integer',
        'entity_id' => 'integer',
        'status'    => TeamJoinStatus::class,
        'memo'      => 'string',
    ];

    /** JSON 字段 */
    protected $json = [];

    /** 输出隐藏 */
    protected $hidden = ['delete_time'];

    /** 计算属性 */
    protected $append = [];

    /** 只读字段 */
    protected $readonly = ['team_id', 'user_id'];

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
