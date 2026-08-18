<?php
declare(strict_types=1);

namespace app\transaction\controller;

use app\service\PermissionDictionary as Permissions;
use app\service\ServiceRedemption;
use app\service\TeamCustomerManagement;
use app\service\Transaction as TransactionService;
use app\service\TransactionStats;
use think\Request;

final class Personal
{
    protected $middleware = [
        'JwtAuth', 'Context', 'EntityType:team,teamMember,teamVirtual', 'TeamAuth', 'Ability:transaction',
        'Permission:' . Permissions::TRANSACTION_WRITE => ['only' => ['transactionOptions']],
    ];

    public function transactionOptions(Request $request)
    {
        $actorEntityId = ($request->acting_entity['type'] ?? '') === 'team'
            ? null
            : $request->entity_id;
        return success(app(TransactionService::class)->options($request->team_id, $actorEntityId));
    }

    public function transactions(Request $request)
    {
        return success(app(TransactionService::class)->personal(
            $request->team_id,
            $request->entity_id,
            ['start_time' => $request->get('start_time'), 'end_time' => $request->get('end_time'), 'type' => $request->get('type'), 'keyword' => $request->get('keyword')],
            $request->get('page/d', 1),
            $request->get('limit/d', 20)
        ));
    }

    public function transaction(Request $request)
    {
        return success(app(TransactionService::class)->getPersonal($request->team_id, $request->entity_id, $request->route('id/d', 0)));
    }

    public function stats(Request $request)
    {
        return success(app(TransactionStats::class)->personal(
            $request->team_id,
            $request->entity_id,
            $request->get('start_time/d', 0),
            $request->get('end_time/d', time() + 1)
        ));
    }

    public function services(Request $request)
    {
        $service = app(ServiceRedemption::class);
        $result = $service->list(
            $request->team_id,
            $request->acting_entity,
            $request->entity_id,
            ['status' => $request->get('status')],
            $request->get('page/d', 1),
            $request->get('limit/d', 20),
            true
        );
        $result['available'] = $service->claimable(
            $request->team_id,
            $request->entity_id,
            1,
            50
        )['list'];
        $result['offers'] = $service->assignmentOffers(
            $request->team_id,
            $request->entity_id,
            1,
            50
        )['list'];
        return success($result);
    }

    public function claimService(Request $request)
    {
        $id = $request->route('id/d', 0);
        $instanceId = app(ServiceRedemption::class)->claim(
            $request->team_id,
            $request->entity_id,
            $id,
            $request->post('quantity', null),
            $request->post('field_values/a', [])
        );
        app(\app\service\BusinessAudit::class)->record($request, 'transaction', 'claim', 'serviceInstance', $id);
        return success(['id' => $instanceId], '已领取履约任务');
    }

    public function availableServices(Request $request)
    {
        return success(app(ServiceRedemption::class)->claimable(
            $request->team_id,
            $request->entity_id,
            $request->get('page/d', 1),
            $request->get('limit/d', 20)
        ));
    }

    public function availableService(Request $request)
    {
        return success(app(ServiceRedemption::class)->claimableGet(
            $request->team_id,
            $request->entity_id,
            $request->route('id/d', 0)
        ));
    }

    public function serviceOffers(Request $request)
    {
        return success(app(ServiceRedemption::class)->assignmentOffers(
            $request->team_id,
            $request->entity_id,
            $request->get('page/d', 1),
            $request->get('limit/d', 20)
        ));
    }

    public function serviceOffer(Request $request)
    {
        return success(app(ServiceRedemption::class)->assignmentOffer(
            $request->team_id,
            $request->entity_id,
            $request->route('id/d', 0)
        ));
    }

    public function acceptServiceOffer(Request $request)
    {
        $offerId = $request->route('id/d', 0);
        $instanceId = app(ServiceRedemption::class)->acceptOffer(
            $request->team_id,
            $request->entity_id,
            $offerId,
            $request->post('field_values/a', [])
        );
        app(\app\service\BusinessAudit::class)->record($request, 'transaction', 'accept', 'serviceAssignmentOffer', $offerId, ['service_instance_id' => $instanceId]);
        return success(['id' => $instanceId], '已接受接单邀请');
    }

    public function rejectServiceOffer(Request $request)
    {
        $offerId = $request->route('id/d', 0);
        app(ServiceRedemption::class)->rejectOffer($request->team_id, $request->entity_id, $offerId, $request->post('reason/s', ''));
        app(\app\service\BusinessAudit::class)->record($request, 'transaction', 'reject', 'serviceAssignmentOffer', $offerId);
        return message('已拒绝接单邀请');
    }

    public function returnService(Request $request)
    {
        $id = $request->route('id/d', 0);
        app(ServiceRedemption::class)->returnToPool($request->team_id, $request->entity_id, $id, $request->post('reason/s', ''));
        app(\app\service\BusinessAudit::class)->record($request, 'transaction', 'return', 'serviceInstance', $id);
        return message('任务已退回公开接单池');
    }

    public function completeService(Request $request)
    {
        $id = $request->route('id/d', 0);
        app(ServiceRedemption::class)->completeOwn(
            $request->team_id,
            $request->entity_id,
            $id,
            $request->post('field_values/a', [])
        );
        app(\app\service\BusinessAudit::class)->record($request, 'transaction', 'complete', 'serviceInstance', $id);
        return message('服务已核销');
    }

    public function service(Request $request)
    {
        return success(app(ServiceRedemption::class)->get(
            $request->team_id,
            $request->acting_entity,
            $request->entity_id,
            $request->route('id/d', 0),
            true
        ));
    }

    public function customers(Request $request)
    {
        return success(app(TeamCustomerManagement::class)->personalListing(
            $request->team_id,
            $request->entity_id,
            ['keyword' => $request->get('keyword/s', '')],
            $request->get('page/d', 1),
            $request->get('limit/d', 20)
        ));
    }
}
