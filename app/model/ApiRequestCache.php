<?php
declare (strict_types = 1);

namespace app\model;

use app\model\Base;

/**
 * API 请求去重缓存模型
 * 仅存储请求哈希，用于防止重复提交和重放攻击
 * @mixin \think\Model
 */
class ApiRequestCache extends Base
{
    /**
     * 自动写入时间戳（用于定时清理过期哈希）
     * @var bool
     */
    protected $autoWriteTimestamp = true;

    /**
     * 字段类型转换
     * @var array
     */
    protected $type = [
        'id'          => 'integer',
        'create_time' => 'integer',
        'update_time' => 'integer',
        'hash'        => 'string',

        //由于不进行软删除，无delete_time字段
    ];

    /**
     * JSON 字段
     * @var array
     */
    protected $json = [];
}
