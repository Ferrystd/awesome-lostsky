<?php
declare(strict_types=1);

namespace app\shop\controller;

use app\service\EntitlementManagement;
use app\service\PermissionDictionary as Permissions;
use app\service\PermissionGate;
use think\Request;

final class Manage
{
    protected $middleware = [
        'JwtAuth', 'Context', 'EntityType:team,teamMember,teamVirtual', 'TeamAuth',
        'Permission:' . Permissions::SHOP_PRODUCT_READ => ['only' => ['options', 'services', 'service', 'packages', 'package', 'campaigns', 'campaign', 'codes']],
        'Permission:' . Permissions::SHOP_PRODUCT_WRITE => ['only' => ['saveService', 'savePackage', 'saveCampaign', 'issueCodes', 'revealCode', 'disableCode']],
        'Permission:' . Permissions::SHOP_PRODUCT_DELETE => ['only' => ['disableService', 'disablePackage', 'disableCampaign']],
    ];

    public function access(Request $request)
    {
        $permissions = app(PermissionGate::class)->effective($request->team_id, $request->acting_entity);
        return success([
            'team' => app(\app\service\IdentitySession::class)->teamSummary($request->team_id),
            'identity' => [
                'type' => $request->acting_entity['type'],
                'entity_id' => $request->entity_id,
            ],
            'abilities' => [
                'file' => app(\app\service\TeamAccess::class)->ability($request->team_id, 'file', '文件上传'),
                'transaction' => app(\app\service\TeamAccess::class)->ability($request->team_id, 'transaction', '记账'),
            ],
            'permissions' => array_values($permissions),
        ]);
    }

    public function options(Request $request) { return success(app(EntitlementManagement::class)->teamOptions($request->team_id)); }
    public function services(Request $request) { return success(app(EntitlementManagement::class)->services($request->team_id, $request->get('page/d', 1), $request->get('limit/d', 20), $request->get('keyword/s', ''))); }
    public function service(Request $request) { return success(app(EntitlementManagement::class)->service($request->team_id, $request->route('id/d', 0))); }
    public function packages(Request $request) { return success(app(EntitlementManagement::class)->packages($request->team_id, $request->get('page/d', 1), $request->get('limit/d', 20), $request->get('keyword/s', ''))); }
    public function package(Request $request) { return success(app(EntitlementManagement::class)->package($request->team_id, $request->route('id/d', 0))); }
    public function campaigns(Request $request) { return success(app(EntitlementManagement::class)->campaigns($request->team_id, $request->get('page/d', 1), $request->get('limit/d', 20), $request->get('keyword/s', ''))); }
    public function campaign(Request $request) { return success(app(EntitlementManagement::class)->campaign($request->team_id, $request->route('id/d', 0))); }
    public function codes(Request $request) { return success(app(EntitlementManagement::class)->codes($request->team_id, $request->route('id/d', 0), $request->get('page/d', 1), $request->get('limit/d', 20))); }

    public function saveService(Request $request) { return $this->saved($request, 'service', app(EntitlementManagement::class)->saveService($request->team_id, $request->route('id/d', 0) ?: null, $request->post()), '服务已保存'); }
    public function savePackage(Request $request) { return $this->saved($request, 'benefitPackage', app(EntitlementManagement::class)->savePackage($request->team_id, $request->route('id/d', 0) ?: null, $request->post()), '权益包已保存'); }
    public function saveCampaign(Request $request) { return $this->saved($request, 'redemptionCampaign', app(EntitlementManagement::class)->saveCampaign($request->team_id, $request->route('id/d', 0) ?: null, $request->post()), '兑换活动已保存'); }

    public function disableService(Request $request) { app(EntitlementManagement::class)->disableService($request->team_id, $request->route('id/d', 0)); return message('服务已停用'); }
    public function disablePackage(Request $request) { app(EntitlementManagement::class)->disablePackage($request->team_id, $request->route('id/d', 0)); return message('权益包已停用'); }
    public function disableCampaign(Request $request) { app(EntitlementManagement::class)->disableCampaign($request->team_id, $request->route('id/d', 0)); return message('兑换活动已停用'); }
    public function issueCodes(Request $request) { return success(app(EntitlementManagement::class)->issueCodes($request->team_id, $request->route('id/d', 0), $request->post()), '卡密已发行'); }
    public function revealCode(Request $request) { return success(app(EntitlementManagement::class)->revealCode($request->team_id, $request->route('id/d', 0), $request->route('code_id/d', 0))); }
    public function disableCode(Request $request) { app(EntitlementManagement::class)->disableCode($request->team_id, $request->route('id/d', 0), $request->route('code_id/d', 0)); return message('卡密已停用'); }

    private function saved(Request $request, string $resource, int $id, string $message)
    {
        app(\app\service\BusinessAudit::class)->record($request, 'shop', 'save', $resource, $id);
        return success(['id' => $id], $message);
    }
}
