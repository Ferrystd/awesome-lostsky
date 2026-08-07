<?php
declare(strict_types=1);

namespace app\transaction\controller;

use app\service\PermissionDictionary as Permissions;
use app\service\Sender;
use app\service\ServiceRedemption;
use app\service\Transaction as TransactionService;
use app\service\TransactionStats;
use think\Request;

final class Personal
{
    protected $middleware = [
        'JwtAuth', 'Context', 'EntityType:team,teamMember,teamVirtual', 'TeamAuth', 'Ability:transaction',
        'Permission:' . Permissions::TRANSACTION_READ => ['only' => ['transactions', 'transaction', 'bindings']],
        'Permission:' . Permissions::TRANSACTION_REPORT_READ => ['only' => ['stats']],
    ];

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
        return success(app(ServiceRedemption::class)->list(
            $request->team_id,
            $request->acting_entity,
            $request->entity_id,
            ['status' => $request->get('status')],
            $request->get('page/d', 1),
            $request->get('limit/d', 20),
            true
        ));
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

    public function bindings(Request $request)
    {
        return success(app(Sender::class)->bindings($request->team_id, $request->entity_id));
    }
}
