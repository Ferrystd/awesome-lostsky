<?php
declare(strict_types=1);

namespace app\service;

use app\enum\BenefitPricingMode;
use app\enum\RedemptionMode;
use app\enum\ServiceDistributionMode;
use app\model\BenefitPackage;
use app\model\BenefitPackageAbility;
use app\model\BenefitPackageService;
use app\model\RedemptionCampaign;
use app\model\RedemptionCode;
use app\model\TeamCustomer;
use app\model\TeamProduct;
use app\model\TeamService;
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
        return $this->productOptions($teamId) + [
            'services' => TeamService::where('team_id', $teamId)->where('is_active', 1)->order('id', 'desc')->select()->toArray(),
            'customers' => TeamCustomer::where('team_id', $teamId)->where('is_blocked', 0)->with(['profile', 'balance'])->order('id', 'desc')->select()->toArray(),
            'service_defaults' => app(TeamSetting::class)->internal($teamId, 'service'),
        ];
    }

    public function productOptions(int $teamId): array
    {
        $packages = BenefitPackage::where('issuer_team_id', $teamId)
            ->where('is_active', 1)->with(['services'])->order('id', 'desc')->select()->toArray();
        $campaigns = RedemptionCampaign::where('issuer_team_id', $teamId)
            ->where('is_active', 1)->with(['package.services'])->order('id', 'desc')->select()->toArray();
        $this->attachPricingSummaries($packages);
        foreach ($campaigns as &$campaign) {
            if (is_array($campaign['package'] ?? null)) {
                $rows = [&$campaign['package']];
                $this->attachPricingSummaries($rows);
            }
        }
        return [
            'entities' => app(Entity::class)->optionsForTeam($teamId, true),
            'packages' => $packages,
            'campaigns' => $campaigns,
        ];
    }

    public function services(int $teamId, int $page, int $limit, string $keyword = ''): array
    {
        $query = TeamService::where('team_id', $teamId);
        if ($keyword !== '') $query->whereLike('name', '%' . addcslashes($keyword, '%_') . '%');
        return $this->page($query, $page, $limit, ['handlers.subject.profile']);
    }

    public function service(int $teamId, int $id): array
    {
        $service = TeamService::where('team_id', $teamId)->with(['handlers.subject.profile'])->find($id);
        if (!$service) throw new HttpException(404, '服务不存在');
        return $service->toArray();
    }

    public function saveService(int $teamId, ?int $id, array $data): int
    {
        $name = trim((string) ($data['name'] ?? ''));
        if ($name === '' || mb_strlen($name) > 100) throw new HttpException(422, '服务名称长度应为 1–100 个字符');
        $defaults = app(TeamSetting::class)->internal($teamId, 'service');
        $unitName = trim((string) ($data['unit_name'] ?? $defaults['default_unit_name']));
        $quantityScale = (int) ($data['quantity_scale'] ?? $defaults['default_quantity_scale']);
        if ($unitName === '' || mb_strlen($unitName) > 20) throw new HttpException(422, '服务单位长度应为 1–20 个字符');
        $quantityStep = app(ServiceQuantity::class)->normalize(
            $data['quantity_step'] ?? $defaults['default_quantity_step'],
            $quantityScale,
            $data['quantity_step'] ?? $defaults['default_quantity_step']
        );
        $money = [];
        foreach (['default_total_price', 'default_cost', 'default_handler_cut', 'default_sender_cut', 'default_cs_cut', 'default_team_cut'] as $field) {
            $value = $data[$field] ?? 0;
            if (!is_numeric($value) || (float) $value < 0) throw new HttpException(422, '服务金额不能为负数');
            $money[$field] = number_format((float) $value, 2, '.', '');
        }
        $hasHandlers = array_key_exists('handler_entity_ids', $data);
        $handlerIds = array_values(array_unique(array_map('intval', is_array($data['handler_entity_ids'] ?? null) ? $data['handler_entity_ids'] : [])));
        if ($hasHandlers) foreach ($handlerIds as $entityId) $this->assertServiceHandler($teamId, $entityId);

        return Db::transaction(function () use ($teamId, $id, $data, $name, $unitName, $quantityScale, $quantityStep, $money, $handlerIds, $hasHandlers) {
            $service = $id ? TeamService::where('team_id', $teamId)->find($id) : new TeamService;
            if (!$service) throw new HttpException(404, '服务不存在');
            $service->save(array_merge($money, [
                'team_id' => $teamId,
                'name' => $name,
                'description' => trim((string) ($data['description'] ?? '')) ?: null,
                'unit_name' => $unitName,
                'quantity_scale' => $quantityScale,
                'quantity_step' => $quantityStep,
                'is_active' => (int) ($data['is_active'] ?? 1) === 1 ? 1 : 0,
            ]));
            if ($hasHandlers) $this->syncServiceHandlers($teamId, (int) $service->id, $handlerIds);
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
        $current = array_map('intval', TeamServiceHandler::where('service_id', $serviceId)->column('entity_id'));
        $removed = array_values(array_diff($current, $handlerIds));
        TeamServiceHandler::where('service_id', $serviceId)->delete();
        foreach ($handlerIds as $entityId) {
            $handler = TeamServiceHandler::withTrashed()->where('service_id', $serviceId)->where('entity_id', $entityId)->find();
            if ($handler) $handler->restore();
            else (new TeamServiceHandler)->save(['service_id' => $serviceId, 'entity_id' => $entityId]);
        }
        app(ServiceRedemption::class)->invalidateOffersForHandlers($teamId, $serviceId, $removed);
    }

    private function assertServiceHandler(int $teamId, int $entityId): void
    {
        app(Entity::class)->assertInTeam($entityId, $teamId);
        $entity = \app\model\Entity::find($entityId);
        if (!$entity || !$entity->is_valid || !in_array((string) $entity->entityable_type, ['team', 'teamMember', 'teamVirtual'], true)) {
            throw new HttpException(422, '接单池只允许当前团队内有效的 Team、Member 或 Virtual Entity');
        }
    }

    public function disableService(int $teamId, int $id): void
    {
        $service = TeamService::where('team_id', $teamId)->find($id);
        if (!$service) throw new HttpException(404, '服务不存在');
        $service->save(['is_active' => 0]);
    }

    public function packages(?int $issuerTeamId, int $page, int $limit, string $keyword = ''): array
    {
        $query = $issuerTeamId === null ? BenefitPackage::whereNull('issuer_team_id') : BenefitPackage::where('issuer_team_id', $issuerTeamId);
        if ($keyword !== '') $query->whereLike('name', '%' . addcslashes($keyword, '%_') . '%');
        $result = $this->page($query, $page, $limit, ['services.service', 'abilities']);
        $this->attachPricingSummaries($result['list']);
        return $result;
    }

    public function package(?int $issuerTeamId, int $id): array
    {
        $package = $this->packageQuery($issuerTeamId)->with(['services.service', 'abilities'])->find($id);
        if (!$package) throw new HttpException(404, '权益包不存在');
        $result = $package->toArray();
        $rows = [&$result];
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
            if (isset($seenServiceIds[$serviceId])) throw new HttpException(422, '同一服务不能在权益包中重复配置');
            $seenServiceIds[$serviceId] = true;
            $item['quantity'] = app(ServiceQuantity::class)->normalize(
                $item['quantity'] ?? 0,
                (int) $service->quantity_scale,
                (string) $service->quantity_step
            );
            if (!array_key_exists('valid_days', $item)) {
                $item['valid_days'] = $serviceDefaults['default_valid_days'];
            }
            if ($pricingMode === BenefitPricingMode::Itemized) {
                if (!array_key_exists('distribution_mode', $item)) {
                    $item['distribution_mode'] = ServiceDistributionMode::Rate->value;
                }
                if ((int) $item['distribution_mode'] === ServiceDistributionMode::Rate->value) {
                    foreach ([
                        'handler_rate_bp' => 'default_handler_rate_percent',
                        'sender_rate_bp' => 'default_sender_rate_percent',
                        'cs_rate_bp' => 'default_cs_rate_percent',
                    ] as $field => $setting) {
                        if (!array_key_exists($field, $item)) $item[$field] = (int) $serviceDefaults[$setting] * 100;
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

        return Db::transaction(function () use ($issuerTeamId, $id, $data, $name, $pricingMode, $normalizedServices, $normalizedAbilities) {
            $package = $id ? $this->packageQuery($issuerTeamId)->find($id) : new BenefitPackage;
            if (!$package) throw new HttpException(404, '权益包不存在');
            if ($id && $this->packageReferenced((int) $package->id)) {
                $sameMode = $package->enumCase('pricing_mode') === $pricingMode;
                $sameItems = app(BenefitPackagePricing::class)->configuration($package) === $normalizedServices;
                if (!$sameMode || !$sameItems) {
                    throw new HttpException(422, '已被商品或兑换活动引用的权益包不能修改计价项目，请新建权益包');
                }
            }
            $package->save([
                'issuer_team_id' => $issuerTeamId,
                'name' => $name,
                'pricing_mode' => $pricingMode,
                'is_active' => (int) ($data['is_active'] ?? 1) === 1 ? 1 : 0,
            ]);
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

    public function disablePackage(?int $issuerTeamId, int $id): void
    {
        $package = $this->packageQuery($issuerTeamId)->find($id);
        if (!$package) throw new HttpException(404, '权益包不存在');
        $package->save(['is_active' => 0]);
    }

    public function campaigns(?int $issuerTeamId, int $page, int $limit, string $keyword = ''): array
    {
        $query = $this->campaignQuery($issuerTeamId);
        if ($keyword !== '') $query->whereLike('name', '%' . addcslashes($keyword, '%_') . '%');
        return $this->page($query, $page, $limit, ['package']);
    }

    public function campaign(?int $issuerTeamId, int $id): array
    {
        $campaign = $this->campaignQuery($issuerTeamId)->with(['package'])->find($id);
        if (!$campaign) throw new HttpException(404, '兑换活动不存在');
        return $campaign->toArray();
    }

    public function saveCampaign(?int $issuerTeamId, ?int $id, array $data): int
    {
        $name = trim((string) ($data['name'] ?? ''));
        if ($name === '' || mb_strlen($name) > 100) throw new HttpException(422, '活动名称长度应为 1–100 个字符');
        $packageId = (int) ($data['package_id'] ?? 0);
        if (!$this->packageQuery($issuerTeamId)->find($packageId)) throw new HttpException(422, '权益包不属于当前发行方');
        $mode = (int) ($data['mode'] ?? 0);
        if (!in_array($mode, [1, 2, 3], true)) throw new HttpException(422, '卡密模式不正确');
        $starts = max(0, (int) ($data['redeem_starts_at'] ?? 0)); $ends = max(0, (int) ($data['redeem_ends_at'] ?? 0));
        if ($starts && $ends && $ends <= $starts) throw new HttpException(422, '结束时间必须晚于开始时间');
        $claimGroup = trim((string) ($data['claim_group'] ?? ''));
        if ($claimGroup === '') $claimGroup = 'campaign-' . bin2hex(random_bytes(8));

        $campaign = $id ? $this->campaignQuery($issuerTeamId)->find($id) : new RedemptionCampaign;
        if (!$campaign) throw new HttpException(404, '兑换活动不存在');
        $values = [
            'issuer_team_id' => $issuerTeamId, 'package_id' => $packageId, 'name' => $name,
            'total_limit' => ($data['total_limit'] ?? null) === null || $data['total_limit'] === '' ? null : max(1, (int) $data['total_limit']),
            'per_target_limit' => max(1, (int) ($data['per_target_limit'] ?? 1)),
            'redeem_starts_at' => $starts, 'redeem_ends_at' => $ends,
            'is_active' => (int) ($data['is_active'] ?? 1) === 1 ? 1 : 0,
        ];
        if (!$id) $values += ['mode' => $mode, 'claim_group' => $claimGroup];
        $campaign->save($values);
        return (int) $campaign->id;
    }

    public function disableCampaign(?int $issuerTeamId, int $id): void
    {
        $campaign = $this->campaignQuery($issuerTeamId)->find($id);
        if (!$campaign) throw new HttpException(404, '兑换活动不存在');
        $campaign->save(['is_active' => 0]);
    }

    public function codes(?int $issuerTeamId, int $campaignId, int $page, int $limit): array
    {
        $this->assertCampaignOwner($issuerTeamId, $campaignId);
        return $this->page(RedemptionCode::where('campaign_id', $campaignId), $page, $limit);
    }

    public function issueCodes(?int $issuerTeamId, int $campaignId, array $data): array
    {
        $campaign = $this->assertCampaignOwner($issuerTeamId, $campaignId);
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

    public function revealCode(?int $issuerTeamId, int $campaignId, int $codeId): array
    {
        $this->assertCampaignOwner($issuerTeamId, $campaignId);
        $code = RedemptionCode::where('campaign_id', $campaignId)->find($codeId);
        if (!$code) throw new HttpException(404, '卡密不存在');
        return ['id' => (int) $code->id, 'code' => app(RedemptionCrypto::class)->decrypt($code->code_ciphertext)];
    }

    public function disableCode(?int $issuerTeamId, int $campaignId, int $codeId): void
    {
        $this->assertCampaignOwner($issuerTeamId, $campaignId);
        $code = RedemptionCode::where('campaign_id', $campaignId)->find($codeId);
        if (!$code) throw new HttpException(404, '卡密不存在');
        $code->save(['is_active' => 0]);
    }

    private function assertCampaignOwner(?int $issuerTeamId, int $campaignId): RedemptionCampaign
    {
        $campaign = $this->campaignQuery($issuerTeamId)->find($campaignId);
        if (!$campaign) throw new HttpException(404, '兑换活动不存在');
        return $campaign;
    }

    private function packageQuery(?int $issuerTeamId)
    {
        return $issuerTeamId === null ? BenefitPackage::whereNull('issuer_team_id') : BenefitPackage::where('issuer_team_id', $issuerTeamId);
    }

    private function campaignQuery(?int $issuerTeamId)
    {
        return $issuerTeamId === null ? RedemptionCampaign::whereNull('issuer_team_id') : RedemptionCampaign::where('issuer_team_id', $issuerTeamId);
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

    private function page($query, int $page, int $limit, array $with = []): array
    {
        $page = max(1, $page); $limit = min(100, max(1, $limit));
        if ($with) $query->with($with);
        $paginator = $query->order('id', 'desc')->paginate(['list_rows' => $limit, 'page' => $page]);

        return [
            'total' => $paginator->total(),
            'list' => $paginator->getCollection()->toArray(),
            'page' => $paginator->currentPage(),
            'limit' => $paginator->listRows(),
        ];
    }
}
