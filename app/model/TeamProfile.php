<?php
declare (strict_types = 1);

namespace app\model;

use app\model\Base;

/**
 * TeamProfile 模型
 * @mixin \think\Model
 */
class TeamProfile extends Base
{
    use concern\BelongsToTeam;

    /**
     * 字段类型转换
     * @var array
     */
    protected $type = [
        //固定字段

        //拓展字段
        'team_id' => 'integer',
        'title' => 'string',
        'description' => 'string',
        'introduction' => 'string',
    ] + self::COMMON_TYPES;

    /**
     * JSON 字段
     * @var array
     */
    protected $json = [];

}
