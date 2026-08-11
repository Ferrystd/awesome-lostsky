<?php
declare(strict_types=1);

namespace app\transaction\controller;

use app\service\ServiceRedemption;
use think\Request;

class Service
{
    protected $middleware = [
        'JwtAuth' => ['except' => []],
        'Context' => ['except' => []],
        'EntityType:team,teamMember,teamVirtual' => ['except' => []],
        'TeamAuth' => ['except' => []],
        // 已经开始的履约属于待完成义务。Transaction Ability 失效时仍允许
        // complete 收口；ServiceRedemption 会跳过流水与加价业绩写入。
        'Ability:transaction' => ['except' => ['complete']],
    ];

    public function index(Request $request)
    {
        return success(app(ServiceRedemption::class)->list(
            $request->team_id,
            $request->acting_entity,
            $request->entity_id,
            [
                'status' => $request->get('status'),
                'handler_entity_id' => $request->get('handler_entity_id'),
            ],
            $request->get('page/d', 1),
            $request->get('limit/d', 20)
        ));
    }

    public function get(Request $request)
    {
        return success(app(ServiceRedemption::class)->get(
            $request->team_id,
            $request->acting_entity,
            $request->entity_id,
            $request->route('id/d', 0)
        ));
    }

    public function handlers(Request $request)
    {
        return success(app(ServiceRedemption::class)->availableHandlers(
            $request->team_id,
            $request->acting_entity,
            $request->entity_id,
            $request->route('id/d', 0)
        ));
    }

    public function approveCancel(Request $request) { return $this->run($request, 'approveCancel', '已同意取消核销'); }
    public function rejectCancel(Request $request) { return $this->run($request, 'rejectCancel', '已拒绝取消核销', $request->post('reason/s', '')); }
    public function reassign(Request $request) { return $this->run($request, 'reassign', '已改派接单人', $request->post('handler_entity_id/d', 0), $request->post('reason/s', '')); }
    public function complete(Request $request) { return $this->run($request, 'complete', '服务已核销', $request->post('field_values/a', [])); }

    public function createAdjustment(Request $request)
    {
        $instanceId = $request->route('id/d', 0);
        $id = app(\app\service\ServiceAdjustment::class)->create(
            $request->team_id,
            $request->acting_entity,
            $request->entity_id,
            $instanceId,
            $request->post()
        );
        app(\app\service\BusinessAudit::class)->record($request, 'transaction', 'create', 'serviceAdjustment', $id);
        return success(['id' => $id], '加价费用已提交客户确认');
    }

    public function cancelAdjustment(Request $request)
    {
        $id = $request->route('adjustment_id/d', 0);
        app(\app\service\ServiceAdjustment::class)->cancel(
            $request->team_id,
            $request->acting_entity,
            $request->entity_id,
            $request->route('id/d', 0),
            $id
        );
        app(\app\service\BusinessAudit::class)->record($request, 'transaction', 'cancel', 'serviceAdjustment', $id);
        return message('加价费用已取消');
    }

    private function run(Request $request, string $method, string $message, mixed ...$arguments)
    {
        $id = $request->route('id/d', 0);
        app(ServiceRedemption::class)->{$method}(
            $request->team_id,
            $request->acting_entity,
            $request->entity_id,
            $id,
            ...$arguments
        );
        app(\app\service\BusinessAudit::class)->record($request, 'transaction', $method, 'serviceInstance', $id);
        return message($message);
    }
}
