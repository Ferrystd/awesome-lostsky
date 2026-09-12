<?php
declare(strict_types=1);

namespace app\service;

use app\model\BenefitPackageService;
use app\model\TeamService;
use think\exception\HttpException;

final class EntitlementSelfManagement
{
    public function options(int $teamId, array $actingEntity): array
    {
        return app(EntitlementManagement::class)->personalOptions($teamId, $this->entityId($actingEntity));
    }

    public function services(int $teamId, array $actingEntity, int $page, int $limit, string $keyword = ''): array
    {
        return app(EntitlementManagement::class)->services(
            $teamId, $page, $limit, $keyword, $this->entityId($actingEntity)
        );
    }

    public function service(int $teamId, array $actingEntity, int $id): array
    {
        return app(EntitlementManagement::class)->service($teamId, $id, $this->entityId($actingEntity));
    }

    public function saveService(int $teamId, array $actingEntity, int $expectedEntityId, ?int $id, array $data): int
    {
        $ownerEntityId = $this->writableEntityId($actingEntity, $expectedEntityId);
        if ($id) $this->assertOwnService($teamId, $ownerEntityId, $id);
        $pricing = app(PersonalPricing::class);
        if (!$pricing->allows($teamId, $actingEntity)) {
            $existing = $id ? TeamService::where('team_id', $teamId)->find($id) : null;
            $baseline = $existing
                ? array_intersect_key($existing->toArray(), array_flip(['default_handler_cut', 'default_sender_cut', 'default_cs_cut']))
                : $pricing->defaults($teamId, $data['default_total_price'] ?? 0, $data['default_cost'] ?? 0, 'default_');
            $data = $pricing->preserve($data, $baseline);
            if ($existing) {
                $data += ['default_total_price' => $existing->default_total_price, 'default_cost' => $existing->default_cost];
            }
        }
        $data['owner_entity_id'] = $ownerEntityId;
        unset($data['expected_entity_id']);
        return app(EntitlementManagement::class)->saveService($teamId, $id, $data);
    }

    public function serviceHandlers(int $teamId, array $actingEntity, int $id): array
    {
        $ownerEntityId = $this->entityId($actingEntity);
        $this->assertOwnService($teamId, $ownerEntityId, $id);
        return app(EntitlementManagement::class)->serviceHandlers($teamId, $id);
    }

    public function saveServiceHandlers(int $teamId, array $actingEntity, int $expectedEntityId, int $id, array $entityIds): array
    {
        $ownerEntityId = $this->writableEntityId($actingEntity, $expectedEntityId);
        $this->assertOwnService($teamId, $ownerEntityId, $id);
        return app(EntitlementManagement::class)->saveServiceHandlers($teamId, $id, $entityIds);
    }

    public function disableService(int $teamId, array $actingEntity, int $expectedEntityId, int $id): void
    {
        $ownerEntityId = $this->writableEntityId($actingEntity, $expectedEntityId);
        app(EntitlementManagement::class)->disableService($teamId, $id, $ownerEntityId);
    }

    public function packages(int $teamId, array $actingEntity, int $page, int $limit, string $keyword = ''): array
    {
        return app(EntitlementManagement::class)->packages(
            $teamId, $page, $limit, $keyword, $this->entityId($actingEntity)
        );
    }

    public function package(int $teamId, array $actingEntity, int $id): array
    {
        return app(EntitlementManagement::class)->package($teamId, $id, $this->entityId($actingEntity));
    }

    public function savePackage(int $teamId, array $actingEntity, int $expectedEntityId, ?int $id, array $data): int
    {
        $ownerEntityId = $this->writableEntityId($actingEntity, $expectedEntityId);
        if ($id) app(EntitlementManagement::class)->package($teamId, $id, $ownerEntityId);
        if (!app(PersonalPricing::class)->allows($teamId, $actingEntity)) {
            $data = $this->preservePackagePricing($teamId, $id, $data);
        }
        $data['owner_entity_id'] = $ownerEntityId;
        unset($data['expected_entity_id']);
        return app(EntitlementManagement::class)->savePackage($teamId, $id, $data);
    }

    public function disablePackage(int $teamId, array $actingEntity, int $expectedEntityId, int $id): void
    {
        $ownerEntityId = $this->writableEntityId($actingEntity, $expectedEntityId);
        app(EntitlementManagement::class)->disablePackage($teamId, $id, $ownerEntityId);
    }

    public function campaigns(int $teamId, array $actingEntity, int $page, int $limit, string $keyword = ''): array
    {
        return app(EntitlementManagement::class)->campaigns(
            $teamId, $page, $limit, $keyword, $this->entityId($actingEntity)
        );
    }

