<?php
declare(strict_types=1);

namespace app\transaction\controller;

use app\service\PermissionDictionary as Permissions;
use think\Request;

class Options
{
    protected $middleware = [
        'JwtAuth'      => ['except' => []],
        'Context'      => ['except' => []],
        'EntityType:team,teamMember,teamCustomer,teamVirtual' => ['except' => []],
        'TeamAuth'     => ['except' => []],
        'Permission:' . Permissions::TRANSACTION_READ => ['except' => []],
    ];

    public function index(Request $request)
    {
        return success(app(\app\service\Transaction::class)->options($request->team_id));
    }
}
