<?php
declare(strict_types=1);

namespace app\service;

use app\enum\ProductKind;
use app\model\BenefitPackage;
use app\model\BenefitPackageService;
use app\model\RedemptionClaim;
use app\model\TeamCustomer;
use app\model\TeamOrder;
use app\model\TeamProduct;
use app\model\TeamService;
use app\model\TeamServiceEntitlement;
use app\model\TeamTransaction;
use think\exception\HttpException;

class BenefitFulfillment
{
    private const MONEY_FIELDS = ['total_price', 'cost', 'handler_cut', 'sender_cut', 'cs_cut', 'team_cut'];

    public function fulfillOrder(TeamOrder $order): array
    {
        $product = TeamProduct::find($order->product_id);
        if (!$product) throw new HttpException(422, '订单商品不存在');

        return match ($product->enumCase('kind')) {
            ProductKind::ServiceBundle => ['services' => $this->servicesFromOrder($order, $product)],
            ProductKind::RedemptionCard => ['cards' => app(Redemption::class)->issueForOrder($order, $product)],
            default => [],
        };
    }

    public function servicesFromClaim(RedemptionClaim $claim, int $teamId, int $customerId, int $holderEntityId): array
    {
        $existing = TeamServiceEntitlement::where('source_claim_id', $claim->id)->column('id');
        if ($existing) return $existing;

        $campaign = $claim->campaign;
        $package = BenefitPackage::find((int) $campaign->package_id);
        if (!$package) throw new HttpException(422, '卡密权益包不存在');
        $items = $this->packageItems((int) $campaign->package_id, $teamId);
        $customer = TeamCustomer::where('team_id', $teamId)->find($customerId);
        if (!$customer || (int) $customer->root_entity_id !== $holderEntityId) {
            throw new HttpException(403, '服务受益Entity无效');
        }

        $sourceOrder = $claim->code?->sourceOrder;
        $sourceProductId = (int) ($sourceOrder?->product_id ?? 0);
        $senderId = (int) ($sourceOrder?->sender_entity_id ?: app(CustomerAssignment::class)->sender($customer, $teamId));
        $csId = (int) ($sourceOrder?->cs_entity_id ?? 0);
        $moneyRows = $this->claimMoney(
            $package,
            $items,
            $sourceOrder,
            (int) ($claim->code?->ordinal ?? 1),
            $senderId,
            $csId
        );

        $ids = [];
        foreach ($items as $index => $item) {
            $ids[] = $this->createEntitlement([
                'team_id' => $teamId,
                'service_id' => $item->service_id,
                'customer_id' => $customerId,
                'holder_entity_id' => $holderEntityId,
                'sender_entity_id' => $senderId ?: null,
                'cs_entity_id' => $csId ?: null,
                'source_product_id' => $sourceProductId ?: null,
                'source_claim_id' => $claim->id,
                'source_package_item_id' => $item->id,
                'ordinal' => $index + 1,
                'expire_time' => (int) $item->valid_days > 0 ? time() + (int) $item->valid_days * 86400 : 0,
            ], $item, $moneyRows[$index]);
        }
        return $ids;
    }

    public function grantProduct(
        TeamProduct $product,
        TeamCustomer $customer,
        int $quantity,
        ?int $senderEntityId,
        ?int $csEntityId
    ): array {
        if ($product->enumCase('kind') !== ProductKind::ServiceBundle || !$product->benefit_package_id) {
            throw new HttpException(422, '商品不是可直接赋予的服务套餐');
        }
        if ((int) $customer->team_id !== (int) $product->team_id || !$customer->root_entity_id) {
            throw new HttpException(422, '顾客权益主体无效');
        }
        if ($quantity < 1 || $quantity > 999) {
            throw new HttpException(422, '赋予份数必须在 1 到 999 之间');
        }

        $package = BenefitPackage::find((int) $product->benefit_package_id);
        if (!$package || !(bool) $package->is_active) {
            throw new HttpException(422, '服务套餐权益包不可用');
        }
        $items = $this->packageItems((int) $product->benefit_package_id, (int) $product->team_id);
        $specs = [];
        for ($copy = 0; $copy < $quantity; $copy++) {
            foreach ($items as $item) $specs[] = $item;
        }

        if (app(BenefitPackagePricing::class)->isItemized($package)) {
            $moneyRows = array_map(
                fn (BenefitPackageService $item): array => app(BenefitPackagePricing::class)->itemTotalMoney($item),
                $specs
            );
        } else {
            $totals = [];
            foreach (self::MONEY_FIELDS as $field) {
                $totals[$field] = $this->fromCents($this->toCents((string) ($product->{$field} ?? 0)) * $quantity);
            }
            $moneyRows = $this->allocateMoney(
                $totals,
                array_map(fn (BenefitPackageService $item): int => app(ServiceQuantity::class)->toMinor($item->quantity), $specs)
            );
        }

        $ids = [];
        foreach ($specs as $index => $item) {
            $money = $this->applyRoleAvailability($moneyRows[$index], $senderEntityId !== null, $csEntityId !== null);
            $ids[] = $this->createEntitlement([
                'team_id' => $product->team_id,
                'service_id' => $item->service_id,
                'customer_id' => $customer->id,
                'holder_entity_id' => $customer->root_entity_id,
                'sender_entity_id' => $senderEntityId,
                'cs_entity_id' => $csEntityId,
                'source_product_id' => $product->id,
                'source_package_item_id' => $item->id,
                'ordinal' => $index + 1,
                'expire_time' => (int) $item->valid_days > 0 ? time() + (int) $item->valid_days * 86400 : 0,
            ], $item, $money);
        }
        return $ids;
    }

