<?php
declare (strict_types = 1);

namespace app\model;

use app\model\Base;

/**
 * TeamNotice 模型
 * @mixin \think\Model
 */
class TeamNotice extends Base
{
    /**
     * 字段类型转换
     * @var array
     */
    protected $type = [
        'title'       => 'string',
        'content'     => 'string',
        'is_pinned'   => 'integer',
        'is_read'     => 'integer',
    ] + self::COMMON_TYPES;

    /**
     * JSON 字段
     * @var array
     */
    protected $json = [];
    protected $hidden = ['delete_time', 'dedup_key'];
    protected $readonly = ['dedup_key'];

    public function team()
    {
        return $this->belongsTo(Team::class, 'team_id');
    }

    public function senderTeam()
    {
        return $this->belongsTo(Team::class, 'sender_team_id');
    }

    public function recipient()
    {
        return $this->belongsTo(Entity::class, 'entity_id');
    }
}
