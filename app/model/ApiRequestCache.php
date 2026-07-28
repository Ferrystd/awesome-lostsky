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
    /** 临时幂等缓存必须物理过期，否则唯一 hash 无法复用。 */
    protected $deleteTime = false;

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

        // delete_time 仅为历史表结构兼容，模型禁用软删除。
    ];

    /**
     * JSON 字段
     * @var array
     */
    protected $json = [];
}
