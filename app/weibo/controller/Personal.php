<?php
declare(strict_types=1);

namespace app\weibo\controller;

use app\service\PermissionDictionary as Permissions;

final class Personal extends WorkspaceController
{
    protected $middleware = [
        'JwtAuth', 'Context', 'EntityType:team,teamMember,teamVirtual', 'TeamAuth',
        'Permission:' . Permissions::WEIBO_PERSONAL_USE => ['except' => []],
        'Ability:weibo' => ['only' => ['post', 'like', 'comment', 'taskStart', 'taskResume']],
    ];
    protected function teamScope(): bool { return false; }
}
