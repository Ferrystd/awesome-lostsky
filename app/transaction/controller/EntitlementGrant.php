<?php
declare(strict_types=1);

namespace app\transaction\controller;

use app\service\ManualEntitlementGrant;
use app\service\PermissionDictionary as Permissions;
use think\Request;

final class EntitlementGrant
{
    protected $middleware = [
        'JwtAuth' => ['except' => []],
        'Context' => ['except' => []],
        'EntityType:team,teamMember,teamVirtual' => ['except' => []],
        'TeamAuth' => ['except' => []],
        'Ability:transaction' => ['except' => []],
        'Permission:' . Permissions::TRANSACTION_WRITE => ['only' => ['options', 'create']],
        'Permission:' . Permissions::SERVICE_ENTITLEMENT_GRANT => ['only' => ['personalOptions', 'personalCreate']],
        'TransactionVerify' => ['only' => ['create']],
    ];

    public function options(Request $request)
    {
        return success(app(ManualEntitlementGrant::class)->options(
            $request->team_id,
            $request->acting_entity,
            $request->entity_id
        ));
    }

    public function create(Request $request)
    {
        return $this->createGrant($request, false);
    }

    public function personalOptions(Request $request)
    {
        return success(app(ManualEntitlementGrant::class)->options(
            $request->team_id,
            $request->acting_entity,
            $request->entity_id,
            true
        ));
    }

    public function personalHistory(Request $request)
    {
        return success(app(ManualEntitlementGrant::class)->personalHistory(
            $request->team_id,
            $request->entity_id,
            $request->get('keyword/s', ''),
            $request->get('page/d', 1),
            $request->get('limit/d', 20)
        ));
    }

    public function personalCreate(Request $request)
    {
        return $this->createGrant($request, true);
    }

    private function createGrant(Request $request, bool $personal)
    {
        $result = app(ManualEntitlementGrant::class)->grant(
            $request->team_id,
            $request->entity_id,
            $request->post(),
            $personal
        );
        app(\app\service\BusinessAudit::class)->record(
            $request,
            'transaction',
            'grant',
            'serviceEntitlement',
            (int) ($result['entitlement_ids'][0] ?? 0),
            [
                'changed_fields' => ['product_id', 'customer_id', 'quantity', 'sender_entity_id', 'cs_entity_id'],
                'entitlement_ids' => $result['entitlement_ids'],
                'transaction_id' => $result['transaction_id'],
            ]
        );
        return success($result, '顾客权益已赋予');
    }
}
