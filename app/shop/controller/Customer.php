<?php
declare(strict_types=1);

namespace app\shop\controller;

use app\service\TeamCustomer;
use app\service\CustomerBinding;
use app\service\CustomerProfile;
use think\Request;

class Customer
{
    protected $middleware = [
        'JwtAuth'        => ['except' => []],
        'Context'        => ['except' => []],
        'EntityType:teamless,team,teamMember,teamCustomer,teamVirtual' => ['only' => ['bind']],
        'EntityType:teamCustomer' => ['except' => ['bind']],
        'TeamAuth'       => ['except' => ['bind']],
        'CustomerAccess' => ['except' => ['bind']],
    ];

    public function bind(Request $request)
    {
        $result = app(CustomerBinding::class)->bind(
            $request->team_id,
            $request->authenticated_user_id,
            (string) ($request->jwt->dvt ?? ''),
            $request->entity_session ?? null,
            $request->post('slug') === null ? null : $request->post('slug/s'),
            $request->post('inviter_slug') === null ? null : $request->post('inviter_slug/s')
        );
        app(\app\service\BusinessAudit::class)->record(
            $request, 'shop', 'bind', 'customer', (int) ($result['customer']['id'] ?? 0),
            ['changed' => (bool) ($result['created'] ?? false)]
        );

        return success($result, $result['created'] ? '客户身份已建立' : '客户身份已领取');
    }

    public function me(Request $request)
    {
        return success(app(CustomerProfile::class)->get(
            $request->team_id,
            $request->customer_id
        ));
    }

    public function update(Request $request)
    {
        $data = [
            'nickname' => $request->post('nickname', ''),
            'avatar' => $request->post('avatar'),
            'description' => $request->post('description'),
        ];
        if ($request->has('assignee_entity_id', 'post')) {
            $data['assignee_entity_id'] = $request->post('assignee_entity_id');
        }
        app(CustomerProfile::class)->update(
            $request->team_id,
            $request->customer_id,
            $data
        );
        app(\app\service\BusinessAudit::class)->record(
            $request,
            'shop',
            'update',
            'customer',
            $request->customer_id,
            ['changed_fields' => array_keys($data), 'changed' => $data !== []]
        );

        return message('客户资料已更新');
    }

    public function upload(Request $request)
    {
        $file = $request->file('file');
        if (!$file) {
            return error('请选择文件', 1, 422);
        }

        $result = app(\app\service\File::class)->upload(
            $file,
            $request->team_id,
            $request->acting_entity
        );
        app(\app\service\BusinessAudit::class)->record(
            $request,
            'shop',
            'upload',
            'customer_file',
            (int) ($result['id'] ?? 0)
        );

        return success($result, '上传成功');
    }

    public function assignees(Request $request)
    {
        return success(app(CustomerProfile::class)->assignees($request->team_id));
    }

    public function slug(Request $request)
    {
        $result = app(CustomerProfile::class)->claimSlug(
            $request->team_id,
            $request->customer_id,
            $request->post('slug/s', '')
        );
        app(\app\service\BusinessAudit::class)->record(
            $request, 'shop', 'setSlug', 'customer', $request->customer_id,
            ['changed_fields' => ['slug']]
        );
        return success($result, '客户标识已确定');
    }

    public function orders(Request $request)
    {
        $service = app(TeamCustomer::class);
        $result  = $service->orders($request->team_id, $request->customer_id, [
            'status'     => $request->get('status'),
            'start_time' => $request->get('start_time'),
            'end_time'   => $request->get('end_time'),
        ], $request->get('page/d', 1), $request->get('limit/d', 20));

        return success($result);
    }

    public function order(Request $request)
    {
        return success(app(TeamCustomer::class)->order(
            $request->team_id,
            $request->customer_id,
            $request->route('id/d', 0)
        ));
    }

    public function purchase(Request $request)
    {
        $id = app(TeamCustomer::class)->purchase(
            $request->team_id,
            $request->customer_id,
            [
                'product_id' => $request->post('product_id'),
                'quantity' => $request->post('quantity', 1),
                'handler_entity_id' => $request->post('handler_entity_id', null),
                'memo' => $request->post('memo', null),
            ]
        );
        app(\app\service\BusinessAudit::class)->record($request, 'shop', 'purchase', 'order', $id);

        return success(['id' => $id], '购买成功');
    }

    public function cancelOrder(Request $request)
    {
        $id = $request->route('id/d', 0);
        app(TeamCustomer::class)->cancelOrder(
            $request->team_id,
            $request->customer_id,
            $id
        );
        app(\app\service\BusinessAudit::class)->record($request, 'shop', 'cancel', 'order', $id);

        return message('订单已取消，余额已退回');
    }

    public function transactions(Request $request)
    {
        $service = app(TeamCustomer::class);
        $result  = $service->transactions($request->team_id, $request->customer_id, [
            'type'       => $request->get('type'),
            'start_time' => $request->get('start_time'),
            'end_time'   => $request->get('end_time'),
        ], $request->get('page/d', 1), $request->get('limit/d', 20));

        return success($result);
    }

    public function balance(Request $request)
    {
        $service = app(TeamCustomer::class);
        $result  = $service->balance($request->team_id, $request->customer_id);

        return success($result);
    }

    public function balanceLogs(Request $request)
    {
        $service = app(TeamCustomer::class);
        $result  = $service->balanceLogs(
            $request->team_id,
            $request->customer_id,
            $request->get('page/d', 1),
            $request->get('limit/d', 20)
        );

        return success($result);
    }

