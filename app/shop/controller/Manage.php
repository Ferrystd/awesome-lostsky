<?php
declare(strict_types=1);

namespace app\shop\controller;

use app\service\EntitlementManagement;
use app\service\PermissionDictionary as Permissions;
use think\Request;

final class Manage
{
    protected $middleware = [
        'JwtAuth', 'Context', 'EntityType:team,teamMember,teamVirtual', 'TeamAuth',
        'Permission:' . Permissions::SHOP_PRODUCT_READ => ['only' => ['options', 'services', 'service', 'serviceHandlers', 'packages', 'package', 'campaigns', 'campaign', 'codes']],
        'Permission:' . Permissions::SHOP_PRODUCT_WRITE => ['only' => ['saveService', 'saveServiceHandlers', 'savePackage', 'saveCampaign', 'issueCodes', 'revealCode', 'disableCode']],
        'Permission:' . Permissions::SHOP_PRODUCT_DELETE => ['only' => ['disableService', 'disablePackage', 'disableCampaign']],
    ];

    public function access(Request $request)
    {
        return success(app(\app\service\TeamAccess::class)->snapshot(
            $request->team_id,
            $request->acting_entity
        ));
    }

    public function options(Request $request) { return success(app(EntitlementManagement::class)->teamOptions($request->team_id)); }
    public function services(Request $request) { return success(app(EntitlementManagement::class)->services($request->team_id, $request->get('page/d', 1), $request->get('limit/d', 20), $request->get('keyword/s', ''))); }
    public function service(Request $request) { return success(app(EntitlementManagement::class)->service($request->team_id, $request->route('id/d', 0))); }
    public function serviceHandlers(Request $request) { return success(app(EntitlementManagement::class)->serviceHandlers($request->team_id, $request->route('id/d', 0))); }
    public function saveServiceHandlers(Request $request) { $id = $request->route('id/d', 0); $rows = app(EntitlementManagement::class)->saveServiceHandlers($request->team_id, $id, $request->post('entity_ids/a', [])); app(\app\service\BusinessAudit::class)->record($request, 'shop', 'syncHandlers', 'service', $id, ['changed_fields' => ['entity_ids']]); return success($rows, '接单池已保存'); }
    public function packages(Request $request) { return success(app(EntitlementManagement::class)->packages($request->team_id, $request->get('page/d', 1), $request->get('limit/d', 20), $request->get('keyword/s', ''))); }
    public function package(Request $request) { return success(app(EntitlementManagement::class)->package($request->team_id, $request->route('id/d', 0))); }
    public function campaigns(Request $request) { return success(app(EntitlementManagement::class)->campaigns($request->team_id, $request->get('page/d', 1), $request->get('limit/d', 20), $request->get('keyword/s', ''))); }
    public function campaign(Request $request) { return success(app(EntitlementManagement::class)->campaign($request->team_id, $request->route('id/d', 0))); }
    public function codes(Request $request) { return success(app(EntitlementManagement::class)->codes($request->team_id, $request->route('id/d', 0), $request->get('page/d', 1), $request->get('limit/d', 20))); }

    public function saveService(Request $request) { return $this->saved($request, 'service', app(EntitlementManagement::class)->saveService($request->team_id, $request->route('id/d', 0) ?: null, $request->post()), '服务已保存'); }
    public function savePackage(Request $request) { return $this->saved($request, 'benefitPackage', app(EntitlementManagement::class)->savePackage($request->team_id, $request->route('id/d', 0) ?: null, $request->post()), '权益包已保存'); }
    public function saveCampaign(Request $request) { return $this->saved($request, 'redemptionCampaign', app(EntitlementManagement::class)->saveCampaign($request->team_id, $request->route('id/d', 0) ?: null, $request->post()), '兑换活动已保存'); }

    public function disableService(Request $request) { return $this->disabled($request, 'service', fn () => app(EntitlementManagement::class)->disableService($request->team_id, $request->route('id/d', 0)), '服务已停用'); }
    public function disablePackage(Request $request) { return $this->disabled($request, 'benefitPackage', fn () => app(EntitlementManagement::class)->disablePackage($request->team_id, $request->route('id/d', 0)), '权益包已停用'); }
    public function disableCampaign(Request $request) { return $this->disabled($request, 'redemptionCampaign', fn () => app(EntitlementManagement::class)->disableCampaign($request->team_id, $request->route('id/d', 0)), '兑换活动已停用'); }
    public function issueCodes(Request $request) { $result = app(EntitlementManagement::class)->issueCodes($request->team_id, $request->route('id/d', 0), $request->post()); app(\app\service\BusinessAudit::class)->record($request, 'shop', 'issueCodes', 'redemptionCampaign', $request->route('id/d', 0), ['changed_fields' => ['count']]); return success($result, '卡密已发行'); }
    public function revealCode(Request $request) { return success(app(EntitlementManagement::class)->revealCode($request->team_id, $request->route('id/d', 0), $request->route('code_id/d', 0))); }
    public function disableCode(Request $request) { app(EntitlementManagement::class)->disableCode($request->team_id, $request->route('id/d', 0), $request->route('code_id/d', 0)); app(\app\service\BusinessAudit::class)->record($request, 'shop', 'disable', 'redemptionCode', $request->route('code_id/d', 0)); return message('卡密已停用'); }

    private function saved(Request $request, string $resource, int $id, string $message)
    {
        app(\app\service\BusinessAudit::class)->record($request, 'shop', 'save', $resource, $id);
        return success(['id' => $id], $message);
    }

    private function disabled(Request $request, string $resource, callable $operation, string $message)
    {
        $operation();
        app(\app\service\BusinessAudit::class)->record(
            $request, 'shop', 'disable', $resource, $request->route('id/d', 0)
        );
        return message($message);
    }
}
