<?php
declare(strict_types=1);

namespace app\service;

use app\enum\BenefitPricingMode;
use app\enum\RedemptionMode;
use app\enum\ServiceAssignmentOfferStatus;
use app\model\BenefitPackage;
use app\model\BenefitPackageAbility;
use app\model\BenefitPackageService;
use app\model\RedemptionCampaign;
use app\model\RedemptionCode;
use app\model\TeamCustomer;
use app\model\TeamProduct;
use app\model\TeamService;
use app\model\TeamServiceAssignmentOffer;
use app\model\TeamServiceHandler;
use think\exception\HttpException;
use think\facade\Db;

final class EntitlementManagement
{
    public function abilityCatalog(): array
    {
        return AbilityCatalog::all();
    }

    public function teamOptions(int $teamId): array
    {
        $services = TeamService::where('team_id', $teamId)->where('is_active', 1)
            ->order('id', 'desc')->select()->toArray();
        $this->attachResourceOwners($services);
        return $this->productOptions($teamId) + [
            'services' => $services,
            'customers' => TeamCustomer::where('team_id', $teamId)->where('is_blocked', 0)->with(['profile', 'balance'])->order('id', 'desc')->select()->toArray(),
        ];
    }

    public function personalOptions(int $teamId, int $ownerEntityId): array
    {
        app(Entity::class)->assertInTeam($ownerEntityId, $teamId);
        $options = $this->productOptions($teamId, $ownerEntityId);
        $options['services'] = TeamService::where('team_id', $teamId)->where('is_active', 1)
            ->where(fn ($query) => $query->whereNull('owner_entity_id')->whereOr('owner_entity_id', $ownerEntityId))
            ->order('id', 'desc')->select()->toArray();
        $this->attachResourceOwners($options['services']);
        return $options;
    }

    public function productOptions(int $teamId, ?int $ownerEntityId = null): array
    {
        $productQuery = TeamProduct::where('team_id', $teamId)->where('is_active', 1);
        $packageQuery = BenefitPackage::where('issuer_team_id', $teamId)->where('is_active', 1);
        $campaignQuery = RedemptionCampaign::where('issuer_team_id', $teamId)->where('is_active', 1);
        if ($ownerEntityId !== null) {
            $productQuery->where(fn ($query) => $query->whereNull('entity_id')->whereOr('entity_id', $ownerEntityId));
            $packageQuery->where(fn ($query) => $query->whereNull('owner_entity_id')->whereOr('owner_entity_id', $ownerEntityId));
            $campaignQuery->where(fn ($query) => $query->whereNull('owner_entity_id')->whereOr('owner_entity_id', $ownerEntityId));
        }
        $packages = $packageQuery->with(['services'])->order('id', 'desc')->select()->toArray();
        $campaigns = $campaignQuery->with(['package.services'])->order('id', 'desc')->select()->toArray();
        $this->attachResourceOwners($packages);
        $this->attachResourceOwners($campaigns);
        $this->attachPricingSummaries($packages);
        foreach ($campaigns as &$campaign) {
            if (is_array($campaign['package'] ?? null)) {
                $rows = [&$campaign['package']];
                $this->attachPricingSummaries($rows);
            }
        }
        $products = [];
        foreach ($productQuery->where('kind', '<>', \app\enum\ProductKind::MultiVariant->value)->with(['parentProduct'])->order('id', 'desc')->select() as $product) {
            $parent = $product->parentProduct;
            if ($product->parent_product_id !== null && (!$parent || !$parent->is_active
                || $parent->enumCase('kind') !== \app\enum\ProductKind::MultiVariant
                || $parent->team_id !== $product->team_id || $parent->entity_id !== $product->entity_id)) continue;
            $row = array_intersect_key($product->toArray(), array_flip(['id', 'team_id', 'entity_id', 'name', 'kind', 'price', 'cost', 'handler_cut', 'sender_cut', 'cs_cut', 'team_cut', 'is_active', 'parent_product_id', 'purchase_fields']));
            if ($parent) $row['name'] = $parent->name . ' · ' . $product->name;
            $products[] = $row;
        }
        return [
            'products' => $products,
            'entities' => app(Entity::class)->optionsForTeam($teamId, true),
            'packages' => $packages,
            'campaigns' => $campaigns,
            'service_defaults' => app(TeamSetting::class)->internalTyped($teamId, 'service'),
        ];
    }