    public function services(Request $request)
    {
        return success(app(\app\service\ServiceRedemption::class)->customerList(
            $request->team_id,
            $request->customer_id,
            ['status' => $request->get('status')],
            $request->get('page/d', 1),
            $request->get('limit/d', 20)
        ));
    }

    public function service(Request $request)
    {
        return success(app(\app\service\ServiceRedemption::class)->customerGet(
            $request->team_id,
            $request->customer_id,
            $request->route('id/d', 0)
        ));
    }

    public function serviceHandlers(Request $request)
    {
        return success(app(\app\service\ServiceRedemption::class)->handlers(
            $request->team_id,
            $request->customer_id,
            $request->route('id/d', 0)
        ));
    }

    public function startService(Request $request)
    {
        $entitlementId = $request->route('id/d', 0);
        $id = app(\app\service\ServiceRedemption::class)->start(
            $request->team_id,
            $request->customer_id,
            $entitlementId,
            $request->post('quantity', 1),
            $request->post('handler_entity_id/d', 0),
            $request->post('memo/s', ''),
            $request->post('field_values/a', []),
            $request->entity_id
        );
        app(\app\service\BusinessAudit::class)->record(
            $request, 'shop', 'start', 'serviceInstance', $id,
            ['entitlement_id' => $entitlementId, 'changed_fields' => ['quantity', 'handler_entity_id', 'memo', 'field_values']]
        );
        return success(['id' => $id], '已发起核销');
    }

    public function createServiceOffer(Request $request)
    {
        $entitlementId = $request->route('id/d', 0);
        $id = app(\app\service\ServiceRedemption::class)->createOffer(
            $request->team_id,
            $request->customer_id,
            $entitlementId,
            $request->post('quantity', 1),
            $request->post('handler_entity_id/d', 0),
            $request->post('memo/s', ''),
            $request->post('field_values/a', []),
            $request->entity_id,
            $request->header('Idempotency-Key', (string) ($request->request_id ?? ''))
        );
        app(\app\service\BusinessAudit::class)->record(
            $request, 'shop', 'invite', 'serviceAssignmentOffer', $id,
            ['entitlement_id' => $entitlementId, 'changed_fields' => ['quantity', 'handler_entity_id', 'memo', 'field_values']]
        );
        return success(['id' => $id], '接单邀请已发出');
    }

    public function withdrawServiceOffer(Request $request)
    {
        $id = $request->route('id/d', 0);
        app(\app\service\ServiceRedemption::class)->withdrawOffer(
            $request->team_id,
            $request->customer_id,
            $request->entity_id,
            $id,
            $request->post('reason/s', '')
        );
        app(\app\service\BusinessAudit::class)->record($request, 'shop', 'withdraw', 'serviceAssignmentOffer', $id);
        return message('接单邀请已撤回');
    }

    public function restartService(Request $request)
    {
        $id = $request->route('id/d', 0);
        app(\app\service\ServiceRedemption::class)->restart(
            $request->team_id,
            $request->customer_id,
            $id,
            $request->post('handler_entity_id/d', 0),
            $request->post('memo/s', ''),
            $request->post('field_values/a', []),
            $request->entity_id
        );
        app(\app\service\BusinessAudit::class)->record($request, 'shop', 'restart', 'serviceInstance', $id);
        return message('已重新发起核销');
    }

    public function cancelService(Request $request)
    {
        $id = app(\app\service\ServiceRedemption::class)->requestCancel(
            $request->team_id,
            $request->customer_id,
            $request->route('id/d', 0),
            $request->post('reason/s', ''),
            $request->entity_id
        );
        app(\app\service\BusinessAudit::class)->record(
            $request, 'shop', 'requestCancel', 'serviceInstance', $request->route('id/d', 0),
            ['cancel_request_id' => $id, 'changed_fields' => ['reason']]
        );
        return success(['id' => $id], '取消申请已提交');
    }

    public function acceptServiceAdjustment(Request $request)
    {
        $instanceId = $request->route('id/d', 0);
        $adjustmentId = $request->route('adjustment_id/d', 0);
        app(\app\service\ServiceAdjustment::class)->accept(
            $request->team_id,
            $request->customer_id,
            $request->entity_id,
            $instanceId,
            $adjustmentId
        );
        app(\app\service\BusinessAudit::class)->record($request, 'shop', 'accept', 'serviceAdjustment', $adjustmentId);
        return message('加价费用已确认');
    }

    public function rejectServiceAdjustment(Request $request)
    {
        $instanceId = $request->route('id/d', 0);
        $adjustmentId = $request->route('adjustment_id/d', 0);
        app(\app\service\ServiceAdjustment::class)->reject(
            $request->team_id,
            $request->customer_id,
            $request->entity_id,
            $instanceId,
            $adjustmentId
        );
        app(\app\service\BusinessAudit::class)->record($request, 'shop', 'reject', 'serviceAdjustment', $adjustmentId);
        return message('加价费用已拒绝');
    }

    public function cards(Request $request)
    {
        return success(app(\app\service\Redemption::class)->held($request->entity_id));
    }

    public function revealCard(Request $request)
    {
        return success(app(\app\service\Redemption::class)->reveal(
            $request->entity_id,
            $request->route('id/d', 0)
        ));
    }

    public function claimCard(Request $request)
    {
        $id = app(\app\service\Redemption::class)->claimForCustomer(
            $request->post('code/s', ''),
            $request->team_id,
            $request->customer_id,
            $request->entity_id
        );
        app(\app\service\BusinessAudit::class)->record(
            $request, 'shop', 'claim', 'redemptionCode', $id,
            ['changed_fields' => ['code']]
        );
        return success(['id' => $id], '卡密已领取');
    }
}
