<?php
declare (strict_types=1);

namespace app\model;

use think\Model;

class Base extends Model
{
    /**
     * 自动写入时间戳
     * @var bool
     */
    protected $autoWriteTimestamp = true;

    /**
     * 软删除
     */
    use \think\model\concern\SoftDelete;
    protected $deleteTime = 'delete_time';

    /**
     * 默认隐藏字段（子模型覆盖时需保留 delete_time）
     */
    protected $hidden = ['delete_time'];
}
