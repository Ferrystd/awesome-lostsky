<?php
declare(strict_types=1);
namespace app\community\controller;
use app\service\Community as Service;
use think\Request;
final class Community
{
    protected $middleware = [\app\community\middleware\OptionalIdentity::class];
    public function session(Request $r)
    {
        $actor = $r->acting_entity ?? null;
        return success(['entity' => $actor ? app(Service::class)->entityData($actor['entity_id']) : null, 'upload_team_slug' => app(Service::class)->uploadTeamSlug($actor)]);
    }
    public function index(Request $r) { return success(app(Service::class)->listing(null, false, $r->acting_entity ?? null, false, $r->get('keyword/s', ''), '', $r->get('page/d', 1), $r->get('limit/d', 20))); }
    public function mine(Request $r) { $actor = $this->authenticated($r); return success(app(Service::class)->listing(null, false, $actor, true, '', '', $r->get('page/d', 1), $r->get('limit/d', 20))); }
    public function get(Request $r) { return success(app(Service::class)->data($this->community($r), $r->acting_entity ?? null)); }
    public function boards(Request $r) { return $this->listing($r, 'boards'); }
    public function announcements(Request $r) { return $this->listing($r, 'announcements'); }
    public function posts(Request $r) { return $this->listing($r, 'posts'); }
    public function comments(Request $r) { return $this->listing($r, 'comments'); }
    public function post(Request $r) { return success(app(Service::class)->contentData(app(Service::class)->visiblePost($this->community($r), $r->route('post_id/d', 0), $r->acting_entity ?? null), $r->acting_entity ?? null)); }
    public function join(Request $r) { app(Service::class)->relation($this->community($r), $this->writeActor($r), 'join', true); return message('已加入社区'); }
    public function leave(Request $r) { app(Service::class)->relation($this->community($r), $this->writeActor($r), 'join', false); return message('已退出社区'); }
    public function like(Request $r) { app(Service::class)->relation($this->community($r), $this->writeActor($r), 'like', $r->post('liked/b', true), $r->route('post_id/d', 0)); return message('点赞状态已更新'); }
    public function createPost(Request $r) { return $this->content($r, 'post', false); }
    public function editPost(Request $r) { return $this->content($r, 'post', false); }
    public function deletePost(Request $r) { return $this->content($r, 'post', true); }
    public function createComment(Request $r) { return $this->content($r, 'comment', false); }
    public function editComment(Request $r) { return $this->content($r, 'comment', false); }
    public function deleteComment(Request $r) { return $this->content($r, 'comment', true); }
    public function upload(Request $r)
    {
        $actor = $this->writeActor($r);
        $teamId = app(\app\service\IdentitySession::class)->entityTeamId($actor['type'], $actor['id']);
        $file = $r->file('file');
        if (!$file) throw new \think\exception\HttpException(422, '请选择文件');
        return success(app(\app\service\File::class)->upload($file, $teamId, $actor, app(\app\validate\File::class)->attachmentSource('attachment')));
    }
    private function listing(Request $r, string $kind)
    {
        return success(app(Service::class)->resources($this->community($r), $kind, $r->acting_entity ?? null, false, $r->route('post_id/d', 0), $r->get('board_id/d', 0), $r->get('keyword/s', ''), $r->get('page/d', 1), $r->get('limit/d', 20)));
    }
    private function content(Request $r, string $kind, bool $delete)
    {
        $id = $r->route($kind === 'post' ? 'post_id/d' : 'comment_id/d', 0);
        return success(app(Service::class)->writeContent($this->community($r), $this->writeActor($r), $kind, $id, $r->route('post_id/d', 0), ['board_id' => $r->post('board_id/d', 0), 'title' => $r->post('title/s', ''), 'content' => $r->post('content/s', '')], $delete));
    }
    private function community(Request $r): object { return app(Service::class)->resolve($r->route('slug/s', '')); }
    private function authenticated(Request $r): array
    {
        if (($r->authenticated_user_id ?? 0) < 1) throw new \think\exception\HttpException(401, '请先登录');
        if (!$r->acting_entity) throw \app\exception\EntityContextException::required();
        return $r->acting_entity;
    }
    private function writeActor(Request $r): array { return app(Service::class)->actor($this->authenticated($r), $r->post('expected_entity_id/d', 0)); }
}
