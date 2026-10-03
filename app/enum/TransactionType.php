<?php
declare(strict_types=1);

namespace app\enum;

use think\model\contract\EnumTransform;

enum TransactionType: int implements EnumTransform
{
    case ShopOrder   = 1;
    case LedgerEntry = 2;
    case ServicePackageReceipt = 3;
    case ServiceRedemption = 4;
    case ServiceAdjustmentReceipt = 5;
    case ServiceAdjustmentPerformance = 6;
    case UnusedServiceSettlement = 7;

    public function value(): string
    {
        return match ($this) {
            self::ShopOrder   => '商城下单',
            self::LedgerEntry => '记账登记',
            self::ServicePackageReceipt => '服务包收款',
            self::ServiceRedemption => '服务核销',
            self::ServiceAdjustmentReceipt => '履约加价收款',
            self::ServiceAdjustmentPerformance => '履约加价业绩',
            self::UnusedServiceSettlement => '未使用权益结单',
        };
    }
}
