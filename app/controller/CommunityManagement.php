<?php
declare(strict_types=1);
namespace app\controller;
use app\service\Community as Service;
use think\Request;

/** Shared concrete management operations; subclasses provide each application's authorization. */
abstract class CommunityManagement
{
    abstract protected function authorize(Request $request, string $operation): ?int;
    abstract protected function application(): string;

    public function index(Request $r)
    {
        $teamId = $this->authorize($r, 'read');
        return success(app(Service::class)->listing($teamId, $this->application() === 'admin', $r->acting_entity ?? null, false, $r->get('keyword/s', ''), $r->get('status/s', ''), $r->get('page/d', 1), $r->get('limit/d', 20)));
    }
    public function get(Request $r)
    {
        $row = $this->target($r, 'read');
        $data = app(Service::class)->data($row, $r->acting_entity ?? null);
        if ($this->application() === 'admin') {
            $access = app(\app\service\PlatformAdminAccess::class);
            $data['can_write'] = $access->has($r->user_id, \app\service\PermissionDictionary::ADMIN_COMMUNITY_WRITE);
            $data['can_moderate'] = $access->has($r->user_id, \app\service\PermissionDictionary::ADMIN_COMMUNITY_MODERATE);
        } else $data += ['can_write' => $data['can_manage'], 'can_moderate' => $data['can_manage']];
        return success($data);
    }
    public function create(Request $r)
    {
        $teamId = $this->authorize($r, 'write');
        $this->expected($r);
        return $this->audited($r, null, 'create', fn () => app(Service::class)->data(app(Service::class)->save(null, $teamId, $this->metadata($r)), $r->acting_entity ?? null));
    }
    public function update(Request $r)
    {
        $row = $this->target($r, 'write'); $this->expected($r);
        return $this->audited($r, $row, 'update', fn () => app(Service::class)->data(app(Service::class)->save($row, $row->team_id ? (int) $row->team_id : null, $this->metadata($r)), $r->acting_entity ?? null));
    }
    public function boards(Request $r) { return $this->listing($r, 'boards'); }
    public function announcements(Request $r) { return $this->listing($r, 'announcements'); }
    public function board(Request $r) { return success(app(Service::class)->managedResource($this->target($r, 'read'), 'board', $r->route('board_id/d', 0))); }
    public function announcement(Request $r) { return success(app(Service::class)->managedResource($this->target($r, 'read'), 'announcement', $r->route('announcement_id/d', 0))); }
    public function posts(Request $r) { return $this->listing($r, 'posts'); }
    public function comments(Request $r) { return $this->listing($r, 'comments'); }
    public function members(Request $r) { return $this->listing($r, 'members'); }
    public function administrators(Request $r) { return $this->listing($r, 'administrators'); }
    public function saveBoard(Request $r)
    {
        $row = $this->target($r, 'moderate'); $this->expected($r);
        return $this->audited($r, $row, 'board.save', fn () => app(Service::class)->saveBoard($row, $r->route('board_id/d', 0), ['name' => $r->post('name/s', ''), 'sort' => $r->post('sort/d', 0), 'enabled' => $r->post('enabled/b', true)]));
    }
    public function saveAnnouncement(Request $r)
    {
        $row = $this->target($r, 'moderate'); $this->expected($r);
        return $this->audited($r, $row, 'announcement.save', fn () => app(Service::class)->saveAnnouncement($row, $r->route('announcement_id/d', 0), ['title' => $r->post('title/s', ''), 'content' => $r->post('content/s', ''), 'pinned' => $r->post('pinned/b', true)], $this->application() === 'admin' ? null : $r->acting_entity));
    }
    public function moderatePost(Request $r) { return $this->moderate($r, 'post'); }
    public function moderateComment(Request $r) { return $this->moderate($r, 'comment'); }
    public function mute(Request $r)
    {
        $row = $this->target($r, 'moderate'); $this->expected($r);
        return $this->audited($r, $row, 'member.mute', fn () => app(Service::class)->mute($row, $r->route('entity_id/d', 0), $r->post('muted/b', true), $r->post('reason/s', '')));
    }
    public function addAdministrator(Request $r)
    {
        $row = $this->target($r, 'write'); $this->expected($r);
        return $this->audited($r, $row, 'administrator.add', fn () => app(Service::class)->administrator($row, $r->post('entity_slug/s', ''), 0, false));
    }
    public function removeAdministrator(Request $r)
    {
        $row = $this->target($r, 'write'); $this->expected($r);
        return $this->audited($r, $row, 'administrator.remove', fn () => app(Service::class)->administrator($row, '', $r->route('entity_id/d', 0), true));
    }
    private function listing(Request $r, string $kind)
    {
        $row = $this->target($r, 'read');
        return success(app(Service::class)->resources($row, $kind, $r->acting_entity ?? null, true, $r->get('post_id/d', 0), $r->get('board_id/d', 0), $r->get('keyword/s', ''), $r->get('page/d', 1), $r->get('limit/d', 20)));
    }
    private function moderate(Request $r, string $kind)
    {
        $row = $this->target($r, 'moderate'); $this->expected($r);
        return $this->audited($r, $row, $kind . '.moderate', fn () => app(Service::class)->moderate($row, $kind, $r->route($kind === 'post' ? 'post_id/d' : 'comment_id/d', 0), $r->has('hidden', 'post') ? $r->post('hidden/b') : null, $r->has('pinned', 'post') ? $r->post('pinned/b') : null, $r->post('reason/s', '')));
    }
    private function target(Request $r, string $operation): object
    {
        $teamId = $this->authorize($r, $operation);
        $row = app(Service::class)->resolve($this->application() === 'community' ? $r->route('slug/s', '') : $r->route('id/d', 0));
        if ($this->application() === 'community') app(Service::class)->manage($row, $r->acting_entity ?? null);
        else app(Service::class)->scope($row, $teamId);
        return $row;
    }
    private function expected(Request $r): void
    {
        if ($this->application() !== 'admin') app(Service::class)->actor($r->acting_entity ?? null, $r->post('expected_entity_id/d', 0));
    }
    private function metadata(Request $r): array
    {
        $types = ['name' => 's', 'slug' => 's', 'description' => 's', 'status' => 's', 'is_official' => 'b', 'reason' => 's'];
        $data = [];
        foreach ($types as $key => $type) if ($r->has($key, 'post')) $data[$key] = $r->post($key . '/' . $type);
        return $data;
    }
    private function audited(Request $r, ?object $community, string $action, callable $operation)
    {
        return success(app(Service::class)->audited($r, $this->application(), $community, $action, $operation));
    }
}
