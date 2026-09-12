<?php
declare(strict_types=1);

namespace app\service;

use app\enum\ProductKind;
use think\exception\HttpException;

/** 商品引用图校验；调用方负责在同一数据库事务中读取和锁定定义。 */
final class ProductComposition
{
    private const MAX_DEPTH = 3;
    private const MAX_NODES = 1000;
    private const MAX_QUANTITY = 10000;

    /** 从受信任的数据库定义验证引用链，旧服务项只作为内部核销叶子参与校验。 */
    public function inspectStored(array $root): array
    {
        $teamId = (int) $root['team_id'];
        $virtual = [];
        return $this->inspect($root, function (int $id) use ($teamId, &$virtual): ?array {
            if (isset($virtual[$id])) return $virtual[$id];
            $product = \app\model\TeamProduct::where('team_id', $teamId)->lock(true)->find($id);
            if (!$product) return null;
            $kind = $product->enumCase('kind');
            $result = ['id' => (int) $product->id, 'team_id' => $teamId, 'entity_id' => $product->entity_id,
                'kind' => $kind, 'is_active' => $product->is_active, 'items' => []];
            if (!in_array($kind, [ProductKind::ServiceBundle, ProductKind::RedemptionCard], true)) return $result;
            $packageId = (int) $product->benefit_package_id;
            if ($kind === ProductKind::RedemptionCard) {
                $campaign = \app\model\RedemptionCampaign::where('issuer_team_id', $teamId)->lock(true)->find((int) $product->redemption_campaign_id);
                if (!$campaign || !$campaign->is_active || ($campaign->owner_entity_id !== null && (int) $campaign->owner_entity_id !== (int) $product->entity_id)) {
                    throw new HttpException(422, '卡密配置不可用或归属不匹配');
                }
                $packageId = (int) $campaign->package_id;
            }
            $package = \app\model\BenefitPackage::where('issuer_team_id', $teamId)->lock(true)->find($packageId);
            if (!$package || !$package->is_active || ($package->owner_entity_id !== null && (int) $package->owner_entity_id !== (int) $product->entity_id)) {
                throw new HttpException(422, '商品组成配置不可用或归属不匹配');
            }
            foreach (\app\model\BenefitPackageService::where('package_id', $packageId)->order('sort')->lock(true)->select() as $item) {
                if ($item->product_id !== null) {
                    $minor = app(ServiceQuantity::class)->toMinor($item->quantity);
                    if ($minor % ServiceQuantity::FACTOR !== 0) throw new HttpException(422, '商品份数必须为整数');
                    $result['items'][] = ['product_id' => (int) $item->product_id, 'quantity' => intdiv($minor, ServiceQuantity::FACTOR)];
                } else {
                    $service = \app\model\TeamService::where('team_id', $teamId)->lock(true)->find((int) $item->service_id);
                    if (!$service) throw new HttpException(422, '历史核销配置不存在');
                    $key = PHP_INT_MAX - (int) $service->id;
                    $virtual[$key] = ['id' => $key, 'team_id' => $teamId, 'entity_id' => $service->owner_entity_id,
                        'kind' => ProductKind::Redeemable, 'is_active' => $service->is_active, 'items' => []];
                    $result['items'][] = ['product_id' => $key, 'quantity' => 1];
                }
            }
            return $result;
        });
    }

    /**
     * 校验保存候选并构建引用树；卡密保留兑换边界，不在此处执行交付。
     *
     * root/load 返回内部商品定义：id、team_id、entity_id、kind、is_active、items。
     * items 每项包含 product_id 和正整数 quantity；root 可使用 id=0 表示新建。
     * load 必须返回指定 ID 的完整定义或 null，不接受客户端提供的子商品定义。
     */
    public function inspect(array $root, callable $load): array
    {
        $teamId = $this->positiveInteger($root['team_id'] ?? null, '商品团队不正确');
        $cache = [];
        $nodes = 0;
        $units = 0;
        return $this->visit($root, $teamId, null, [], 0, 1, $load, $cache, $nodes, $units);
    }

    /**
     * 构建一次销售交付或一次卡密兑换的动作清单，不写入订单或权益。
     * 普通项仅记录交付，核销项发放权益；遇到卡密即停止展开，等待顾客兑换。
     */
    public function deliveries(array $root, callable $load, bool $redeemCard = false): array
    {
        $tree = $this->inspect($root, $load);
        if ($redeemCard) {
            if ($tree['kind'] !== ProductKind::RedemptionCard->value) {
                throw new HttpException(422, '只有卡密商品可以执行兑换');
            }
            $tree = $tree['children'][0];
        }
        $result = [];
        $this->collectDeliveries($tree, '0', $result);
        return $result;
    }

