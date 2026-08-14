<?php
declare(strict_types=1);

namespace app\service;

use app\enum\BenefitPricingMode;
use app\model\BenefitPackage;
use app\model\BenefitPackageService;
use think\exception\HttpException;

final class BenefitPackagePricing
{
    private const MONEY_FIELDS = [
        'unit_price', 'unit_cost', 'unit_handler_cut', 'unit_sender_cut', 'unit_cs_cut',
    ];

    public function normalizeItem(array $item, int $sort): array
    {
        $quantityService = app(ServiceQuantity::class);
        $quantityMinor = $quantityService->toMinor($item['quantity'] ?? 0);
        $quantity = $quantityService->fromMinor($quantityMinor);
        $validDays = (int) ($item['valid_days'] ?? 0);
        if ($quantityMinor < 1 || $validDays < 0) {
            throw new HttpException(422, '服务数量或有效天数不正确');
        }

        $normalized = [
            'service_id' => (int) ($item['service_id'] ?? 0),
            'quantity' => $quantity,
            'valid_days' => $validDays,
            'sort' => $sort,
        ];
        foreach (self::MONEY_FIELDS as $field) {
            $normalized[$field] = $this->money($item[$field] ?? 0);
        }

        $price = $this->toCents($normalized['unit_price']);
        $cost = $this->toCents($normalized['unit_cost']);
        if ($cost > $price) throw new HttpException(422, '单项成本不能超过单项价格');

        $fixed = $this->toCents($normalized['unit_handler_cut'])
            + $this->toCents($normalized['unit_sender_cut'])
            + $this->toCents($normalized['unit_cs_cut']);
        if ($cost + $fixed > $price) throw new HttpException(422, '单项人员分配与成本之和不能超过单项价格');

        return $normalized;
    }

    public function isItemized(BenefitPackage $package): bool
    {
        return $package->enumCase('pricing_mode') === BenefitPricingMode::Itemized;
    }

    public function itemMoney(BenefitPackageService $item): array
    {
        $price = $this->toCents((string) $item->unit_price);
        $cost = $this->toCents((string) $item->unit_cost);
        $available = $price - $cost;
        if ($available < 0) throw new HttpException(422, '权益包服务项成本超过价格');

        $handler = $this->toCents((string) $item->unit_handler_cut);
        $sender = $this->toCents((string) $item->unit_sender_cut);
        $cs = $this->toCents((string) $item->unit_cs_cut);
        $team = $available - $handler - $sender - $cs;
        if ($team < 0) throw new HttpException(422, '权益包服务项分成不平衡');

        return [
            'total_price' => $this->fromCents($price),
            'cost' => $this->fromCents($cost),
            'handler_cut' => $this->fromCents($handler),
            'sender_cut' => $this->fromCents($sender),
            'cs_cut' => $this->fromCents($cs),
            'team_cut' => $this->fromCents($team),
        ];
    }

    public function summary(BenefitPackage $package): array
    {
        if (!$this->isItemized($package)) throw new HttpException(422, '历史权益包没有分项价格');
        $items = BenefitPackageService::where('package_id', $package->id)
            ->order('sort', 'asc')->order('id', 'asc')->select();
        if ($items->isEmpty()) throw new HttpException(422, '权益包没有可计价服务');

        $totals = array_fill_keys(['price', 'cost', 'handler_cut', 'sender_cut', 'cs_cut', 'team_cut'], 0);
        foreach ($items as $item) {
            $money = $this->itemMoney($item);
            $quantity = app(ServiceQuantity::class)->toMinor($item->quantity);
            $totals['price'] += $this->multiplyByQuantity($this->toCents($money['total_price']), $quantity);
            foreach (['cost', 'handler_cut', 'sender_cut', 'cs_cut', 'team_cut'] as $field) {
                $totals[$field] += $this->multiplyByQuantity($this->toCents($money[$field]), $quantity);
            }
        }
        foreach ($totals as $field => $cents) $totals[$field] = $this->fromCents($cents);
        return $totals;
    }

    public function configuration(BenefitPackage $package): array
    {
        $items = BenefitPackageService::where('package_id', $package->id)
            ->order('sort', 'asc')->order('id', 'asc')->select();
        $result = [];
        foreach ($items as $index => $item) {
            $result[] = $this->normalizeItem([
                'service_id' => $item->service_id,
                'quantity' => $item->quantity,
                'valid_days' => $item->valid_days,
                'unit_price' => $item->unit_price,
                'unit_cost' => $item->unit_cost,
                'unit_handler_cut' => $item->unit_handler_cut,
                'unit_sender_cut' => $item->unit_sender_cut,
                'unit_cs_cut' => $item->unit_cs_cut,
            ], $index);
        }
        return $result;
    }

    public function toCents(string $amount): int
    {
        if (!preg_match('/^(\d+)(?:\.(\d{1,2}))?$/D', $amount, $match)) {
            throw new HttpException(422, '金额格式无效');
        }
        return (int) $match[1] * 100 + (int) str_pad($match[2] ?? '', 2, '0');
    }

    public function fromCents(int $cents): string
    {
        if ($cents < 0) return '-' . $this->fromCents(-$cents);
        return intdiv($cents, 100) . '.' . str_pad((string) ($cents % 100), 2, '0', STR_PAD_LEFT);
    }

    public function itemTotalMoney(BenefitPackageService $item): array
    {
        $unit = $this->itemMoney($item);
        $quantity = app(ServiceQuantity::class)->toMinor($item->quantity);
        $result = [];
        foreach (['total_price', 'cost', 'handler_cut', 'sender_cut', 'cs_cut', 'team_cut'] as $field) {
            $result[$field] = $this->fromCents($this->multiplyByQuantity($this->toCents($unit[$field]), $quantity));
        }
        return $result;
    }

    private function multiplyByQuantity(int $cents, int $quantityMinor): int
    {
        return intdiv($cents * $quantityMinor + intdiv(ServiceQuantity::FACTOR, 2), ServiceQuantity::FACTOR);
    }

    private function money(mixed $value): string
    {
        if (!is_int($value) && !is_float($value) && !is_string($value)) {
            throw new HttpException(422, '金额格式无效');
        }
        $raw = (string) $value;
        $cents = $this->toCents($raw);
        return $this->fromCents($cents);
    }
}
