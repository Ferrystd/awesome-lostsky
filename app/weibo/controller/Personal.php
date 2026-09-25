<?php
declare(strict_types=1);

namespace app\weibo\controller;

use app\service\PermissionDictionary as Permissions;
use app\service\WeiboFeed;
use think\Request;

final class Personal extends WorkspaceController
{
    protected $middleware = [
        'JwtAuth', 'Context', 'EntityType:team,teamMember,teamVirtual', 'TeamAuth',
        'Permission:' . Permissions::WEIBO_PERSONAL_USE => ['except' => ['feed']],
        'Ability:weibo' => ['only' => ['post', 'like', 'comment', 'taskStart', 'taskResume', 'feedItem', 'feedComment']],
    ];
    protected function teamScope(): bool { return false; }

    public function feedItem(Request $request)
    {
        return success(app(WeiboFeed::class)->get(
            $request->team_id,
            $request->acting_entity,
            $request->route('id/d', 0)
        ));
    }
}