    public function services(int $teamId, int $page, int $limit, string $keyword = '', ?int $ownerEntityId = null): array
    {
        $query = TeamService::where('team_id', $teamId);
        if ($ownerEntityId !== null) $query->where('owner_entity_id', $ownerEntityId);
        if ($keyword !== '') $query->whereLike('name', '%' . addcslashes($keyword, '%_') . '%');
        $result = $this->page($query, $page, $limit, ['handlers.subject.profile']);
        $this->attachResourceOwners($result['list']);
        return $result;
    }

    public function service(int $teamId, int $id, ?int $ownerEntityId = null): array
    {
        $query = TeamService::where('team_id', $teamId);
        if ($ownerEntityId !== null) $query->where('owner_entity_id', $ownerEntityId);
        $service = $query->with(['handlers.subject.profile'])->find($id);
        if (!$service) throw new HttpException(404, '服务不存在');
        $result = $service->toArray();
        $result['redemption_fields'] = app(ServiceRedemptionField::class)->list($teamId, $id);
        $rows = [&$result];
        $this->attachResourceOwners($rows);
        return $result;
    }

    public function saveService(int $teamId, ?int $id, array $data): int
    {
        $existingService = $id ? TeamService::where('team_id', $teamId)->find($id) : null;
        if ($id && !$existingService) throw new HttpException(404, '服务不存在');
        $ownerEntityId = $existingService
            ? ($existingService->owner_entity_id === null ? null : (int) $existingService->owner_entity_id)
            : $this->normalizeOwnerEntityId($teamId, $data['owner_entity_id'] ?? null);
        $name = trim((string) ($data['name'] ?? ''));
        if ($name === '' || mb_strlen($name) > 100) throw new HttpException(422, '服务名称长度应为 1–100 个字符');
        $defaults = app(TeamSetting::class)->internal($teamId, 'service');
        $unitName = trim((string) ($data['unit_name'] ?? $defaults['default_unit_name']));
        if ($unitName === '' || mb_strlen($unitName) > 20) throw new HttpException(422, '服务单位长度应为 1–20 个字符');
        $quantity = app(ServiceQuantity::class);
        $quantityStepInput = $data['quantity_step'] ?? $defaults['default_quantity_step'];
        $quantityStep = $quantity->normalize(
            $quantityStepInput,
            $quantityStepInput
        );
        $autoCompleteAfterMinutes = $this->normalizeAutoCompleteAfterMinutes(
            $data['auto_complete_after_minutes'] ?? null
        );
        $unusedAutoCompleteAfterMinutes = array_key_exists('unused_auto_complete_after_minutes', $data)
            ? $this->normalizeAutoCompleteAfterMinutes($data['unused_auto_complete_after_minutes'])
            : ($existingService?->unused_auto_complete_after_minutes ?? null);
        $money = [];
        foreach (['default_total_price', 'default_cost', 'default_handler_cut', 'default_sender_cut', 'default_cs_cut'] as $field) {
            $value = $data[$field] ?? 0;
            if (!is_numeric($value) || (float) $value < 0) throw new HttpException(422, '服务金额不能为负数');
            $money[$field] = number_format((float) $value, 2, '.', '');
        }
        $teamCents = (int) round((float) $money['default_total_price'] * 100)
            - (int) round((float) $money['default_cost'] * 100)
            - (int) round((float) $money['default_handler_cut'] * 100)
            - (int) round((float) $money['default_sender_cut'] * 100)
            - (int) round((float) $money['default_cs_cut'] * 100);
        if ($teamCents < 0) throw new HttpException(422, '服务成本与人员分成不能超过单位服务价值');
        $money['default_team_cut'] = number_format($teamCents / 100, 2, '.', '');
        $hasHandlers = array_key_exists('handler_entity_ids', $data);
        $handlerIds = array_values(array_unique(array_map('intval', is_array($data['handler_entity_ids'] ?? null) ? $data['handler_entity_ids'] : [])));
        if ($hasHandlers) foreach ($handlerIds as $entityId) $this->assertServiceHandler($teamId, $entityId);
        $hasRedemptionFields = array_key_exists('redemption_fields', $data);
        $redemptionFields = is_array($data['redemption_fields'] ?? null) ? $data['redemption_fields'] : [];
        if ($hasRedemptionFields && !is_array($data['redemption_fields'])) throw new HttpException(422, '核销字段格式无效');

        return Db::transaction(function () use ($teamId, $id, $data, $name, $unitName, $quantityStep, $autoCompleteAfterMinutes, $unusedAutoCompleteAfterMinutes, $money, $handlerIds, $hasHandlers, $redemptionFields, $hasRedemptionFields, $ownerEntityId) {
            $service = $id ? TeamService::where('team_id', $teamId)->find($id) : new TeamService;
            if (!$service) throw new HttpException(404, '服务不存在');
            $values = array_merge($money, [
                'team_id' => $teamId,
                'name' => $name,
                'description' => trim((string) ($data['description'] ?? '')) ?: null,
                'unit_name' => $unitName,
                'quantity_step' => $quantityStep,
                'auto_complete_after_minutes' => $autoCompleteAfterMinutes,
                'unused_auto_complete_after_minutes' => $unusedAutoCompleteAfterMinutes,
                'is_active' => (int) ($data['is_active'] ?? 1) === 1 ? 1 : 0,
            ]);
            if (!$id) $values['owner_entity_id'] = $ownerEntityId;
            $service->save($values);
            if ($hasHandlers) $this->syncServiceHandlers($teamId, (int) $service->id, $handlerIds);
            if ($hasRedemptionFields) app(ServiceRedemptionField::class)->sync($teamId, (int) $service->id, $redemptionFields);
            return (int) $service->id;
        });
    }

