<?php
declare(strict_types=1);

namespace app\service;

use app\enum\ProductKind;
use app\enum\ServiceStatus;
use app\model\BenefitPackageService;
use app\model\Entity;
use app\model\RedemptionClaim;
use app\model\TeamCustomer;
use app\model\TeamOrder;
use app\model\TeamProduct;
use app\model\TeamService;
use app\model\TeamServiceInstance;
use app\model\TeamTransaction;
use think\exception\HttpException;

class BenefitFulfillment
{
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
        if (TeamServiceInstance::where('source_claim_id', $claim->id)->find()) {
            return TeamServiceInstance::where('source_claim_id', $claim->id)->column('id');
        }
        $campaign = $claim->campaign;
        $sourceProductId = (int) ($claim->code?->sourceOrder?->product_id ?? 0);
        $items = BenefitPackageService::where('package_id', $campaign->package_id)
            ->with(['service'])->order('id', 'asc')->select();
        if ($items->isEmpty()) throw new HttpException(422, '卡密不包含服务权益');
        $perCodeCount = array_sum(array_map(static fn ($item): int => (int) $item->quantity, $items->all()));
        if ($perCodeCount < 1) throw new HttpException(422, '卡密不包含服务权益');

        $customer = TeamCustomer::where('team_id', $teamId)->find($customerId);
        if (!$customer || (int) $customer->root_entity_id !== $holderEntityId) {
            throw new HttpException(403, '服务受益Entity无效');
        }
        $senderId = app(CustomerAssignment::class)->sender($customer, $teamId);
        $sourceOrder = $claim->code?->sourceOrder;
        $orderParts = [];
        $orderOffset = 0;
        if ($sourceOrder) {
            $totalCount = $perCodeCount * (int) $sourceOrder->quantity;
            $orderOffset = ((int) $claim->code->ordinal - 1) * $perCodeCount;
            if ($orderOffset < 0 || $orderOffset + $perCodeCount > $totalCount) {
                throw new HttpException(422, '卡密订单序号无效');
            }
            foreach (['total_price', 'cost', 'handler_cut', 'sender_cut', 'cs_cut'] as $field) {
                $orderParts[$field] = $this->splitMoney((string) $sourceOrder->{$field}, $totalCount);
            }
        }
        $ids = [];
        $ordinal = 0;
        foreach ($items as $item) {
            $service = $item->service;
            if (!$service || (int) $service->team_id !== $teamId || !(bool) $service->is_active) {
                throw new HttpException(422, '卡密包含不可用服务');
            }
            $defaultMoney = $sourceOrder ? null : $this->defaultServiceMoney($service);
            for ($i = 0; $i < (int) $item->quantity; $i++) {
                $ordinal++;
                if ($sourceOrder) {
                    $index = $orderOffset + $ordinal - 1;
                    $money = [];
                    foreach (['total_price', 'cost', 'handler_cut', 'sender_cut', 'cs_cut'] as $field) {
                        $money[$field] = $orderParts[$field][$index];
                    }
                    $money['team_cut'] = $this->fromCents(
                        $this->toCents($money['total_price'])
                        - $this->toCents($money['cost'])
                        - $this->toCents($money['handler_cut'])
                        - $this->toCents($money['sender_cut'])
                        - $this->toCents($money['cs_cut'])
                    );
                    if ($this->toCents($money['team_cut']) < 0) throw new HttpException(422, '服务卡密分成不平衡');
                } else {
                    $money = $defaultMoney;
                }
                $ids[] = $this->createInstance([
                    'team_id' => $teamId,
                    'service_id' => $service->id,
                    'customer_id' => $customerId,
                    'holder_entity_id' => $holderEntityId,
                    'source_product_id' => $sourceProductId ?: null,
                    'source_claim_id' => $claim->id,
                    'ordinal' => $ordinal,
                    'sender_entity_id' => $sourceOrder?->sender_entity_id ?: ($senderId ?: null),
                    'cs_entity_id' => $sourceOrder?->cs_entity_id ?: null,
                    'expire_time' => (int) $item->valid_days > 0 ? time() + (int) $item->valid_days * 86400 : 0,
                ] + $money);
            }
        }
        return $ids;
    }

    private function servicesFromOrder(TeamOrder $order, TeamProduct $product): array
    {
        $existing = TeamServiceInstance::where('source_order_id', $order->id)->column('id');
        if ($existing) return $existing;
        if (!$order->customer_id) throw new HttpException(422, '服务套餐订单必须关联客户');
        if (!$product->benefit_package_id) throw new HttpException(422, '服务套餐未配置权益');

        $items = BenefitPackageService::where('package_id', $product->benefit_package_id)
            ->with(['service'])->order('id', 'asc')->select();
        $perOrder = array_sum(array_map(static fn ($item): int => (int) $item->quantity, $items->all()));
        $count = $perOrder * (int) $order->quantity;
        if ($count < 1) throw new HttpException(422, '服务套餐没有可交付服务');

        $customer = TeamCustomer::where('team_id', $order->team_id)->find($order->customer_id);
        if (!$customer || !$customer->root_entity_id) throw new HttpException(422, '订单客户Entity不存在');
        $fields = ['total_price', 'cost', 'handler_cut', 'sender_cut', 'cs_cut'];
        $parts = [];
        foreach ($fields as $field) $parts[$field] = $this->splitMoney((string) $order->$field, $count);

        $ids = [];
        $ordinal = 0;
        for ($copy = 0; $copy < (int) $order->quantity; $copy++) {
            foreach ($items as $item) {
                $service = $item->service;
                if (!$service || (int) $service->team_id !== (int) $order->team_id || !(bool) $service->is_active) {
                    throw new HttpException(422, '服务套餐包含不可用服务');
                }
                for ($i = 0; $i < (int) $item->quantity; $i++) {
                    $index = $ordinal++;
                    $teamCut = $this->fromCents(
                        $this->toCents($parts['total_price'][$index])
                        - $this->toCents($parts['cost'][$index])
                        - $this->toCents($parts['handler_cut'][$index])
                        - $this->toCents($parts['sender_cut'][$index])
                        - $this->toCents($parts['cs_cut'][$index])
                    );
                    if ($this->toCents($teamCut) < 0) throw new HttpException(422, '服务套餐分成不平衡');
                    $ids[] = $this->createInstance([
                        'team_id' => $order->team_id,
                        'service_id' => $service->id,
                        'customer_id' => $order->customer_id,
                        'holder_entity_id' => $customer->root_entity_id,
                        'source_product_id' => $product->id,
                        'source_order_id' => $order->id,
                        'ordinal' => $ordinal,
                        'sender_entity_id' => $order->sender_entity_id ?: null,
                        'cs_entity_id' => $order->cs_entity_id ?: null,
                        'total_price' => $parts['total_price'][$index],
                        'cost' => $parts['cost'][$index],
                        'handler_cut' => $parts['handler_cut'][$index],
                        'sender_cut' => $parts['sender_cut'][$index],
                        'cs_cut' => $parts['cs_cut'][$index],
                        'team_cut' => $teamCut,
                        'expire_time' => (int) $item->valid_days > 0 ? time() + (int) $item->valid_days * 86400 : 0,
                    ]);
                }
            }
        }
        return $ids;
    }

    private function createInstance(array $data): int
    {
        $instance = new TeamServiceInstance;
        $instance->save($data + ['status' => ServiceStatus::Unredeemed]);
        return (int) $instance->id;
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

    private function splitMoney(string $amount, int $count): array
    {
        $cents = $this->toCents($amount);
        $base = intdiv($cents, $count);
        $remainder = $cents % $count;
        $result = [];
        for ($i = 0; $i < $count; $i++) $result[] = $this->fromCents($base + ($i < $remainder ? 1 : 0));
        return $result;
    }

    private function toCents(string $amount): int
    {
        if (!preg_match('/^(\d+)(?:\.(\d{1,2}))?$/D', $amount, $match)) throw new HttpException(422, '金额格式无效');
        return (int) $match[1] * 100 + (int) str_pad($match[2] ?? '', 2, '0');
    }

    private function fromCents(int $cents): string
    {
        if ($cents < 0) return '-' . $this->fromCents(-$cents);
        return intdiv($cents, 100) . '.' . str_pad((string) ($cents % 100), 2, '0', STR_PAD_LEFT);
    }
}
