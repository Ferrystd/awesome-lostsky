<?php
declare(strict_types=1);

namespace app\account\controller;

use app\service\IdentitySession;
use app\service\WorkspaceWarning;
use think\exception\HttpException;
use think\Request;

class Identity
{
    protected $middleware = [
        'JwtAuth',
        'Context',
        'EntityType:teamless,team,teamMember,teamCustomer,teamVirtual' => ['only' => ['candidates', 'receive', 'target']],
        'EntityType:team,teamMember,teamCustomer,teamVirtual' => ['only' => ['drop', 'workspaceWarning', 'acknowledgeWorkspaceWarning']],
    ];

    public function candidates(Request $request)
    {
        return success(app(IdentitySession::class)->candidates(
            $request->authenticated_user_id,
            $request->entity_session ?? null
        ));
    }

    public function receive(Request $request)
    {
        return success(app(IdentitySession::class)->receive(
            $request->authenticated_user_id,
            (string) ($request->jwt->dvt ?? ''),
            $request->post('slug/s', ''),
            $request->entity_session ?? null
        ), 'Identity received');
    }

    public function drop(Request $request)
    {
        return success(app(IdentitySession::class)->drop(
            $request->authenticated_user_id,
            (string) ($request->jwt->dvt ?? ''),
            (string) ($request->jwt->jti ?? '')
        ), 'Identity dropped');
    }

    public function target(Request $request)
    {
        return success(app(IdentitySession::class)->currentTarget($request->acting_entity ?? null));
    }

    public function member(Request $request)
    {
        return success(app(IdentitySession::class)->receiveMember(
            $request->authenticated_user_id,
            (string) ($request->jwt->dvt ?? ''),
            $request->post('team_slug/s', '')
        ), '已切换为当前团队成员');
    }

    public function workspaceWarning(Request $request)
    {
        $context = $this->workspaceWarningContext($request);

        return success([
            'team' => $context['team'],
            'identity' => $context['identity'],
            'can_continue' => $context['can_continue'],
            'entry_warning' => $context['entry_warning'],
        ]);
    }

    public function acknowledgeWorkspaceWarning(Request $request)
    {
        $context = $this->workspaceWarningContext($request);
        if (!$context['is_external']) {
            throw new HttpException(409, '当前实体已属于目标团队，无需确认外部身份警告');
        }

        return success(app(WorkspaceWarning::class)->acknowledge(
            $request,
            (int) $context['team_id'],
            $request->entity_id
        ));
    }

    private function workspaceWarningContext(Request $request): array
    {
        $slug = strtolower(trim($request->isGet()
            ? $request->get('team_slug/s', '')
            : $request->post('team_slug/s', '')));
        if (!preg_match('/^[a-z][a-z0-9_-]{1,49}$/', $slug)) {
            throw new HttpException(422, '团队 slug 格式不正确');
        }
        return app(WorkspaceWarning::class)->context(
            $slug,
            $request->acting_entity,
            $request->entity_id,
            $request
        );
    }
}