    public function campaign(int $teamId, array $actingEntity, int $id): array
    {
        return app(EntitlementManagement::class)->campaign($teamId, $id, $this->entityId($actingEntity));
    }

    public function saveCampaign(int $teamId, array $actingEntity, int $expectedEntityId, ?int $id, array $data): int
    {
        $ownerEntityId = $this->writableEntityId($actingEntity, $expectedEntityId);
        if ($id) app(EntitlementManagement::class)->campaign($teamId, $id, $ownerEntityId);
        $data['owner_entity_id'] = $ownerEntityId;
        unset($data['expected_entity_id']);
        return app(EntitlementManagement::class)->saveCampaign($teamId, $id, $data);
    }

    public function disableCampaign(int $teamId, array $actingEntity, int $expectedEntityId, int $id): void
    {
        $ownerEntityId = $this->writableEntityId($actingEntity, $expectedEntityId);
        app(EntitlementManagement::class)->disableCampaign($teamId, $id, $ownerEntityId);
    }

    public function codes(int $teamId, array $actingEntity, int $campaignId, int $page, int $limit): array
    {
        return app(EntitlementManagement::class)->codes(
            $teamId, $campaignId, $page, $limit, $this->entityId($actingEntity)
        );
    }

    public function issueCodes(int $teamId, array $actingEntity, int $expectedEntityId, int $campaignId, array $data): array
    {
        $ownerEntityId = $this->writableEntityId($actingEntity, $expectedEntityId);
        unset($data['expected_entity_id']);
        return app(EntitlementManagement::class)->issueCodes($teamId, $campaignId, $data, $ownerEntityId);
    }

    public function revealCode(int $teamId, array $actingEntity, int $expectedEntityId, int $campaignId, int $codeId): array
    {
        return app(EntitlementManagement::class)->revealCode(
            $teamId,
            $campaignId,
            $codeId,
            $this->writableEntityId($actingEntity, $expectedEntityId)
        );
    }

    public function disableCode(int $teamId, array $actingEntity, int $expectedEntityId, int $campaignId, int $codeId): void
    {
        app(EntitlementManagement::class)->disableCode(
            $teamId,
            $campaignId,
            $codeId,
            $this->writableEntityId($actingEntity, $expectedEntityId)
        );
    }

    private function preservePackagePricing(int $teamId, ?int $packageId, array $data): array
    {
        $package = $packageId ? \app\model\BenefitPackage::where('issuer_team_id', $teamId)->find($packageId) : null;
        $mode = $package?->enumCase('pricing_mode')->value ?? 2;
        if ((int) ($data['pricing_mode'] ?? $mode) !== $mode) {
            throw \app\exception\AccessDeniedException::permission([PermissionDictionary::SHOP_PRODUCT_SELF_REPRICE]);
        }
        $existing = [];
        if ($packageId) {
            foreach (BenefitPackageService::where('package_id', $packageId)->select() as $item) {
                $existing[(int) $item->service_id] = $item;
            }
        }
        $fieldDefaults = [
            'unit_price' => 'default_total_price',
            'unit_cost' => 'default_cost',
            'unit_handler_cut' => 'default_handler_cut',
            'unit_sender_cut' => 'default_sender_cut',
            'unit_cs_cut' => 'default_cs_cut',
        ];
        $items = is_array($data['services'] ?? null) ? $data['services'] : [];
        foreach ($items as &$item) {
            $service = TeamService::where('team_id', $teamId)->find((int) ($item['service_id'] ?? 0));
            if (!$service) continue;
            $baseline = $existing[(int) $service->id] ?? $service;
            $protected = [];
            foreach ($fieldDefaults as $field => $defaultField) {
                if ($service->owner_entity_id !== null && in_array($field, ['unit_price', 'unit_cost'], true)) continue;
                $baselineField = $baseline instanceof BenefitPackageService ? $field : $defaultField;
                $protected[$field] = $baseline->{$baselineField};
            }
            $item = app(PersonalPricing::class)->preserve($item, $protected);
        }
        unset($item);
        $data['services'] = $items;
        return $data;
    }

    private function entityId(array $actingEntity): int
    {
        $entityId = (int) ($actingEntity['entity_id'] ?? 0);
        if ($entityId < 1) throw new HttpException(401, '当前人员身份会话已失效');
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

    private function assertOwnService(int $teamId, int $ownerEntityId, int $id): void
    {
        if (!TeamService::where('team_id', $teamId)->where('owner_entity_id', $ownerEntityId)->find($id)) {
            throw new HttpException(404, '服务不存在');
        }
    }

}