    public function serviceHandlers(int $teamId, int $serviceId): array
    {
        if (!TeamService::where('team_id', $teamId)->find($serviceId)) throw new HttpException(404, '服务不存在');
        return TeamServiceHandler::where('service_id', $serviceId)
            ->with(['subject.profile'])->order('id', 'asc')->select()->toArray();
    }

    public function saveServiceHandlers(int $teamId, int $serviceId, array $entityIds): array
    {
        if (!TeamService::where('team_id', $teamId)->find($serviceId)) throw new HttpException(404, '服务不存在');
        $ids = array_values(array_unique(array_filter(array_map('intval', $entityIds))));
        foreach ($ids as $entityId) $this->assertServiceHandler($teamId, $entityId);
        Db::transaction(fn () => $this->syncServiceHandlers($teamId, $serviceId, $ids));
        return $this->serviceHandlers($teamId, $serviceId);
    }

    private function syncServiceHandlers(int $teamId, int $serviceId, array $handlerIds): void
    {
        $invalidated = $handlerIds ? array_values(array_diff(
            array_map('intval', TeamServiceAssignmentOffer::where('team_id', $teamId)
                ->where('service_id', $serviceId)
                ->where('status', ServiceAssignmentOfferStatus::Pending->value)
                ->column('target_handler_entity_id')),
            $handlerIds
        )) : [];
        foreach (TeamServiceHandler::where('service_id', $serviceId)->select() as $handler) {
            $handler->delete();
        }
        foreach ($handlerIds as $entityId) {
            $handler = TeamServiceHandler::withTrashed()->where('service_id', $serviceId)->where('entity_id', $entityId)->find();
            if ($handler) $handler->restore();
            else (new TeamServiceHandler)->save(['service_id' => $serviceId, 'entity_id' => $entityId]);
        }
        app(ServiceRedemption::class)->invalidateOffersForHandlers($teamId, $serviceId, $invalidated);
    }

    private function assertServiceHandler(int $teamId, int $entityId): void
    {
        app(Entity::class)->assertInTeam($entityId, $teamId);
        $entity = \app\model\Entity::find($entityId);
        if (!$entity || !$entity->is_valid || !in_array((string) $entity->entityable_type, ['team', 'teamMember', 'teamVirtual'], true)) {
            throw new HttpException(422, '接单池只允许当前团队内有效的 Team、Member 或 Virtual Entity');
        }
    }

