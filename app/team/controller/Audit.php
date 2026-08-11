<?php
declare(strict_types=1);

namespace app\team\controller;

use app\service\PermissionDictionary as Permissions;
use think\Request;

class Audit
{
    protected $middleware = [
        'JwtAuth', 'Context', 'EntityType:team,teamMember,teamCustomer,teamVirtual',
        'TeamAuth',
        'Permission:' . Permissions::TEAM_AUDIT_READ,
    ];

    public function catalog(Request $request)
    {
        return success(app(\app\service\TeamAudit::class)->catalog());
    }

    public function index(Request $request)
    {
        return success(app(\app\service\TeamAudit::class)->list($request->team_id, [
            'q' => $request->get('q/s', ''),
            'application' => $request->get('application/s', ''),
            'action' => $request->get('action/s', ''),
            'resource_type' => $request->get('resource_type/s', ''),
            'actor_entity_id' => $request->get('actor_entity_id/d', 0),
            'start_time' => $request->get('start_time/d', 0),
            'end_time' => $request->get('end_time/d', 0),
            'page' => $request->get('page/d', 1),
            'limit' => $request->get('limit/d', 20),
        ]));
    }

    public function get(Request $request)
    {
        return success(app(\app\service\TeamAudit::class)->get(
            $request->team_id,
            $request->get('id/d', 0)
        ));
    }
}