    private function servicesFromOrder(TeamOrder $order, TeamProduct $product): array
    {
        $existing = TeamServiceEntitlement::where('source_order_id', $order->id)->column('id');
        if ($existing) return $existing;
        if (!$order->customer_id) throw new HttpException(422, '服务套餐订单必须关联顾客');
        if (!$product->benefit_package_id) throw new HttpException(422, '服务套餐未配置权益');

        $package = BenefitPackage::find((int) $product->benefit_package_id);
        if (!$package) throw new HttpException(422, '服务套餐权益包不存在');
        $items = $this->packageItems((int) $product->benefit_package_id, (int) $order->team_id);
        $customer = TeamCustomer::where('team_id', $order->team_id)->find($order->customer_id);
        if (!$customer || !$customer->root_entity_id) throw new HttpException(422, '订单顾客Entity不存在');

        $specs = [];
        for ($copy = 0; $copy < (int) $order->quantity; $copy++) {
            foreach ($items as $item) $specs[] = $item;
        }
        if (app(BenefitPackagePricing::class)->isItemized($package)) {
            $moneyRows = array_map(
                fn (BenefitPackageService $item): array => app(BenefitPackagePricing::class)->itemTotalMoney($item),
                $specs
            );
        } else {
            $moneyRows = $this->allocateMoney(
                array_combine(self::MONEY_FIELDS, array_map(fn (string $field): string => (string) $order->{$field}, self::MONEY_FIELDS)),
                array_map(fn (BenefitPackageService $item): int => app(ServiceQuantity::class)->toMinor($item->quantity), $specs)
            );
        }

        $ids = [];
        foreach ($specs as $index => $item) {
            $money = $this->applyRoleAvailability(
                $moneyRows[$index],
                (int) ($order->sender_entity_id ?? 0) > 0,
                (int) ($order->cs_entity_id ?? 0) > 0
            );
            $ids[] = $this->createEntitlement([
                'team_id' => $order->team_id,
                'service_id' => $item->service_id,
                'customer_id' => $order->customer_id,
                'holder_entity_id' => $customer->root_entity_id,
                'sender_entity_id' => $order->sender_entity_id ?: null,
                'cs_entity_id' => $order->cs_entity_id ?: null,
                'source_product_id' => $product->id,
                'source_order_id' => $order->id,
                'source_package_item_id' => $item->id,
                'ordinal' => $index + 1,
                'expire_time' => (int) $item->valid_days > 0 ? time() + (int) $item->valid_days * 86400 : 0,
            ], $item, $money);
        }
        return $ids;
    }

    private function packageItems(int $packageId, int $teamId): array
    {
        $items = BenefitPackageService::where('package_id', $packageId)
            ->with(['service'])->order('sort', 'asc')->order('id', 'asc')->select()->all();
        if (!$items) throw new HttpException(422, '权益包不包含服务权益');
        foreach ($items as $item) {
            if (!$item->service || (int) $item->service->team_id !== $teamId || !(bool) $item->service->is_active) {
                throw new HttpException(422, '权益包包含不可用服务');
            }
        }
        return $items;
    }

