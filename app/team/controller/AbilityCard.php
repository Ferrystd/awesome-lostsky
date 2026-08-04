<?php
declare(strict_types=1);

namespace app\team\controller;

use app\service\PermissionDictionary as Permissions;
use app\service\Redemption;
use think\Request;

class AbilityCard
{
    protected $middleware = [
        'JwtAuth', 'Context', 'EntityType:team,teamMember,teamCustomer,teamVirtual', 'TeamAuth',
        'Permission:' . Permissions::TEAM_ABILITY_REDEEM,
    ];

    public function inspect(Request $request)
    {
        return success(app(Redemption::class)->inspect($request->post('code/s', '')));
    }

    public function index(Request $request)
    {
        $resolver = app(\app\service\AbilityResolver::class);
        $labels = ['doc' => '文档', 'file' => '文件', 'transaction' => '流水'];
        $result = [];
        foreach ($labels as $key => $label) $result[] = ['key' => $key, 'label' => $label] + $resolver->resolve($request->team_id, $key);
        return success($result);
    }

    public function redeem(Request $request)
    {
        $id = app(Redemption::class)->claimForTeam(
            $request->post('code/s', ''),
            $request->team_id,
            $request->entity_id
        );
        app(\app\service\BusinessAudit::class)->record($request, 'team', 'redeem', 'abilityClaim', $id);
        return success(['id' => $id], 'Ability 已解锁');
    }
}