    private function normalizeAutoCompleteAfterMinutes(mixed $value): ?int
    {
        if ($value === null || $value === '') return null;
        if (filter_var($value, FILTER_VALIDATE_INT) === false) {
            throw new HttpException(422, '自动结单时长必须是整数分钟');
        }
        $minutes = (int) $value;
        if ($minutes < 1 || $minutes > 5256000) {
            throw new HttpException(422, '自动结单时长必须在 1 至 5256000 分钟之间');
        }
        return $minutes;
    }

    public function disableService(int $teamId, int $id, ?int $ownerEntityId = null): void
    {
        $query = TeamService::where('team_id', $teamId);
        if ($ownerEntityId !== null) $query->where('owner_entity_id', $ownerEntityId);
        $service = $query->find($id);
        if (!$service) throw new HttpException(404, '服务不存在');
        $service->save(['is_active' => 0]);
    }

    public function packages(?int $issuerTeamId, int $page, int $limit, string $keyword = '', ?int $ownerEntityId = null): array
    {
        $query = $this->packageQuery($issuerTeamId, $ownerEntityId);
        if ($keyword !== '') $query->whereLike('name', '%' . addcslashes($keyword, '%_') . '%');
        $result = $this->page($query, $page, $limit, ['services.service', 'abilities']);
        $this->attachResourceOwners($result['list']);
        $this->attachPricingSummaries($result['list']);
        return $result;
    }

    public function package(?int $issuerTeamId, int $id, ?int $ownerEntityId = null): array
    {
        $package = $this->packageQuery($issuerTeamId, $ownerEntityId)->with(['services.service', 'abilities'])->find($id);
        if (!$package) throw new HttpException(404, '权益包不存在');
        $result = $package->toArray();
        $rows = [&$result];
        $this->attachResourceOwners($rows);
        $this->attachPricingSummaries($rows);
        return $result;
    }

