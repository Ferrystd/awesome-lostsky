<?php
declare(strict_types=1);

namespace app\service;

use app\exception\AccessDeniedException;

final class PersonalPricing
{
    public function allows(int $teamId, array $actingEntity): bool
    {
        return app(PermissionGate::class)->allows($teamId, $actingEntity, [PermissionDictionary::SHOP_PRODUCT_SELF_REPRICE]);
    }

    /** 缺少调价权限时保留基线，并拒绝显式篡改；省略字段也不能触发下游重新分配。 */
    public function preserve(array $data, array $baseline): array
    {
        foreach ($baseline as $field => $value) {
            if (array_key_exists($field, $data) && !$this->sameMoney($data[$field], $value)) {
                throw AccessDeniedException::permission([PermissionDictionary::SHOP_PRODUCT_SELF_REPRICE]);
            }
            $data[$field] = $value;
        }
        return $data;
    }

    public function defaults(int $teamId, mixed $price, mixed $cost, string $prefix = ''): array
    {
        $settings = app(TeamSetting::class)->internal($teamId, 'service');
        $available = max(0, (int) round(((float) $price - (float) $cost) * 100));
        $result = [];
        foreach (['handler', 'sender', 'cs'] as $person) {
            $cents = intdiv($available * (int) $settings['default_' . $person . '_rate_percent'], 100);
            $result[$prefix . $person . '_cut'] = number_format($cents / 100, 2, '.', '');
        }
        return $result;
    }

    private function sameMoney(mixed $value, mixed $baseline): bool
    {
        if ($value === null || $baseline === null) return $value === $baseline;
        return is_numeric($value) && is_numeric($baseline)
            && is_finite((float) $value)
            && (int) round((float) $value * 100) === (int) round((float) $baseline * 100);
    }
}
