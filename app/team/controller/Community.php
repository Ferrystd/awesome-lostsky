<?php
declare(strict_types=1);
namespace app\team\controller;
use think\Request;
use app\service\PermissionDictionary as Permissions;
final class Community extends \app\controller\CommunityManagement
{
    protected $middleware = ['JwtAuth', 'Context', 'EntityRequired', 'TeamWorkspaceAuth'];
    protected function authorize(Request $request, string $operation): ?int
    {
        app(\app\service\PermissionGate::class)->assert($request->team_id, $request->acting_entity, [$operation === 'read' ? Permissions::COMMUNITY_TEAM_READ : Permissions::COMMUNITY_TEAM_MANAGE]);
        return $request->team_id;
    }
    protected function application(): string { return 'team'; }
}
