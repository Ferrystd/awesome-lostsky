<?php
declare(strict_types=1);

namespace app\service;

use app\enum\ProductKind;
use app\enum\RedemptionMode;
use app\model\BenefitPackageAbility;
use app\model\BenefitPackageService;
use app\model\RedemptionCampaign;
use app\model\RedemptionClaim;
use app\model\RedemptionCode;
use app\model\TeamAbilityGrant;
use app\model\TeamOrder;
use app\model\TeamProduct;
use think\exception\HttpException;
use think\facade\Db;

class Redemption
{
    public function issueForOrder(TeamOrder $order, TeamProduct $product): array
    {
        if ($product->enumCase('kind') !== ProductKind::RedemptionCard || !$product->redemption_campaign_id) {
            throw new HttpException(422, '商品未配置卡密活动');
        }
        if (!$order->customer_id) throw new HttpException(422, '卡密订单必须关联客户');
        $holderId = (int) $order->customer?->root_entity_id;
        if ($holderId < 1) throw new HttpException(422, '订单客户Entity不存在');

        $ids = [];
        for ($ordinal = 1; $ordinal <= (int) $order->quantity; $ordinal++) {
            $existing = RedemptionCode::where('source_order_id', $order->id)->where('ordinal', $ordinal)->find();
            if ($existing) { $ids[] = (int) $existing->id; continue; }
            $ids[] = (int) $this->issue((int) $product->redemption_campaign_id, $holderId, [
                'source_order_id' => $order->id,
                'ordinal' => $ordinal,
            ])->id;
        }
        return $ids;
    }

    public function issue(int $campaignId, ?int $holderEntityId = null, array $target = []): RedemptionCode
    {
        $campaign = RedemptionCampaign::find($campaignId);
        if (!$campaign || !(bool) $campaign->is_active) throw new HttpException(422, '卡密活动不可用');
        $plain = app(RedemptionCrypto::class)->generate();
        $code = new RedemptionCode;
        $code->save([
            'campaign_id' => $campaignId,
            'source_order_id' => $target['source_order_id'] ?? null,
            'ordinal' => $target['ordinal'] ?? 1,
            'holder_entity_id' => $holderEntityId,
            'target_team_id' => $target['target_team_id'] ?? null,
            'target_entity_id' => $target['target_entity_id'] ?? null,
            'code_hint' => app(RedemptionCrypto::class)->hint($plain),
            'code_hash' => app(RedemptionCrypto::class)->hash($plain),
            'code_ciphertext' => app(RedemptionCrypto::class)->encrypt($plain),
            'max_uses' => $this->mode($campaign) === RedemptionMode::Campaign ? null : 1,
            'use_count' => 0,
            'expire_time' => 0,
            'is_active' => 1,
        ]);
        return $code;
    }

    public function held(int $holderEntityId): array
    {
        return RedemptionCode::where('holder_entity_id', $holderEntityId)
            ->with(['campaign'])->order('id', 'desc')->select()->toArray();
    }

    public function reveal(int $holderEntityId, int $id): array
    {
        $code = RedemptionCode::where('holder_entity_id', $holderEntityId)->find($id);
        if (!$code) throw new HttpException(404, '卡密不存在');
        return ['id' => (int) $code->id, 'code' => app(RedemptionCrypto::class)->decrypt($code->code_ciphertext)];
    }

    public function inspect(string $plain): array
    {
        $code = RedemptionCode::where('code_hash', app(RedemptionCrypto::class)->hash($plain))
            ->with(['campaign.package.abilities', 'campaign.package.services.service'])->find();
        $this->assertCode($code);
        $this->assertCampaign($code->campaign);
        return [
            'campaign' => ['id' => (int) $code->campaign->id, 'name' => $code->campaign->name, 'mode' => $code->campaign->mode],
            'abilities' => $code->campaign->package->abilities?->toArray() ?? [],
            'services' => $code->campaign->package->services?->toArray() ?? [],
        ];
    }

    public function claimForTeam(string $plain, int $teamId, int $actorEntityId): int
    {
        return Db::transaction(function () use ($plain, $teamId, $actorEntityId) {
            [$code, $campaign] = $this->lockCode($plain);
            if ($campaign->issuer_team_id !== null) throw new HttpException(422, '该卡密不是平台Ability卡密');
            if ($code->target_team_id !== null && (int) $code->target_team_id !== $teamId) throw new HttpException(403, '卡密不适用于当前团队');
            if (!BenefitPackageAbility::where('package_id', $campaign->package_id)->find()) throw new HttpException(422, '卡密不包含Ability权益');
            $claim = $this->claim($code, $campaign, 'team', $teamId, $actorEntityId);
            $this->grantAbilities($claim, $teamId);
            return (int) $claim->id;
        });
    }

