<?php
declare(strict_types=1);

namespace app\team\controller;

use app\service\PermissionDictionary as Permissions;
use think\Request;

class EntityRole
{
    protected $middleware = [
        'JwtAuth', 'Context', 'EntityType:team,teamMember,teamCustomer,teamVirtual',
        'TeamAuth',
        'Permission:' . Permissions::TEAM_ROLE_READ => ['only' => ['index', 'resolve']],
        'Permission:' . Permissions::TEAM_ROLE_WRITE => ['only' => ['save']],
    ];
    public function index(Request $request) { return success(app(\app\service\EntityRole::class)->list($request->team_id, $request->get('slug/s', ''))); }
    public function resolve(Request $request) { return success(app(\app\service\EntityRole::class)->describe($request->team_id, $request->get('slug/s', ''))); }
    public function save(Request $request) { app(\app\service\EntityRole::class)->save($request->team_id, $request->post('slug/s', ''), $request->post('role_ids/a', [])); return message('Entity roles updated'); }
}
