<?php
declare(strict_types=1);

namespace app\transaction\controller;

use app\service\TransactionStats;
use think\Request;

class Transaction
{
    protected $middleware = [
        'JwtAuth'            => ['except' => []],
        'Context'            => ['except' => []],
        'MemberAccess'       => ['except' => []],
        'TransactionAbility' => ['only' => ['create', 'edit', 'delete', 'stats']],
        'TransactionVerify'  => ['only' => ['create', 'edit']],
        'TransactionAccess'  => ['only' => ['delete']],
    ];

    public function index(Request $request)
    {
        $service = app(\app\service\Transaction::class);
        $result  = $service->list($request->team_id, [
            'start_time'  => $request->get('start_time'),
            'end_time'    => $request->get('end_time'),
            'type'        => $request->get('type'),
            'handler_id'  => $request->get('handler_id'),
            'sender_id'   => $request->get('sender_id'),
            'cs_id'       => $request->get('cs_id'),
            'customer_id' => $request->get('customer_id'),
            'keyword'     => $request->get('keyword'),
        ], (int) $request->get('page', 1), (int) $request->get('limit', 20));

        return success($result);
    }

    public function get(Request $request)
    {
        $id = (int) $request->param('id', 0);

        $service = app(\app\service\Transaction::class);
        $result  = $service->get($request->team_id, $id);

        return success($result);
    }

    public function create(Request $request)
    {
        $service = app(\app\service\Transaction::class);
        $id = $service->create($request->team_id, [
            'handler_id'  => $request->post('handler_id', 0),
            'sender_id'   => $request->post('sender_id', null),
            'cs_id'       => $request->post('cs_id', null),
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

        return success(['id' => $id], '流水已创建');
    }

    public function edit(Request $request)
    {
        $id = (int) $request->param('id', 0);

        $data = [];
        foreach (['type','total_price','cost','cash','prepaid',
            'handler_cut','sender_cut','cs_cut','team_cut',
            'trans_at','memo','sender_id','cs_id','customer_id'] as $field) {
            if ($request->has($field, 'post')) {
                $data[$field] = $request->post($field);
            }
        }

        $service = app(\app\service\Transaction::class);
        $service->edit($request->team_id, $id, $data);

        return message('流水已更新');
    }

    public function delete(Request $request)
    {
        $id = (int) $request->param('id', 0);

        $service = app(\app\service\Transaction::class);
        $service->delete($request->team_id, $id);

        return message('流水已删除');
    }

    public function stats(Request $request)
    {
        $service   = app(TransactionStats::class);
        $startTime = (int) $request->get('start_time', 0);
        $endTime   = (int) $request->get('end_time', 0);
        $type      = $request->get('type', 'summary');

        $result = match ($type) {
            'byRole'     => $service->byRole($request->team_id, $startTime, $endTime),
            'byMember'   => $service->byMember($request->team_id, $startTime, $endTime, $request->get('role', 'handler')),
            'timeline'   => $service->timeline($request->team_id, $startTime, $endTime, $request->get('granularity', 'day')),
            'byCustomer' => $service->byCustomer($request->team_id, $startTime, $endTime),
            default      => $service->summary($request->team_id, $startTime, $endTime),
        };

        return success($result);
    }
}
