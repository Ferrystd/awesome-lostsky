<?php
declare(strict_types=1);

namespace app\shop\controller;

use app\service\BusinessAudit;
use app\service\EntitlementSelfManagement;
use app\service\PermissionDictionary as Permissions;
use think\Request;

final class PersonalEntitlement
{
    protected $middleware = [
        'JwtAuth', 'Context', 'EntityType:team,teamMember,teamVirtual', 'TeamAuth',
        'Permission:' . Permissions::SHOP_PRODUCT_SELF_MANAGE,
    ];

    public function services(Request $request)
    {
        return success(app(EntitlementSelfManagement::class)->services(
            $request->team_id,
            $request->acting_entity,
            $request->get('page/d', 1),
            $request->get('limit/d', 20),
            $request->get('keyword/s', '')
        ));
    }

    public function service(Request $request)
    {
        return success(app(EntitlementSelfManagement::class)->service(
            $request->team_id, $request->acting_entity, $request->route('id/d', 0)
        ));
    }

    public function saveService(Request $request)
    {
        $id = app(EntitlementSelfManagement::class)->saveService(
            $request->team_id,
            $request->acting_entity,
            $request->post('expected_entity_id/d', 0),
            $request->route('id/d', 0) ?: null,
            $request->post()
        );
        $this->audit($request, 'save', 'service', $id);
        return success(['id' => $id], '服务已保存');
    }

    public function serviceHandlers(Request $request)
    {
        return success(app(EntitlementSelfManagement::class)->serviceHandlers(
            $request->team_id, $request->acting_entity, $request->route('id/d', 0)
        ));
    }

    public function saveServiceHandlers(Request $request)
    {
        $id = $request->route('id/d', 0);
        $result = app(EntitlementSelfManagement::class)->saveServiceHandlers(
            $request->team_id,
            $request->acting_entity,
            $request->post('expected_entity_id/d', 0),
            $id,
            $request->post('entity_ids/a', [])
        );
        $this->audit($request, 'syncHandlers', 'service', $id);
        return success($result, '接单池已保存');
    }

    public function disableService(Request $request)
    {
        $id = $request->route('id/d', 0);
        app(EntitlementSelfManagement::class)->disableService(
            $request->team_id, $request->acting_entity, $request->post('expected_entity_id/d', 0), $id
        );
        $this->audit($request, 'disable', 'service', $id);
        return message('服务已停用');
    }

    public function packages(Request $request)
    {
        return success(app(EntitlementSelfManagement::class)->packages(
            $request->team_id,
            $request->acting_entity,
            $request->get('page/d', 1),
            $request->get('limit/d', 20),
            $request->get('keyword/s', '')
        ));
    }

    public function package(Request $request)
    {
        return success(app(EntitlementSelfManagement::class)->package(
            $request->team_id, $request->acting_entity, $request->route('id/d', 0)
        ));
    }

    public function savePackage(Request $request)
    {
        $id = app(EntitlementSelfManagement::class)->savePackage(
            $request->team_id,
            $request->acting_entity,
            $request->post('expected_entity_id/d', 0),
            $request->route('id/d', 0) ?: null,
            $request->post()
        );
        $this->audit($request, 'save', 'benefitPackage', $id);
        return success(['id' => $id], '权益包已保存');
    }

    public function disablePackage(Request $request)
    {
        $id = $request->route('id/d', 0);
        app(EntitlementSelfManagement::class)->disablePackage(
            $request->team_id, $request->acting_entity, $request->post('expected_entity_id/d', 0), $id
        );
        $this->audit($request, 'disable', 'benefitPackage', $id);
        return message('权益包已停用');
    }

    public function campaigns(Request $request)
    {
        return success(app(EntitlementSelfManagement::class)->campaigns(
            $request->team_id,
            $request->acting_entity,
            $request->get('page/d', 1),
            $request->get('limit/d', 20),
            $request->get('keyword/s', '')
        ));
    }

    public function campaign(Request $request)
    {
        return success(app(EntitlementSelfManagement::class)->campaign(
            $request->team_id, $request->acting_entity, $request->route('id/d', 0)
        ));
    }

    public function saveCampaign(Request $request)
    {
        $id = app(EntitlementSelfManagement::class)->saveCampaign(
            $request->team_id,
            $request->acting_entity,
            $request->post('expected_entity_id/d', 0),
            $request->route('id/d', 0) ?: null,
            $request->post()
        );
        $this->audit($request, 'save', 'redemptionCampaign', $id);
        return success(['id' => $id], '卡活动已保存');
    }

    public function disableCampaign(Request $request)
    {
        $id = $request->route('id/d', 0);
        app(EntitlementSelfManagement::class)->disableCampaign(
            $request->team_id, $request->acting_entity, $request->post('expected_entity_id/d', 0), $id
        );
        $this->audit($request, 'disable', 'redemptionCampaign', $id);
        return message('卡活动已停用');
    }

    public function codes(Request $request)
    {
        return success(app(EntitlementSelfManagement::class)->codes(
            $request->team_id,
            $request->acting_entity,
            $request->route('id/d', 0),
            $request->get('page/d', 1),
            $request->get('limit/d', 20)
        ));
    }

    public function issueCodes(Request $request)
    {
        $id = $request->route('id/d', 0);
        $result = app(EntitlementSelfManagement::class)->issueCodes(
            $request->team_id,
            $request->acting_entity,
            $request->post('expected_entity_id/d', 0),
            $id,
            $request->post()
        );
        $this->audit($request, 'issueCodes', 'redemptionCampaign', $id);
        return success($result, '卡密已发行');
    }

    public function revealCode(Request $request)
    {
        return success(app(EntitlementSelfManagement::class)->revealCode(
            $request->team_id,
            $request->acting_entity,
            $request->post('expected_entity_id/d', 0),
            $request->route('id/d', 0),
            $request->route('code_id/d', 0)
        ));
    }

    public function disableCode(Request $request)
    {
        $campaignId = $request->route('id/d', 0);
        $codeId = $request->route('code_id/d', 0);
        app(EntitlementSelfManagement::class)->disableCode(
            $request->team_id,
            $request->acting_entity,
            $request->post('expected_entity_id/d', 0),
            $campaignId,
            $codeId
        );
        $this->audit($request, 'disable', 'redemptionCode', $codeId);
        return message('卡密已停用');
    }

    private function audit(Request $request, string $action, string $resource, int $id): void
    {
        app(BusinessAudit::class)->record($request, 'shop', $action, $resource, $id);
    }
}