    private function claimMoney(
        BenefitPackage $package,
        array $items,
        ?TeamOrder $sourceOrder,
        int $codeOrdinal,
        int $senderId,
        int $csId
    ): array
    {
        if (app(BenefitPackagePricing::class)->isItemized($package)) {
            return array_map(
                fn (BenefitPackageService $item): array => $this->applyRoleAvailability(
                    app(BenefitPackagePricing::class)->itemTotalMoney($item),
                    $senderId > 0,
                    $csId > 0
                ),
                $items
            );
        }

        if ($sourceOrder) {
            $codeMoney = [];
            foreach (self::MONEY_FIELDS as $field) {
                $parts = $this->splitMoney((string) $sourceOrder->{$field}, (int) $sourceOrder->quantity);
                $codeMoney[$field] = $parts[$codeOrdinal - 1] ?? throw new HttpException(422, '卡密订单序号无效');
            }
            return $this->allocateMoney(
                $codeMoney,
                array_map(fn (BenefitPackageService $item): int => app(ServiceQuantity::class)->toMinor($item->quantity), $items)
            );
        }

        return array_map(function (BenefitPackageService $item) use ($senderId, $csId): array {
            $unit = $this->defaultServiceMoney($item->service);
            $quantity = app(ServiceQuantity::class)->toMinor($item->quantity);
            $result = [];
            foreach (self::MONEY_FIELDS as $field) {
                $result[$field] = $this->fromCents(intdiv(
                    $this->toCents($unit[$field]) * $quantity + intdiv(ServiceQuantity::FACTOR, 2),
                    ServiceQuantity::FACTOR
                ));
            }
            return $this->applyRoleAvailability($result, $senderId > 0, $csId > 0);
        }, $items);
    }

    private function createEntitlement(array $data, BenefitPackageService $item, array $money): int
    {
        $service = $item->service;
        $entitlement = new TeamServiceEntitlement;
        $entitlement->save($data + $money + [
            'unit_name' => $service->unit_name ?: '次',
            'quantity_step' => $service->quantity_step ?: '1.0000',
            'granted_quantity' => $item->quantity,
            'reserved_quantity' => '0.0000',
            'consumed_quantity' => '0.0000',
        ]);
        return (int) $entitlement->id;
    }

    private function defaultServiceMoney(TeamService $service): array
    {
        return (new TeamTransaction)->normalizeMoney([
            'total_price' => $service->default_total_price,
            'cash' => 0,
            'prepaid' => 0,
            'service_credit' => $service->default_total_price,
            'cost' => $service->default_cost,
            'handler_cut' => $service->default_handler_cut,
            'sender_cut' => $service->default_sender_cut,
            'cs_cut' => $service->default_cs_cut,
            'team_cut' => $service->default_team_cut,
        ]);
    }

    private function allocateMoney(array $totals, array $weights): array
    {
        $weightTotal = array_sum($weights);
        if ($weightTotal < 1) throw new HttpException(422, '权益额度必须大于零');
        $rows = array_fill(0, count($weights), []);
        foreach (self::MONEY_FIELDS as $field) {
            $total = $this->toCents((string) ($totals[$field] ?? 0));
            $before = 0;
            $cumulative = 0;
            foreach ($weights as $index => $weight) {
                $cumulative += $weight;
                $after = intdiv($total * $cumulative, $weightTotal);
                $rows[$index][$field] = $this->fromCents($after - $before);
                $before = $after;
            }
        }
        return $rows;
    }

    private function applyRoleAvailability(array $money, bool $hasSender, bool $hasCs): array
    {
        $team = $this->toCents($money['team_cut']);
        if (!$hasSender) { $team += $this->toCents($money['sender_cut']); $money['sender_cut'] = '0.00'; }
        if (!$hasCs) { $team += $this->toCents($money['cs_cut']); $money['cs_cut'] = '0.00'; }
        $money['team_cut'] = $this->fromCents($team);
        return $money;
    }

    private function splitMoney(string $amount, int $count): array
    {
        if ($count < 1) throw new HttpException(422, '卡密数量无效');
        $cents = $this->toCents($amount);
        $base = intdiv($cents, $count);
        $remainder = $cents % $count;
        $result = [];
        for ($i = 0; $i < $count; $i++) $result[] = $this->fromCents($base + ($i < $remainder ? 1 : 0));
        return $result;
    }

    private function toCents(string $amount): int
    {
        return app(BenefitPackagePricing::class)->toCents($amount);
    }

    private function fromCents(int $cents): string
    {
        return app(BenefitPackagePricing::class)->fromCents($cents);
    }
}
