<?php
declare(strict_types=1);

namespace app\weibo\controller;

use app\service\PermissionDictionary as Permissions;

final class Team extends WorkspaceController
{
    protected $middleware = [
        'JwtAuth', 'Context', 'EntityType:team,teamMember,teamCustomer,teamVirtual', 'TeamWorkspaceAuth',
        'Permission:' . Permissions::WEIBO_TEAM_MANAGE => ['except' => []],
        'Ability:weibo' => ['only' => ['post', 'like', 'comment', 'taskStart', 'taskResume']],
    ];
    protected function teamScope(): bool { return true; }
}