    public function claimForCustomer(string $plain, int $teamId, int $customerId, int $holderEntityId): int
    {
        return Db::transaction(function () use ($plain, $teamId, $customerId, $holderEntityId) {
            [$code, $campaign] = $this->lockCode($plain);
            if ((int) $campaign->issuer_team_id !== $teamId) throw new HttpException(403, '卡密不属于当前商家');
            if ($code->holder_entity_id !== null && (int) $code->holder_entity_id !== $holderEntityId) throw new HttpException(403, '卡密不属于当前Customer Entity');
            if ($code->target_entity_id !== null && (int) $code->target_entity_id !== $holderEntityId) throw new HttpException(403, '卡密不适用于当前Entity');
            if (!BenefitPackageService::where('package_id', $campaign->package_id)->find()) throw new HttpException(422, '卡密不包含服务权益');
            $claim = $this->claim($code, $campaign, 'entity', $holderEntityId, $holderEntityId);
            app(BenefitFulfillment::class)->servicesFromClaim($claim, $teamId, $customerId, $holderEntityId);
            return (int) $claim->id;
        });
    }

    private function lockCode(string $plain): array
    {
        $code = RedemptionCode::where('code_hash', app(RedemptionCrypto::class)->hash($plain))->lock(true)->find();
        $this->assertCode($code);
        $campaign = RedemptionCampaign::where('id', $code->campaign_id)->lock(true)->find();
        $this->assertCampaign($campaign);
        return [$code, $campaign];
    }

    private function claim(RedemptionCode $code, RedemptionCampaign $campaign, string $targetType, int $targetId, int $actorEntityId): RedemptionClaim
    {
        $mode = $this->mode($campaign);
        $scope = $campaign->claim_group !== '' ? $campaign->claim_group : 'campaign-' . $campaign->id;
        $claimKey = $mode === RedemptionMode::Campaign
            ? "{$scope}:{$targetType}:{$targetId}"
            : "code:{$code->id}";
        if (RedemptionClaim::where('claim_key', $claimKey)->find()) throw new HttpException(409, '该权益已经领取');
        if ($campaign->total_limit !== null && RedemptionClaim::where('campaign_id', $campaign->id)->count() >= (int) $campaign->total_limit) {
            throw new HttpException(409, '活动领取名额已用完');
        }
        if ($code->max_uses !== null && (int) $code->use_count >= (int) $code->max_uses) throw new HttpException(409, '卡密已用完');

        $claim = new RedemptionClaim;
        $claim->save([
            'campaign_id' => $campaign->id,
            'code_id' => $code->id,
            'claim_key' => $claimKey,
            'target_team_id' => $targetType === 'team' ? $targetId : null,
            'target_entity_id' => $targetType === 'entity' ? $targetId : null,
            'claimed_by_entity_id' => $actorEntityId,
            'claimed_at' => time(),
        ]);
        $code->save(['use_count' => (int) $code->use_count + 1]);
        return $claim;
    }

    private function grantAbilities(RedemptionClaim $claim, int $teamId): void
    {
        $items = BenefitPackageAbility::where('package_id', $claim->campaign->package_id)->select();
        foreach ($items as $item) {
            $grant = new TeamAbilityGrant;
            $grant->save([
                'team_id' => $teamId,
                'ability_key' => $item->ability_key,
                'level' => $item->level,
                'starts_at' => time(),
                'ends_at' => (int) $item->duration_days > 0 ? time() + (int) $item->duration_days * 86400 : 0,
                'source_type' => 'redemption',
                'source_claim_id' => $claim->id,
            ]);
            app(AbilityResolver::class)->syncProjection($teamId, (string) $item->ability_key);
            app(AbilityExpirationScheduler::class)->schedule($grant);
        }
    }

    private function assertCode(?RedemptionCode $code): void
    {
        if (!$code || !(bool) $code->is_active) throw new HttpException(404, '卡密无效');
        if ((int) $code->expire_time > 0 && (int) $code->expire_time < time()) throw new HttpException(422, '卡密已过期');
    }

    private function assertCampaign(?RedemptionCampaign $campaign): void
    {
        if (!$campaign || !(bool) $campaign->is_active) throw new HttpException(422, '卡密活动不可用');
        if ((int) $campaign->redeem_starts_at > 0 && (int) $campaign->redeem_starts_at > time()) throw new HttpException(422, '活动尚未开始');
        if ((int) $campaign->redeem_ends_at > 0 && (int) $campaign->redeem_ends_at < time()) throw new HttpException(422, '活动已结束');
    }

    private function mode(RedemptionCampaign $campaign): RedemptionMode
    {
        return RedemptionMode::from((string) $campaign->mode);
    }
}
