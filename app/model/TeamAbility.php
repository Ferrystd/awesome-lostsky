<?php
declare (strict_types = 1);

namespace app\model;

use app\model\Base;

/**
 * TeamAblity 模型
 * @mixin \think\Model
 */
class TeamAbility extends Base
{
    /**
     * 字段类型转换
     * @var array
     */
    protected $type = [
        'team_id'     => 'integer',
        'ability_key' => 'string',
        'level'       => 'integer',
        'expire_time' => 'integer',
    ] + self::COMMON_TYPES;

    /**
     * JSON 字段
     * @var array
     */
    protected $json = [];

    public function team()
    {
        return $this->belongsTo(Team::class, 'team_id');
    }

    public function isAvailable(int $minimumLevel = 1, ?int $at = null): bool
    {
        $at ??= time();

        return $this->level >= $minimumLevel
            && ($this->expire_time === 0 || $this->expire_time >= $at);
    }
}
