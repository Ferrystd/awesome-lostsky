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

    /** 下单事务内冻结核销商品的承诺，不将内部金额快照暴露给顾客。 */
    public function snapshotProduct(TeamProduct $product, array $path = []): array
    {
        app(ProductVariant::class)->assertAvailable($product);
        if (count($path) > 3 || in_array((int) $product->id, $path, true)) throw new HttpException(422, '商品组合存在循环或超过嵌套上限');
        $path[] = (int) $product->id;
        $kind = $product->enumCase('kind');
        $snapshot = ['version' => 1, 'kind' => $kind->value];
        if ($kind === ProductKind::RedemptionCard) {
            $campaign = \app\model\RedemptionCampaign::where('issuer_team_id', $product->team_id)->lock(true)->find((int) $product->redemption_campaign_id);
            if (!$campaign || !$campaign->is_active || ($campaign->owner_entity_id !== null && (int) $campaign->owner_entity_id !== (int) $product->entity_id)) {
                throw new HttpException(422, '卡密活动不可用或归属不匹配');
            }
            $target = new TeamProduct(['id' => $product->id, 'team_id' => $product->team_id, 'entity_id' => $product->entity_id,
                'kind' => ProductKind::ServiceBundle, 'is_active' => 1, 'benefit_package_id' => $campaign->package_id]);
            array_pop($path);
            $snapshot['campaign_id'] = (int) $campaign->id;
            $snapshot['target'] = $this->snapshotProduct($target, $path);
            $snapshot['pricing_locked'] = !empty($snapshot['target']['pricing_locked']);
            return $snapshot;
        }
        if (!in_array($kind, [ProductKind::Redeemable, ProductKind::ServiceBundle], true)) return $snapshot;
        $package = BenefitPackage::where('issuer_team_id', $product->team_id)->lock(true)->find((int) $product->benefit_package_id);
        if (!$package || !$package->is_active || ($package->owner_entity_id !== null && (int) $package->owner_entity_id !== (int) $product->entity_id)) {
            throw new HttpException(422, '商品权益配置不可用或归属不匹配');
        }
        $snapshot['pricing_mode'] = $package->enumCase('pricing_mode')->value;
        $snapshot['items'] = [];
        $productItems = BenefitPackageService::where('package_id', $package->id)->whereNotNull('product_id')->order('sort')->lock(true)->select();
        if (!$productItems->isEmpty()) {
            $snapshot['composition'] = true;
            $snapshot['ordinary'] = [];
            $snapshot['cards'] = [];
            $expandedUnits = 0;
            foreach ($productItems as $item) {
                $child = TeamProduct::where('team_id', $product->team_id)->lock(true)->find((int) $item->product_id);
                if (!$child || !$child->is_active || ($child->entity_id !== null && (int) $child->entity_id !== (int) $product->entity_id)) throw new HttpException(422, '套餐子项不可用');
                $minor = app(ServiceQuantity::class)->toMinor($item->quantity);
                if ($minor % ServiceQuantity::FACTOR !== 0 || $minor < 1 || $minor > 10000 * ServiceQuantity::FACTOR) throw new HttpException(422, '套餐数量不正确');
                $copies = intdiv($minor, ServiceQuantity::FACTOR);
                $childSnapshot = $this->snapshotProduct($child, $path);
                $expandedUnits += $copies * $this->snapshotUnits($childSnapshot);
                if ($expandedUnits > 10000) throw new HttpException(422, '商品组合超过最大展开规模');
                if (in_array($child->enumCase('kind'), [ProductKind::ServiceBundle, ProductKind::RedemptionCard], true)) {
                    $snapshot['pricing_locked'] = true;
                }
                $money = app(BenefitPackagePricing::class)->itemMoney($item);
                if ($child->enumCase('kind') === ProductKind::RedemptionCard) {
                    $target = $childSnapshot['target'];
                    if (!isset($target['composition'])) {
                        $allocated = $this->allocateMoney($money,
                            array_map(fn ($entry) => app(ServiceQuantity::class)->toMinor($entry['quantity']), $target['items']));
                        foreach ($target['items'] as $index => &$entry) $entry['allocated_money'] = $allocated[$index];
                        unset($entry);
                        $target['composition'] = true;
                        $target['ordinary'] = [];
                        $target['cards'] = [];
                    }
                    $snapshot['cards'][] = ['product_id' => (int) $child->id, 'quantity' => $copies, 'money' => $money,
                        'product_name' => app(ProductVariant::class)->displayName($child),
                        'campaign_id' => $childSnapshot['campaign_id'], 'target' => $target];
                    continue;
                }
                if ($child->enumCase('kind') === ProductKind::Standard) {
                    $snapshot['ordinary'][] = ['product_id' => (int) $child->id, 'quantity' => $copies, 'money' => $money,
                        'product_name' => app(ProductVariant::class)->displayName($child), 'product_cover_image' => $child->cover_image];
                    continue;
                }
                $childItems = $childSnapshot['items'];
                if (isset($childSnapshot['composition'])) {
                    $pricing = app(BenefitPackagePricing::class);
                    $totals = array_fill_keys(self::MONEY_FIELDS, 0);
                    foreach ($childItems as $entry) {
                        foreach (self::MONEY_FIELDS as $field) $totals[$field] += $pricing->toCents($entry['allocated_money'][$field]);
                    }
                    foreach ($childSnapshot['ordinary'] as $entry) {
                        foreach (self::MONEY_FIELDS as $field) $totals[$field] += $pricing->toCents($entry['money'][$field]) * $entry['quantity'];
                    }
                    foreach ($childSnapshot['cards'] ?? [] as $entry) {
                        foreach (self::MONEY_FIELDS as $field) $totals[$field] += $pricing->toCents($entry['money'][$field]) * $entry['quantity'];
                    }
                    foreach ($totals as $field => $cents) {
                        if ($cents !== $pricing->toCents($money[$field])) throw new HttpException(422, '嵌套来源计价已变化，请重新配置套餐');
                    }
                }
                $allocated = isset($childSnapshot['composition']) ? null : $this->allocateMoney($money,
                    array_map(fn ($entry) => app(ServiceQuantity::class)->toMinor($entry['quantity']), $childItems));
                for ($copy = 0; $copy < $copies; ++$copy) {
                    foreach ($childItems as $index => $values) {
                        if ($allocated !== null) $values['allocated_money'] = $allocated[$index];
                        $snapshot['items'][] = $values;
                    }
                    foreach ($childSnapshot['ordinary'] ?? [] as $ordinary) $snapshot['ordinary'][] = $ordinary;
                    foreach ($childSnapshot['cards'] ?? [] as $card) $snapshot['cards'][] = $card;
                }
            }
            return $snapshot;
        }
        foreach ($this->packageItems((int) $package->id, (int) $product->team_id) as $item) {
            $values = array_intersect_key($item->toArray(), array_flip([
                'id', 'service_id', 'quantity', 'valid_days', 'unit_price', 'unit_cost',
                'unit_handler_cut', 'unit_sender_cut', 'unit_cs_cut',
            ]));
            $service = TeamService::where('team_id', $product->team_id)->lock(true)->find((int) $item->service_id);
            if (!$service || !$service->is_active || ($service->owner_entity_id !== null && (int) $service->owner_entity_id !== (int) $product->entity_id)) {
                throw new HttpException(422, '商品核销配置不可用或归属不匹配');
            }
            $values['service'] = ['id' => (int) $service->id, 'name' => (string) $service->name, 'unit_name' => (string) $service->unit_name, 'quantity_step' => (string) $service->quantity_step];
            foreach (self::MONEY_FIELDS as $field) {
                $values['service']['default_' . $field] = (string) $service->{'default_' . $field};
            }
            $snapshot['items'][] = $values;
        }
        return $snapshot;
    }

    /** 计算最终基础项份数；核销额度不是商品份数，卡密目标仍计入展开上限。 */
    private function snapshotUnits(array $snapshot): int
    {
        if (isset($snapshot['target'])) return $this->snapshotUnits($snapshot['target']);
        $units = count($snapshot['items'] ?? []);
        foreach ($snapshot['ordinary'] ?? [] as $entry) $units += $entry['quantity'];
        foreach ($snapshot['cards'] ?? [] as $entry) $units += $entry['quantity'] * $this->snapshotUnits($entry['target']);
        return max(1, $units);
    }

    public function fulfillOrder(TeamOrder $order): array
    {
        $product = TeamProduct::withTrashed()->find($order->product_id);
        if (!$product) throw new HttpException(422, '订单商品不存在');

        $snapshot = $order->fulfillment_snapshot;
        if (!empty($snapshot['cards'])) {
            return ['services' => $this->servicesFromOrder($order, $product), 'cards' => app(Redemption::class)->issueForOrder($order, $product)];
        }
        return match (is_array($snapshot) && isset($snapshot['kind']) ? ProductKind::from($snapshot['kind']) : $product->enumCase('kind')) {
            ProductKind::ServiceBundle, ProductKind::Redeemable => ['services' => $this->servicesFromOrder($order, $product)],
            ProductKind::RedemptionCard => ['cards' => app(Redemption::class)->issueForOrder($order, $product)],
            default => [],
        };
    }

    public function servicesFromClaim(RedemptionClaim $claim, int $teamId, int $customerId, int $holderEntityId): array
    {
        $existing = TeamServiceEntitlement::where('source_claim_id', $claim->id)->column('id');
        if ($existing) return $existing;

        $campaign = $claim->campaign;
        $sourceOrder = $claim->code?->sourceOrder;
        $snapshot = $claim->code?->fulfillment_snapshot ?: ($sourceOrder?->fulfillment_snapshot['target'] ?? null);
        if (is_array($snapshot) && isset($snapshot['items'], $snapshot['pricing_mode'])) {
            $package = new BenefitPackage(['pricing_mode' => $snapshot['pricing_mode']]);
            $items = [];
            foreach ($snapshot['items'] as $values) {
                $serviceValues = $values['service'];
                unset($values['service']);
                $item = new BenefitPackageService($values);
                $item->setRelation('service', new TeamService($serviceValues));
                $items[] = $item;
            }
        } else {
            $package = BenefitPackage::find((int) $campaign->package_id);
            if (!$package) throw new HttpException(422, '卡密权益包不存在');
            $items = $this->packageItems((int) $campaign->package_id, $teamId);
        }
        $customer = TeamCustomer::where('team_id', $teamId)->find($customerId);
        if (!$customer || (int) $customer->root_entity_id !== $holderEntityId) {
            throw new HttpException(403, '服务受益Entity无效');
        }

        $settlementSource = $snapshot['settlement_source'] ?? null;
        if ($settlementSource === null) {
            $settlementSource = [
                'product_id' => (int) ($sourceOrder?->product_id ?? 0),
                'sender_entity_id' => $sourceOrder
                    ? $sourceOrder->sender_entity_id
                    : app(CustomerAssignment::class)->sender($customer, $teamId),
                'cs_entity_id' => $sourceOrder?->cs_entity_id,
            ];
        }
        $ordinal = 0;
        foreach ($snapshot['cards'] ?? [] as $card) {
            for ($copy = 0; $copy < $card['quantity']; ++$copy) {
                ++$ordinal;
                if (!\app\model\RedemptionCode::where('source_claim_id', $claim->id)->where('ordinal', $ordinal)->find()) {
                    $targetSnapshot = $card['target'];
                    $targetSnapshot['settlement_source'] = $settlementSource;
                    app(Redemption::class)->issue($card['campaign_id'], $holderEntityId, [
                        'source_claim_id' => (int) $claim->id, 'ordinal' => $ordinal, 'fulfillment_snapshot' => $targetSnapshot,
                    ]);
                }
            }
        }

        $sourceProductId = (int) $settlementSource['product_id'];
        $senderId = (int) ($settlementSource['sender_entity_id'] ?? 0);
        $csId = (int) ($settlementSource['cs_entity_id'] ?? 0);
        foreach ($snapshot['ordinary'] ?? [] as $index => $entry) {
            app(Order::class)->deliverClaimProduct($claim, $customer, $entry, $index + 1, $senderId ?: null, $csId ?: null);
        }
        $moneyRows = isset($snapshot['composition']) ? array_map(
            fn (array $values): array => $this->applyRoleAvailability($values['allocated_money'], $senderId > 0, $csId > 0),
            $snapshot['items']
        ) : $this->claimMoney(
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
        if (!in_array($product->enumCase('kind'), [ProductKind::ServiceBundle, ProductKind::Redeemable], true) || !$product->benefit_package_id) {
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
        $snapshot = $this->snapshotProduct($product);
        if (!empty($snapshot['ordinary']) || !empty($snapshot['cards'])) {
            throw new HttpException(422, '套餐包含普通商品或卡密，请通过订单交付，不能仅赋予核销权益');
        }
        $items = [];
        foreach ($snapshot['items'] as $values) {
            $serviceValues = $values['service'];
            unset($values['service']);
            $item = new BenefitPackageService($values);
            $item->setRelation('service', new TeamService($serviceValues));
            $items[] = $item;
        }
        $specs = [];
        for ($copy = 0; $copy < $quantity; $copy++) {
            foreach ($items as $item) $specs[] = $item;
        }

        if (isset($snapshot['composition'])) {
            $moneyRows = [];
            for ($copy = 0; $copy < $quantity; ++$copy) {
                foreach ($snapshot['items'] as $values) $moneyRows[] = $values['allocated_money'];
            }
        } elseif (app(BenefitPackagePricing::class)->isItemized($package)) {
            $moneyRows = array_map(
                fn (BenefitPackageService $item): array => app(BenefitPackagePricing::class)->itemTotalMoney($item),
                $specs
            );
        } else {
            $totals = [];
            foreach (self::MONEY_FIELDS as $field) {
                $sourceField = $field === 'total_price' ? 'price' : $field;
                $totals[$field] = $this->fromCents($this->toCents((string) ($product->{$sourceField} ?? 0)) * $quantity);
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

        $snapshot = $order->fulfillment_snapshot;
        if (is_array($snapshot) && isset($snapshot['items'], $snapshot['pricing_mode'])) {
            $package = new BenefitPackage(['pricing_mode' => $snapshot['pricing_mode']]);
            $items = [];
            foreach ($snapshot['items'] as $values) {
                $serviceValues = $values['service'];
                unset($values['service']);
                $item = new BenefitPackageService($values);
                $item->setRelation('service', new TeamService($serviceValues));
                $items[] = $item;
            }
        } else {
            if (!$product->benefit_package_id) throw new HttpException(422, '服务套餐未配置权益');
            $package = BenefitPackage::find((int) $product->benefit_package_id);
            if (!$package) throw new HttpException(422, '服务套餐权益包不存在');
            $items = $this->packageItems((int) $product->benefit_package_id, (int) $order->team_id);
        }
        $customer = TeamCustomer::where('team_id', $order->team_id)->find($order->customer_id);
        if (!$customer || !$customer->root_entity_id) throw new HttpException(422, '订单顾客Entity不存在');

        $specs = [];
        for ($copy = 0; $copy < (int) $order->quantity; $copy++) {
            foreach ($items as $item) $specs[] = $item;
        }
        if (isset($snapshot['composition'])) {
            $moneyRows = [];
            for ($copy = 0; $copy < (int) $order->quantity; ++$copy) {
                foreach ($snapshot['items'] as $values) $moneyRows[] = $values['allocated_money'];
            }
        } elseif (app(BenefitPackagePricing::class)->isItemized($package)) {
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
