<?php
declare(strict_types=1);

namespace app\account\controller;

use app\service\IdentitySession;
use think\Request;

class Identity
{
    protected $middleware = [
        'JwtAuth',
        'Context',
        'EntityType:teamless,team,teamMember,teamCustomer,teamVirtual' => ['only' => ['candidates', 'receive']],
        'EntityType:team,teamMember,teamCustomer,teamVirtual' => ['only' => ['drop']],
    ];

    public function candidates(Request $request)
    {
        return success(app(IdentitySession::class)->candidates(
            (int) $request->authenticated_user_id,
            $request->entity_session ?? null
        ));
    }

    public function receive(Request $request)
    {
        return success(app(IdentitySession::class)->receive(
            (int) $request->authenticated_user_id,
            (string) ($request->jwt->dvt ?? ''),
            (string) $request->post('slug', ''),
            $request->entity_session ?? null
        ), 'Identity received');
    }

    public function drop(Request $request)
    {
        return success(app(IdentitySession::class)->drop(
            (int) $request->authenticated_user_id,
            (string) ($request->jwt->dvt ?? ''),
            (string) ($request->jwt->jti ?? '')
        ), 'Identity dropped');
    }

    public function member(Request $request)
    {
        return success(app(IdentitySession::class)->receiveMember(
            (int) $request->authenticated_user_id,
            (string) ($request->jwt->dvt ?? ''),
            (string) $request->post('team_slug', '')
        ), '已切换为当前团队成员');
    }
}
