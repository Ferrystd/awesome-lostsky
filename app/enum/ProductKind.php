<?php
declare(strict_types=1);

namespace app\enum;

use think\model\contract\EnumTransform;

enum ProductKind: int implements EnumTransform
{
    case Standard = 1;
    case ServiceBundle = 2;
    case RedemptionCard = 3;

    public function value(): string
    {
        return match ($this) {
            self::Standard => '普通商品',
            self::ServiceBundle => '服务套餐',
            self::RedemptionCard => '权益卡密',
        };
    }
}
