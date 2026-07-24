<?php
declare(strict_types=1);

namespace app\team\controller;

use think\Request;

class EntityRole
{
    protected $middleware = [
        'JwtAuth', 'Context', 'EntityType:team,teamMember,teamCustomer,teamVirtual',
        'TeamBelongs', 'TeamAccess',
    ];
    public function index(Request $request) { return success(app(\app\service\EntityRole::class)->list((int) $request->team_id, (string) $request->get('slug', ''))); }
    public function save(Request $request) { app(\app\service\EntityRole::class)->save((int) $request->team_id, (string) $request->post('slug', ''), (array) $request->post('role_ids', [])); return message('Entity roles updated'); }
}
