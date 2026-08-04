<?php
declare(strict_types=1);

namespace app\admin\controller;

use app\service\EntitlementManagement;
use app\service\PermissionDictionary as Permissions;
use think\Request;

final class Entitlement
{
    protected $middleware = [
        'JwtAuth', 'Context', 'AdminAccess',
        'AdminPermission:' . Permissions::ADMIN_ENTITLEMENT_READ => ['only' => ['catalog', 'packages', 'package', 'campaigns', 'campaign', 'codes']],
        'AdminPermission:' . Permissions::ADMIN_ENTITLEMENT_WRITE => ['only' => ['savePackage', 'saveCampaign', 'disablePackage', 'disableCampaign', 'issueCodes', 'revealCode', 'disableCode']],
    ];

    public function catalog() { return success(app(EntitlementManagement::class)->abilityCatalog()); }
    public function packages(Request $request) { return success(app(EntitlementManagement::class)->packages(null, $request->get('page/d', 1), $request->get('limit/d', 20), $request->get('keyword/s', ''))); }
    public function package(Request $request) { return success(app(EntitlementManagement::class)->package(null, $request->route('id/d', 0))); }
    public function campaigns(Request $request) { return success(app(EntitlementManagement::class)->campaigns(null, $request->get('page/d', 1), $request->get('limit/d', 20), $request->get('keyword/s', ''))); }
    public function campaign(Request $request) { return success(app(EntitlementManagement::class)->campaign(null, $request->route('id/d', 0))); }
    public function codes(Request $request) { return success(app(EntitlementManagement::class)->codes(null, $request->route('id/d', 0), $request->get('page/d', 1), $request->get('limit/d', 20))); }
    public function savePackage(Request $request) { return success(['id' => app(EntitlementManagement::class)->savePackage(null, $request->route('id/d', 0) ?: null, $request->post())], 'Ability 权益包已保存'); }
    public function saveCampaign(Request $request) { return success(['id' => app(EntitlementManagement::class)->saveCampaign(null, $request->route('id/d', 0) ?: null, $request->post())], '体验活动已保存'); }
    public function disablePackage(Request $request) { app(EntitlementManagement::class)->disablePackage(null, $request->route('id/d', 0)); return message('Ability 权益包已停用'); }
    public function disableCampaign(Request $request) { app(EntitlementManagement::class)->disableCampaign(null, $request->route('id/d', 0)); return message('体验活动已停用'); }
    public function issueCodes(Request $request) { return success(app(EntitlementManagement::class)->issueCodes(null, $request->route('id/d', 0), $request->post()), '体验码已发行'); }
    public function revealCode(Request $request) { return success(app(EntitlementManagement::class)->revealCode(null, $request->route('id/d', 0), $request->route('code_id/d', 0))); }
    public function disableCode(Request $request) { app(EntitlementManagement::class)->disableCode(null, $request->route('id/d', 0), $request->route('code_id/d', 0)); return message('体验码已停用'); }
}
