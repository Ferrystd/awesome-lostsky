<?php
declare (strict_types=1);

namespace app\model;

use BackedEnum;
use think\Model;
use think\model\contract\EnumTransform;

class Base extends Model
{
    /**
     * 未实现 EnumTransform 的枚举，读取时自动输出 case name。
     */
    protected $enumReadName = true;

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

    /**
     * 获取枚举字段对应的枚举实例，供业务判断使用。
     *
     * EnumTransform 会把模型读取值自动转换为展示文案；这里同时兼容
     * 枚举实例、数据库底层值和已经转换后的展示文案。
     */
    public function enumCase(string $field): BackedEnum
    {
        $enum = $this->getFields($field);
        if (!is_string($enum) || !is_subclass_of($enum, BackedEnum::class)) {
            throw new \LogicException("字段 {$field} 未声明枚举类型");
        }

        $value = $this->getData($field);
        if ($value instanceof $enum) {
            return $value;
        }

        try {
            return $enum::from($value);
        } catch (\TypeError | \ValueError) {
            foreach ($enum::cases() as $case) {
                if ($case->name === $value || ($case instanceof EnumTransform && $case->value() === $value)) {
                    return $case;
                }
            }
        }

        throw new \UnexpectedValueException("字段 {$field} 的枚举值无效");
    }
}