    public function savePackage(?int $issuerTeamId, ?int $id, array $data): int
    {
        $name = trim((string) ($data['name'] ?? ''));
        if ($name === '' || mb_strlen($name) > 100) throw new HttpException(422, '权益包名称长度应为 1–100 个字符');
        $serviceItems = is_array($data['services'] ?? null) ? $data['services'] : [];
        $abilityItems = is_array($data['abilities'] ?? null) ? $data['abilities'] : [];
        if ($issuerTeamId === null && (!$abilityItems || $serviceItems)) throw new HttpException(422, '平台权益包必须且只能包含 Ability');
        if ($issuerTeamId !== null && (!$serviceItems || $abilityItems)) throw new HttpException(422, '商家权益包必须且只能包含服务');

        $existingPackage = $id ? $this->packageQuery($issuerTeamId)->find($id) : null;
        if ($id && !$existingPackage) throw new HttpException(404, '权益包不存在');
        $ownerEntityId = $existingPackage
            ? ($existingPackage->owner_entity_id === null ? null : (int) $existingPackage->owner_entity_id)
            : ($issuerTeamId === null ? null : $this->normalizeOwnerEntityId((int) $issuerTeamId, $data['owner_entity_id'] ?? null));
        $pricingModeValue = $issuerTeamId === null
            ? BenefitPricingMode::LegacyEqualSplit->value
            : (int) ($data['pricing_mode'] ?? ($existingPackage
                ? $existingPackage->enumCase('pricing_mode')->value
                : BenefitPricingMode::Itemized->value));
        try {
            $pricingMode = BenefitPricingMode::from($pricingModeValue);
        } catch (\ValueError) {
            throw new HttpException(422, '权益包计价方式不正确');
        }

        $normalizedServices = [];
        $seenServiceIds = [];
        $serviceDefaults = $issuerTeamId === null ? [] : app(TeamSetting::class)->internal((int) $issuerTeamId, 'service');
        foreach ($serviceItems as $sort => $item) {
            $serviceId = (int) ($item['service_id'] ?? 0);
            $service = $issuerTeamId ? TeamService::where('team_id', $issuerTeamId)->find($serviceId) : null;
            if (!$service) throw new HttpException(422, '服务不属于当前团队');
            $this->assertCompatibleOwner($ownerEntityId, $service->owner_entity_id, '权益包不能引用其他 Entity 的服务');
            if (isset($seenServiceIds[$serviceId])) throw new HttpException(422, '同一服务不能在权益包中重复配置');
            $seenServiceIds[$serviceId] = true;
            $quantity = app(ServiceQuantity::class);
            $item['quantity'] = $quantity->normalize(
                $item['quantity'] ?? 0,
                (string) $service->quantity_step
            );
            if (!array_key_exists('valid_days', $item)) {
                $item['valid_days'] = $serviceDefaults['default_valid_days'];
            }
            if ($pricingMode === BenefitPricingMode::Itemized) {
                $usesServiceMoney = !array_key_exists('unit_price', $item) && !array_key_exists('unit_cost', $item);
                if (!array_key_exists('unit_price', $item)) $item['unit_price'] = (string) $service->default_total_price;
                if (!array_key_exists('unit_cost', $item)) $item['unit_cost'] = (string) $service->default_cost;
                $cutFields = ['unit_handler_cut', 'unit_sender_cut', 'unit_cs_cut'];
                $hasExplicitCut = count(array_intersect($cutFields, array_keys($item))) > 0;
                if (!$hasExplicitCut && $usesServiceMoney) {
                    $item['unit_handler_cut'] = (string) $service->default_handler_cut;
                    $item['unit_sender_cut'] = (string) $service->default_sender_cut;
                    $item['unit_cs_cut'] = (string) $service->default_cs_cut;
                } elseif (!$hasExplicitCut && is_numeric($item['unit_price']) && is_numeric($item['unit_cost'])) {
                    $availableCents = max(0, (int) round(((float) $item['unit_price'] - (float) $item['unit_cost']) * 100));
                    foreach ([
                        'unit_handler_cut' => 'default_handler_rate_percent',
                        'unit_sender_cut' => 'default_sender_rate_percent',
                        'unit_cs_cut' => 'default_cs_rate_percent',
                    ] as $field => $setting) {
                        $cutCents = intdiv($availableCents * (int) $serviceDefaults[$setting], 100);
                        $item[$field] = number_format($cutCents / 100, 2, '.', '');
                    }
                }
                $normalizedServices[] = app(BenefitPackagePricing::class)->normalizeItem($item, (int) $sort);
            } else {
                $quantity = $item['quantity']; $days = (int) $item['valid_days'];
                if ($days < 0) throw new HttpException(422, '服务数量或有效天数不正确');
                $normalizedServices[] = app(BenefitPackagePricing::class)->normalizeItem([
                    'service_id' => $serviceId,
                    'quantity' => $quantity,
                    'valid_days' => $days,
                ], (int) $sort);
            }
        }
        $catalog = [];
        foreach (AbilityCatalog::all() as $ability) $catalog[$ability['key']] = $ability['levels'];
        $normalizedAbilities = [];
        foreach ($abilityItems as $item) {
            $key = trim((string) ($item['ability_key'] ?? '')); $level = (int) ($item['level'] ?? 0); $days = (int) ($item['duration_days'] ?? 0);
            if (!isset($catalog[$key]) || !in_array($level, $catalog[$key], true) || $days < 0) throw new HttpException(422, 'Ability 配置不正确');
            $normalizedAbilities[$key] = compact('key', 'level', 'days');
        }

        return Db::transaction(function () use ($issuerTeamId, $id, $data, $name, $pricingMode, $normalizedServices, $normalizedAbilities, $ownerEntityId) {
            $package = $id ? $this->packageQuery($issuerTeamId)->find($id) : new BenefitPackage;
            if (!$package) throw new HttpException(404, '权益包不存在');
            if ($id && $this->packageReferenced((int) $package->id)) {
                $sameMode = $package->enumCase('pricing_mode') === $pricingMode;
                $sameItems = app(BenefitPackagePricing::class)->configuration($package) === $normalizedServices;
                if (!$sameMode || !$sameItems) {
                    throw new HttpException(422, '已被商品或兑换活动引用的权益包不能修改计价项目，请新建权益包');
                }
            }
            $values = [
                'issuer_team_id' => $issuerTeamId,
                'name' => $name,
                'pricing_mode' => $pricingMode,
                'is_active' => (int) ($data['is_active'] ?? 1) === 1 ? 1 : 0,
            ];
            if (!$id) $values['owner_entity_id'] = $ownerEntityId;
            $package->save($values);
            BenefitPackageService::where('package_id', $package->id)->delete();
            BenefitPackageAbility::where('package_id', $package->id)->delete();
            foreach ($normalizedServices as $item) {
                $relation = BenefitPackageService::withTrashed()->where('package_id', $package->id)->where('service_id', $item['service_id'])->find();
                if ($relation) {
                    $relation->restore();
                    $relation->save($item);
                } else {
                    (new BenefitPackageService)->save(['package_id' => $package->id] + $item);
                }
            }
            foreach ($normalizedAbilities as $item) {
                $relation = BenefitPackageAbility::withTrashed()->where('package_id', $package->id)->where('ability_key', $item['key'])->find();
                if ($relation) {
                    $relation->restore();
                    $relation->save(['level' => $item['level'], 'duration_days' => $item['days']]);
                } else {
                    (new BenefitPackageAbility)->save(['package_id' => $package->id, 'ability_key' => $item['key'], 'level' => $item['level'], 'duration_days' => $item['days']]);
                }
            }
            return (int) $package->id;
        });
    }

