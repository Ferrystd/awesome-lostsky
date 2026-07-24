<?php
declare(strict_types=1);

namespace app\chat\controller;

use think\Request;

class Identity
{
    protected $middleware = [
        'JwtAuth',
        'Context',
        'EntityType:teamless' => ['only' => ['candidates', 'receive']],
        'EntityType:team,teamMember,teamCustomer,teamVirtual' => ['only' => ['drop']],
    ];
    public function candidates(Request $request) { return success(app(\app\service\IdentitySession::class)->candidates((int) $request->authenticated_user_id)); }
    public function receive(Request $request) { return success(app(\app\service\IdentitySession::class)->receive((int) $request->authenticated_user_id, (string) ($request->jwt->dvt ?? ''), (string) $request->post('slug', '')), 'Identity received'); }
    public function drop(Request $request) { return success(app(\app\service\IdentitySession::class)->drop((int) $request->authenticated_user_id, (string) ($request->jwt->dvt ?? ''), (string) ($request->jwt->jti ?? '')), 'Identity dropped'); }
}
