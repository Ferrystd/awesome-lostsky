<?php
declare(strict_types=1);

namespace app\transaction\controller;

use app\service\TransactionStats;
use app\service\PermissionDictionary as Permissions;
use think\Request;

class Transaction
{
    protected $middleware = [
        'JwtAuth'            => ['except' => []],
        'Context'            => ['except' => []],
        'EntityType:team,teamMember,teamVirtual' => ['except' => []],
        'TeamAuth'           => ['except' => []],
        'Ability:transaction' => ['except' => []],
        'Permission:' . Permissions::TRANSACTION_READ => ['only' => ['index', 'get']],
        'Permission:' . Permissions::TRANSACTION_WRITE => ['only' => ['create', 'edit']],
        'Permission:' . Permissions::TRANSACTION_DELETE => ['only' => ['delete']],
        'Permission:' . Permissions::TRANSACTION_REPORT_READ => ['only' => ['stats']],
        'TransactionVerify'  => ['only' => ['create', 'edit']],
    ];

    public function index(Request $request)
    {
        $service = app(\app\service\Transaction::class);
        $result  = $service->list($request->team_id, [
            'start_time'  => $request->get('start_time'),
            'end_time'    => $request->get('end_time'),
            'type'        => $request->get('type'),
            'handler_entity_id'  => $request->get('handler_entity_id'),
            'sender_entity_id'   => $request->get('sender_entity_id'),
            'cs_entity_id'       => $request->get('cs_entity_id'),
            'customer_id' => $request->get('customer_id'),
            'keyword'     => $request->get('keyword'),
        ], $request->get('page/d', 1), $request->get('limit/d', 20));

        return success($result);
    }

    public function get(Request $request)
    {
        $id = $request->route('id/d', 0);

        $service = app(\app\service\Transaction::class);
        $result  = $service->get($request->team_id, $id);

        return success($result);
    }

    public function create(Request $request)
    {
        $service = app(\app\service\Transaction::class);
        $id = $service->create($request->team_id, [
            'handler_entity_id'  => $request->post('handler_entity_id', 0),
            'sender_entity_id'   => $request->post('sender_entity_id', null),
            'cs_entity_id'       => $request->post('cs_entity_id', null),
            'customer_id' => $request->post('customer_id', null),
            'type'        => $request->post('type', 2),
            'total_price' => $request->post('total_price', 0),
            'cost'        => $request->post('cost', 0),
            'cash'        => $request->post('cash', 0),
            'prepaid'     => $request->post('prepaid', 0),
            'handler_cut' => $request->post('handler_cut', 0),
            'sender_cut'  => $request->post('sender_cut', 0),
            'cs_cut'      => $request->post('cs_cut', 0),
            'team_cut'    => $request->post('team_cut', 0),
            'trans_at'    => $request->post('trans_at', time()),
            'memo'        => $request->post('memo', null),
        ]);
        app(\app\service\BusinessAudit::class)->record($request, 'transaction', 'create', 'transaction', $id);

        return success(['id' => $id], '流水已创建');
    }

    public function edit(Request $request)
    {
        $id = $request->route('id/d', 0);

        $data = [];
        foreach (['type','total_price','cost','cash','prepaid',
            'handler_cut','sender_cut','cs_cut','team_cut',
            'trans_at','memo','sender_entity_id','cs_entity_id','customer_id'] as $field) {
            if ($request->has($field, 'post')) {
                $data[$field] = $request->post($field);
            }
        }

        $service = app(\app\service\Transaction::class);
        $service->edit($request->team_id, $id, $data);
        app(\app\service\BusinessAudit::class)->record($request, 'transaction', 'update', 'transaction', $id);

        return message('流水已更新');
    }

    public function delete(Request $request)
    {
        $id = $request->route('id/d', 0);

        $service = app(\app\service\Transaction::class);
        $service->delete($request->team_id, $id);
        app(\app\service\BusinessAudit::class)->record($request, 'transaction', 'delete', 'transaction', $id);

        return message('流水已删除');
    }

    public function stats(Request $request)
    {
        $service   = app(TransactionStats::class);
        $startTime = $request->get('start_time/d', 0);
        $endTime   = $request->get('end_time/d', 0);
        $type      = $request->get('type', 'summary');

        $result = match ($type) {
            'byRole'     => $service->byRole($request->team_id, $startTime, $endTime),
            'byEntity'   => $service->byEntity($request->team_id, $startTime, $endTime, $request->get('role', 'handler')),
            'timeline'   => $service->timeline($request->team_id, $startTime, $endTime, $request->get('granularity', 'day')),
            'byCustomer' => $service->byCustomer($request->team_id, $startTime, $endTime),
            'byAssignee' => $service->byAssignee($request->team_id, $startTime, $endTime),
            'byPerson'   => $service->byPerson(
                $request->team_id,
                $startTime,
                $endTime,
                $request->get('page/d', 1),
                $request->get('limit/d', 20),
                $request->get('sort_by/s', 'handler_performance_total'),
                $request->get('sort_order/s', 'desc')
            ),
            default      => $service->summary($request->team_id, $startTime, $endTime),
        };

        return success($result);
    }
}