    public function disablePackage(?int $issuerTeamId, int $id, ?int $ownerEntityId = null): void
    {
        $package = $this->packageQuery($issuerTeamId, $ownerEntityId)->find($id);
        if (!$package) throw new HttpException(404, '权益包不存在');
        $package->save(['is_active' => 0]);
    }

    public function campaigns(?int $issuerTeamId, int $page, int $limit, string $keyword = '', ?int $ownerEntityId = null): array
    {
        $query = $this->campaignQuery($issuerTeamId, $ownerEntityId);
        if ($keyword !== '') $query->whereLike('name', '%' . addcslashes($keyword, '%_') . '%');
        $result = $this->page($query, $page, $limit, ['package']);
        $this->attachResourceOwners($result['list']);
        return $result;
    }

    public function campaign(?int $issuerTeamId, int $id, ?int $ownerEntityId = null): array
    {
        $campaign = $this->campaignQuery($issuerTeamId, $ownerEntityId)->with(['package'])->find($id);
        if (!$campaign) throw new HttpException(404, '兑换活动不存在');
        $result = $campaign->toArray();
        $rows = [&$result];
        $this->attachResourceOwners($rows);
        return $result;
    }

    public function saveCampaign(?int $issuerTeamId, ?int $id, array $data): int
    {
        $existingCampaign = $id ? $this->campaignQuery($issuerTeamId)->find($id) : null;
        if ($id && !$existingCampaign) throw new HttpException(404, '兑换活动不存在');
        $ownerEntityId = $existingCampaign
            ? ($existingCampaign->owner_entity_id === null ? null : (int) $existingCampaign->owner_entity_id)
            : ($issuerTeamId === null ? null : $this->normalizeOwnerEntityId((int) $issuerTeamId, $data['owner_entity_id'] ?? null));
        $name = trim((string) ($data['name'] ?? ''));
        if ($name === '' || mb_strlen($name) > 100) throw new HttpException(422, '活动名称长度应为 1–100 个字符');
        $packageId = (int) ($data['package_id'] ?? 0);
        $package = $this->packageQuery($issuerTeamId)->find($packageId);
        if (!$package) throw new HttpException(422, '权益包不属于当前发行方');
        $this->assertCompatibleOwner($ownerEntityId, $package->owner_entity_id, '卡活动不能引用其他 Entity 的权益包');
        $mode = (int) ($data['mode'] ?? 0);
        if (!in_array($mode, [1, 2, 3], true)) throw new HttpException(422, '卡密模式不正确');
        $starts = max(0, (int) ($data['redeem_starts_at'] ?? 0)); $ends = max(0, (int) ($data['redeem_ends_at'] ?? 0));
        if ($starts && $ends && $ends <= $starts) throw new HttpException(422, '结束时间必须晚于开始时间');
        $claimGroup = trim((string) ($data['claim_group'] ?? ''));
        if ($claimGroup === '') $claimGroup = 'campaign-' . bin2hex(random_bytes(8));

        $campaign = $existingCampaign ?: new RedemptionCampaign;
        if (!$campaign) throw new HttpException(404, '兑换活动不存在');
        $values = [
            'issuer_team_id' => $issuerTeamId, 'package_id' => $packageId, 'name' => $name,
            'total_limit' => ($data['total_limit'] ?? null) === null || $data['total_limit'] === '' ? null : max(1, (int) $data['total_limit']),
            'redeem_starts_at' => $starts, 'redeem_ends_at' => $ends,
            'is_active' => (int) ($data['is_active'] ?? 1) === 1 ? 1 : 0,
        ];
        if (!$id) $values += ['owner_entity_id' => $ownerEntityId, 'mode' => $mode, 'claim_group' => $claimGroup];
        $campaign->save($values);
        return (int) $campaign->id;
    }

