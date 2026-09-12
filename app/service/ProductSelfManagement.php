<?php
declare(strict_types=1);

namespace app\service;

use app\model\TeamProduct;
use think\exception\HttpException;

final class ProductSelfManagement
{
    public function list(int $teamId, array $actingEntity, array $filters, int $page, int $limit): array
    {
        $filters['entity_id'] = $this->entityId($actingEntity);
        return app(Product::class)->list($teamId, $filters, $page, $limit);
    }

    public function options(int $teamId, array $actingEntity): array
    {
        return app(EntitlementManagement::class)->personalOptions($teamId, $this->entityId($actingEntity));
    }

    public function get(int $teamId, array $actingEntity, int $id): array
    {
        $this->assertOwn($teamId, $this->entityId($actingEntity), $id);
        return app(Product::class)->get($teamId, $id);
    }

    public function create(int $teamId, array $actingEntity, int $expectedEntityId, array $data): int
    {
        $data['entity_id'] = $this->writableEntityId($actingEntity, $expectedEntityId);
        $data = $this->protectPricing($teamId, $actingEntity, $data, null);
        return app(Product::class)->create($teamId, $data, app(PersonalPricing::class)->allows($teamId, $actingEntity));
    }

    public function edit(int $teamId, array $actingEntity, int $expectedEntityId, int $id, array $data): void
    {
        $entityId = $this->writableEntityId($actingEntity, $expectedEntityId);
        $this->assertOwn($teamId, $entityId, $id);
        $data = $this->protectPricing($teamId, $actingEntity, $data, TeamProduct::where('team_id', $teamId)->find($id));
        app(Product::class)->edit($teamId, $id, $data, app(PersonalPricing::class)->allows($teamId, $actingEntity));
    }

    public function setHandlers(int $teamId, array $actingEntity, int $expectedEntityId, int $id, array $entityIds): void
    {
        $entityId = $this->writableEntityId($actingEntity, $expectedEntityId);
        $this->assertOwn($teamId, $entityId, $id);
        app(Product::class)->setHandlers($teamId, $id, $entityIds);
    }

    private function protectPricing(int $teamId, array $actingEntity, array $data, ?TeamProduct $product): array
    {
        if ($product === null && array_key_exists('items', $data)) return $data;
        $pricing = app(PersonalPricing::class);
        if ($pricing->allows($teamId, $actingEntity)) return $data;
        $kind = (int) ($data['kind'] ?? $product?->enumCase('kind')->value ?? 1);
        // 分项权益包由 Product 强制使用上游计价汇总，客户端金额无法覆盖它。
        $configuration = array_merge($product?->toArray() ?? [], $data, ['kind' => $kind]);
        $package = $kind === 2
            ? \app\model\BenefitPackage::where('issuer_team_id', $teamId)->find((int) ($configuration['benefit_package_id'] ?? 0))
            : ($kind === 3 ? \app\model\RedemptionCampaign::where('issuer_team_id', $teamId)->with(['package'])->find((int) ($configuration['redemption_campaign_id'] ?? 0))?->package : null);
        if ($package && app(BenefitPackagePricing::class)->isItemized($package)) return $data;
        $baseline = $product
            ? array_intersect_key($product->toArray(), array_flip(['handler_cut', 'sender_cut', 'cs_cut']))
            : $pricing->defaults($teamId, $data['price'] ?? 0, $data['cost'] ?? 0);
        $data = $pricing->preserve($data, $baseline);
        // 团队金额只取余额，不接受额外指定以绕过人员分成保护。
        $price = (float) ($data['price'] ?? $product?->price ?? 0);
        $cost = (float) ($data['cost'] ?? $product?->cost ?? 0);
        $teamCut = (int) round($price * 100) - (int) round($cost * 100);
        foreach ($baseline as $cut) $teamCut -= (int) round((float) $cut * 100);
        if ($teamCut < 0) throw new HttpException(422, '成本与人员分成不能超过售价');
        $data['team_cut'] = number_format($teamCut / 100, 2, '.', '');
        return $data;
    }

    private function entityId(array $actingEntity): int
    {
        $entityId = (int) ($actingEntity['entity_id'] ?? 0);
        if ($entityId < 1) {
            throw new HttpException(401, '当前人员身份会话已失效');
        }
        return $entityId;
    }

    private function writableEntityId(array $actingEntity, int $expectedEntityId): int
    {
        $entityId = $this->entityId($actingEntity);
        if ($expectedEntityId < 1 || $entityId !== $expectedEntityId) {
            throw new HttpException(409, '身份已切换，请重新加载后再保存');
        }
        return $entityId;
    }

    private function assertOwn(int $teamId, int $entityId, int $productId): void
    {
        if (!TeamProduct::where('team_id', $teamId)
            ->where('entity_id', $entityId)
            ->find($productId)) {
            throw new HttpException(404, '商品不存在');
        }
    }
}
