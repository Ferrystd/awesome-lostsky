<?php
declare(strict_types=1);

namespace app\weibo\controller;

final class Personal extends WorkspaceController
{
    protected $middleware = [
        'JwtAuth', 'Context', 'EntityType:team,teamMember,teamVirtual', 'TeamAuth',
        'Ability:weibo' => ['only' => ['post', 'like', 'comment', 'taskStart', 'taskResume']],
    ];
    protected function teamScope(): bool { return false; }
}