    private function collectDeliveries(array $tree, string $path, array &$result): void
    {
        if ($tree['kind'] === ProductKind::ServiceBundle->value) {
            foreach ($tree['children'] as $index => $child) {
                $this->collectDeliveries($child, $path . '.' . $index, $result);
            }
            return;
        }
        $result[] = [
            'path' => $path,
            'product_id' => $tree['product_id'],
            'quantity' => $tree['quantity'],
            'action' => match (ProductKind::from($tree['kind'])) {
                ProductKind::Standard => 'ordinary',
                ProductKind::Redeemable => 'entitlement',
                ProductKind::RedemptionCard => 'card',
                default => throw new \LogicException('套餐应在交付前展开'),
            },
        ];
    }

    private function visit(
        array $product,
        int $teamId,
        ?int $parentOwner,
        array $path,
        int $depth,
        int $quantity,
        callable $load,
        array &$cache,
        int &$nodes,
        int &$units,
    ): array {
        if ($depth > self::MAX_DEPTH || ++$nodes > self::MAX_NODES) {
            throw new HttpException(422, '商品组合超过三层引用或最大展开规模');
        }
        $id = $product['id'] ?? null;
        if ($depth === 0 && $id === 0) {
            $id = 0;
        } else {
            $id = $this->positiveInteger($id, '商品标识不正确');
        }
        if (in_array($id, $path, true)) {
            throw new HttpException(422, '商品不能直接或间接引用自身');
        }
        if ($this->positiveInteger($product['team_id'] ?? null, '商品团队不正确') !== $teamId) {
            throw new HttpException(422, '商品不能引用其他团队的商品');
        }
        $owner = ($product['entity_id'] ?? null) === null
            ? null : $this->positiveInteger($product['entity_id'], '商品归属不正确');
        if ($depth > 0 && $owner !== null && $owner !== $parentOwner) {
            throw new HttpException(422, '商品不能引用其他 Entity 的商品');
        }
        if ($depth > 0 && !in_array($product['is_active'] ?? null, [1, '1', true], true)) {
            throw new HttpException(422, '引用商品不存在或已停用');
        }
        $kind = $product['kind'] ?? null;
        if (!$kind instanceof ProductKind) {
            $kind = ProductKind::tryFrom($this->positiveInteger($kind, '商品类型不正确'));
        }
        if ($kind === null) throw new HttpException(422, '商品类型不正确');
        $items = $product['items'] ?? [];
        if (!is_array($items) || !array_is_list($items)) {
            throw new HttpException(422, '商品组成必须为列表');
        }
        $composite = in_array($kind, [ProductKind::ServiceBundle, ProductKind::RedemptionCard], true);
        if (!$composite && $items !== []) {
            throw new HttpException(422, '普通商品和核销商品不能包含其他商品');
        }
        if ($composite && $items === []) {
            throw new HttpException(422, '套餐或卡密必须配置目标商品');
        }
        if ($kind === ProductKind::RedemptionCard && count($items) !== 1) {
            throw new HttpException(422, '卡密必须对应一个目标商品；多个商品请先组成套餐');
        }
        $path[] = $id;
        $children = [];
        $nested = false;
        foreach ($items as $item) {
            if (!is_array($item)) throw new HttpException(422, '商品组成格式不正确');
            $childId = $this->positiveInteger($item['product_id'] ?? null, '引用商品标识不正确');
            $count = $this->positiveInteger($item['quantity'] ?? null, '商品数量必须为正整数');
            if ($count > intdiv(self::MAX_QUANTITY, $quantity)) {
                throw new HttpException(422, '商品组合数量超过上限');
            }
            if (!array_key_exists($childId, $cache)) {
                $cache[$childId] = $load($childId);
            }
            $child = $cache[$childId];
            if (!is_array($child) || $this->positiveInteger($child['id'] ?? null, '引用商品不存在') !== $childId) {
                throw new HttpException(422, '引用商品不存在');
            }
            $tree = $this->visit($child, $teamId, $owner, $path, $depth + 1,
                $quantity * $count, $load, $cache, $nodes, $units);
            $nested = $nested || in_array($tree['kind'], [ProductKind::ServiceBundle->value, ProductKind::RedemptionCard->value], true);
            $children[] = $tree;
        }
        if (!$composite) {
            $units += $quantity;
            if ($units > self::MAX_QUANTITY) throw new HttpException(422, '商品组合数量超过上限');
        }
        return [
            'product_id' => $id,
            'kind' => $kind->value,
            'quantity' => $quantity,
            'pricing_locked' => $nested,
            'children' => $children,
        ];
    }

    private function positiveInteger(mixed $value, string $message): int
    {
        if ((!is_int($value) && !is_string($value))
            || !preg_match('/^[1-9][0-9]*$/D', (string) $value)
            || filter_var($value, FILTER_VALIDATE_INT) === false) {
            throw new HttpException(422, $message);
        }
        return (int) $value;
    }
}
