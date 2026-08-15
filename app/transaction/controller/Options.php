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
        'EntityType:team,teamMember,teamVirtual' => ['except' => []],
        'TeamAuth'     => ['except' => []],
        'Ability:transaction' => ['except' => []],
        'Permission:' . Permissions::TRANSACTION_READ => ['only' => ['index']],
        'Permission:' . Permissions::TRANSACTION_REPORT_READ => ['only' => ['invite']],
    ];

    public function index(Request $request)
    {
        return success(app(\app\service\Transaction::class)->options($request->team_id));
    }

    public function invite(Request $request)
    {
        $type = $request->acting_entity['type'] ?? '';
        if (!in_array($type, ['team', 'teamMember', 'teamVirtual'], true)) {
            throw new \think\exception\HttpException(422, '当前身份不能成为顾客归属人');
        }
        $summary = app(\app\service\ChatActor::class)->summaryEntity($request->entity_id);
        return success([
            'entity_id' => $request->entity_id,
            'type' => $type,
            'slug' => $summary['slug'],
            'name' => $summary['name'],
            'avatar' => $summary['avatar'],
            'display_url' => "https://{$request->team->slug}.display.lostsky.work/?ref={$summary['slug']}",
        ]);
    }
}