    public function disableCampaign(?int $issuerTeamId, int $id, ?int $ownerEntityId = null): void
    {
        $campaign = $this->campaignQuery($issuerTeamId, $ownerEntityId)->find($id);
        if (!$campaign) throw new HttpException(404, '兑换活动不存在');
        $campaign->save(['is_active' => 0]);
    }

    public function codes(?int $issuerTeamId, int $campaignId, int $page, int $limit, ?int $ownerEntityId = null): array
    {
        $this->assertCampaignOwner($issuerTeamId, $campaignId, $ownerEntityId);
        return $this->page(RedemptionCode::where('campaign_id', $campaignId), $page, $limit);
    }

    public function issueCodes(?int $issuerTeamId, int $campaignId, array $data, ?int $ownerEntityId = null): array
    {
        $campaign = $this->assertCampaignOwner($issuerTeamId, $campaignId, $ownerEntityId);
        $quantity = (int) ($data['quantity'] ?? 1);
        if ($quantity < 1 || $quantity > 100) throw new HttpException(422, '单次发码数量应为 1–100');
        $target = [];
        if ((int) $campaign->mode === (int) RedemptionMode::Targeted->value) {
            if ($issuerTeamId === null) $target['target_team_id'] = max(0, (int) ($data['target_team_id'] ?? 0)) ?: throw new HttpException(422, '定向卡必须指定团队');
            else {
                $target['target_entity_id'] = max(0, (int) ($data['target_entity_id'] ?? 0)) ?: throw new HttpException(422, '定向卡必须指定 Entity');
                app(Entity::class)->assertInTeam($target['target_entity_id'], $issuerTeamId);
            }
        }
        $issued = [];
        for ($i = 0; $i < $quantity; $i++) {
            $code = app(Redemption::class)->issue($campaignId, null, $target);
            $issued[] = ['id' => (int) $code->id, 'code_hint' => $code->code_hint, 'code' => app(RedemptionCrypto::class)->decrypt($code->code_ciphertext)];
        }
        return $issued;
    }

    public function revealCode(?int $issuerTeamId, int $campaignId, int $codeId, ?int $ownerEntityId = null): array
    {
        $this->assertCampaignOwner($issuerTeamId, $campaignId, $ownerEntityId);
        $code = RedemptionCode::where('campaign_id', $campaignId)->find($codeId);
        if (!$code) throw new HttpException(404, '卡密不存在');
        return ['id' => (int) $code->id, 'code' => app(RedemptionCrypto::class)->decrypt($code->code_ciphertext)];
    }

    public function disableCode(?int $issuerTeamId, int $campaignId, int $codeId, ?int $ownerEntityId = null): void
    {
        $this->assertCampaignOwner($issuerTeamId, $campaignId, $ownerEntityId);
        $code = RedemptionCode::where('campaign_id', $campaignId)->find($codeId);
        if (!$code) throw new HttpException(404, '卡密不存在');
        $code->save(['is_active' => 0]);
    }

