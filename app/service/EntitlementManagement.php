<?php
declare(strict_types=1);

namespace app\service;

use app\enum\RedemptionMode;
use app\model\BenefitPackage;
use app\model\BenefitPackageAbility;
use app\model\BenefitPackageService;
use app\model\RedemptionCampaign;
use app\model\RedemptionCode;
use app\model\TeamCustomer;
use app\model\TeamService;
use app\model\TeamServiceHandler;
use think\exception\HttpException;
use think\facade\Db;

final class EntitlementManagement
{
    private const ABILITIES = [
        ['key' => 'doc', 'label' => '文档', 'levels' => [1]],
        ['key' => 'file', 'label' => '文件', 'levels' => [1, 2, 3]],
        ['key' => 'transaction', 'label' => '流水', 'levels' => [1]],
    ];

    public function abilityCatalog(): array
    {
        return self::ABILITIES;
    }

    public function teamOptions(int $teamId): array
    {
        return $this->productOptions($teamId) + [
            'services' => TeamService::where('team_id', $teamId)->where('is_active', 1)->order('id', 'desc')->select()->toArray(),
            'customers' => TeamCustomer::where('team_id', $teamId)->where('is_blocked', 0)->with(['profile', 'balance'])->order('id', 'desc')->select()->toArray(),
        ];
    }

    public function productOptions(int $teamId): array
    {
        return [
            'entities' => app(Entity::class)->optionsForTeam($teamId, true),
            'packages' => BenefitPackage::where('issuer_team_id', $teamId)->where('is_active', 1)->order('id', 'desc')->select()->toArray(),
            'campaigns' => RedemptionCampaign::where('issuer_team_id', $teamId)->where('is_active', 1)->order('id', 'desc')->select()->toArray(),
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
        $money = [];
        foreach (['default_total_price', 'default_cost', 'default_handler_cut', 'default_sender_cut', 'default_cs_cut', 'default_team_cut'] as $field) {
            $value = $data[$field] ?? 0;
            if (!is_numeric($value) || (float) $value < 0) throw new HttpException(422, '服务金额不能为负数');
            $money[$field] = number_format((float) $value, 2, '.', '');
        }
        $handlerIds = array_values(array_unique(array_map('intval', is_array($data['handler_entity_ids'] ?? null) ? $data['handler_entity_ids'] : [])));
        foreach ($handlerIds as $entityId) app(Entity::class)->assertInTeam($entityId, $teamId);

        return Db::transaction(function () use ($teamId, $id, $data, $name, $money, $handlerIds) {
            $service = $id ? TeamService::where('team_id', $teamId)->find($id) : new TeamService;
            if (!$service) throw new HttpException(404, '服务不存在');
            $service->save(array_merge($money, [
                'team_id' => $teamId,
                'name' => $name,
                'description' => trim((string) ($data['description'] ?? '')) ?: null,
                'is_active' => (int) ($data['is_active'] ?? 1) === 1 ? 1 : 0,
            ]));
            TeamServiceHandler::where('service_id', $service->id)->delete();
            foreach ($handlerIds as $entityId) {
                $handler = TeamServiceHandler::withTrashed()
                    ->where('service_id', $service->id)
                    ->where('entity_id', $entityId)
                    ->find();
                if ($handler) $handler->restore();
                else (new TeamServiceHandler)->save(['service_id' => $service->id, 'entity_id' => $entityId]);
            }
            return (int) $service->id;
        });
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
        return $this->page($query, $page, $limit, ['services.service', 'abilities']);
    }

    public function package(?int $issuerTeamId, int $id): array
    {
        $package = $this->packageQuery($issuerTeamId)->with(['services.service', 'abilities'])->find($id);
        if (!$package) throw new HttpException(404, '权益包不存在');
        return $package->toArray();
    }

    public function savePackage(?int $issuerTeamId, ?int $id, array $data): int
    {
        $name = trim((string) ($data['name'] ?? ''));
        if ($name === '' || mb_strlen($name) > 100) throw new HttpException(422, '权益包名称长度应为 1–100 个字符');
        $serviceItems = is_array($data['services'] ?? null) ? $data['services'] : [];
        $abilityItems = is_array($data['abilities'] ?? null) ? $data['abilities'] : [];
        if ($issuerTeamId === null && (!$abilityItems || $serviceItems)) throw new HttpException(422, '平台权益包必须且只能包含 Ability');
        if ($issuerTeamId !== null && (!$serviceItems || $abilityItems)) throw new HttpException(422, '商家权益包必须且只能包含服务');

        $normalizedServices = [];
        foreach ($serviceItems as $item) {
            $serviceId = (int) ($item['service_id'] ?? 0);
            if (!$issuerTeamId || !TeamService::where('team_id', $issuerTeamId)->find($serviceId)) throw new HttpException(422, '服务不属于当前团队');
            $quantity = (int) ($item['quantity'] ?? 0); $days = (int) ($item['valid_days'] ?? 0);
            if ($quantity < 1 || $quantity > 999 || $days < 0) throw new HttpException(422, '服务数量或有效天数不正确');
            $normalizedServices[$serviceId] = compact('serviceId', 'quantity', 'days');
        }
        $catalog = [];
        foreach (self::ABILITIES as $ability) $catalog[$ability['key']] = $ability['levels'];
        $normalizedAbilities = [];
        foreach ($abilityItems as $item) {
            $key = trim((string) ($item['ability_key'] ?? '')); $level = (int) ($item['level'] ?? 0); $days = (int) ($item['duration_days'] ?? 0);
            if (!isset($catalog[$key]) || !in_array($level, $catalog[$key], true) || $days < 0) throw new HttpException(422, 'Ability 配置不正确');
            $normalizedAbilities[$key] = compact('key', 'level', 'days');
        }

        return Db::transaction(function () use ($issuerTeamId, $id, $data, $name, $normalizedServices, $normalizedAbilities) {
            $package = $id ? $this->packageQuery($issuerTeamId)->find($id) : new BenefitPackage;
            if (!$package) throw new HttpException(404, '权益包不存在');
            $package->save(['issuer_team_id' => $issuerTeamId, 'name' => $name, 'is_active' => (int) ($data['is_active'] ?? 1) === 1 ? 1 : 0]);
            BenefitPackageService::where('package_id', $package->id)->delete();
            BenefitPackageAbility::where('package_id', $package->id)->delete();
            foreach ($normalizedServices as $item) {
                $relation = BenefitPackageService::withTrashed()->where('package_id', $package->id)->where('service_id', $item['serviceId'])->find();
                if ($relation) {
                    $relation->restore();
                    $relation->save(['quantity' => $item['quantity'], 'valid_days' => $item['days']]);
                } else {
                    (new BenefitPackageService)->save(['package_id' => $package->id, 'service_id' => $item['serviceId'], 'quantity' => $item['quantity'], 'valid_days' => $item['days']]);
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