    private function assertCampaignOwner(?int $issuerTeamId, int $campaignId, ?int $ownerEntityId = null): RedemptionCampaign
    {
        $campaign = $this->campaignQuery($issuerTeamId, $ownerEntityId)->find($campaignId);
        if (!$campaign) throw new HttpException(404, '兑换活动不存在');
        return $campaign;
    }

    private function packageQuery(?int $issuerTeamId, ?int $ownerEntityId = null)
    {
        $query = $issuerTeamId === null ? BenefitPackage::whereNull('issuer_team_id') : BenefitPackage::where('issuer_team_id', $issuerTeamId);
        if ($ownerEntityId !== null) $query->where('owner_entity_id', $ownerEntityId);
        return $query;
    }

    private function campaignQuery(?int $issuerTeamId, ?int $ownerEntityId = null)
    {
        $query = $issuerTeamId === null ? RedemptionCampaign::whereNull('issuer_team_id') : RedemptionCampaign::where('issuer_team_id', $issuerTeamId);
        if ($ownerEntityId !== null) $query->where('owner_entity_id', $ownerEntityId);
        return $query;
    }

    private function normalizeOwnerEntityId(int $teamId, mixed $value): ?int
    {
        $ownerEntityId = (int) ($value ?? 0);
        if ($ownerEntityId < 1) return null;
        app(Entity::class)->assertInTeam($ownerEntityId, $teamId);
        $owner = \app\model\Entity::find($ownerEntityId);
        if (!$owner || !$owner->is_valid || !in_array((string) $owner->entityable_type, ['team', 'teamMember', 'teamVirtual'], true)) {
            throw new HttpException(422, '资源归属只允许当前团队内有效的 Team、Member 或 Virtual Entity');
        }
        return $ownerEntityId;
    }

    private function assertCompatibleOwner(?int $ownerEntityId, mixed $candidateOwnerEntityId, string $message): void
    {
        $candidateOwnerEntityId = $candidateOwnerEntityId === null ? null : (int) $candidateOwnerEntityId;
        if ($candidateOwnerEntityId !== null && $candidateOwnerEntityId !== $ownerEntityId) {
            throw new HttpException(422, $message);
        }
    }

    private function packageReferenced(int $packageId): bool
    {
        return TeamProduct::where('benefit_package_id', $packageId)->find() !== null
            || RedemptionCampaign::where('package_id', $packageId)->find() !== null;
    }

    private function attachPricingSummaries(array &$packages): void
    {
        foreach ($packages as &$package) {
            $package['is_pricing_locked'] = $this->packageReferenced((int) $package['id']);
            $mode = $package['pricing_mode'] ?? BenefitPricingMode::LegacyEqualSplit->value();
            if (!in_array($mode, [
                BenefitPricingMode::Itemized->value,
                (string) BenefitPricingMode::Itemized->value,
                BenefitPricingMode::Itemized->value(),
                BenefitPricingMode::Itemized->name,
            ], true)) {
                $package['pricing_summary'] = null;
                continue;
            }
            $model = BenefitPackage::find((int) $package['id']);
            $package['pricing_summary'] = $model ? app(BenefitPackagePricing::class)->summary($model) : null;
        }
    }

    private function attachResourceOwners(array &$rows): void
    {
        $ownerIds = array_values(array_unique(array_filter(array_map(
            static fn (array $row): int => (int) ($row['owner_entity_id'] ?? 0),
            $rows
        ))));
        $owners = [];
        if ($ownerIds) {
            foreach (\app\model\Entity::whereIn('id', $ownerIds)->with(['profile'])->select() as $owner) {
                $owners[(int) $owner->id] = $owner->toArray();
            }
        }
        foreach ($rows as &$row) {
            $ownerId = (int) ($row['owner_entity_id'] ?? 0);
            $row['owner'] = $ownerId > 0 ? ($owners[$ownerId] ?? null) : null;
        }
    }

    private function page($query, int $page, int $limit, array $with = []): array
    {
        $page = max(1, $page); $limit = min(100, max(1, $limit));
        if ($with) $query->with($with);
        $paginator = $query->order('id', 'desc')->paginate(['list_rows' => $limit, 'page' => $page]);

        return app(Pagination::class)->response($paginator);
    }
}
