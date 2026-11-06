<?php
declare(strict_types=1);
namespace app\service;

use app\enum\CommunityOwner as Owner;
use app\enum\CommunityStatus as Status;
use app\enum\CommunityContentStatus as ContentStatus;
use app\model\Community as Model;
use app\model\CommunityBoard as Board;
use app\model\CommunityAnnouncement as Announcement;
use app\model\CommunityPost as Post;
use app\model\CommunityComment as Comment;
use app\model\CommunityMember as Member;
use app\model\CommunityAdministrator as Administrator;
use app\model\CommunityMute as Mute;
use app\model\CommunityLike as Like;
use think\exception\HttpException;
use think\facade\Db;

/** Shared community rules; entry-point authorization is explicit and never inferred from slug. */
class Community
{
    public function uploadTeamSlug(?array $actor): ?string
    {
        if (!$actor) return null;
        $id = app(IdentitySession::class)->entityTeamId($actor['type'], $actor['id']);
        return \app\model\Team::where('id', $id)->value('slug');
    }
    public function managedResource(Model $community, string $kind, int $id): array
    {
        return $this->resource($kind === 'board' ? Board::class : Announcement::class, $community, $id)->toArray();
    }
    public function audited(\think\Request $request, string $application, ?Model $community, string $action, callable $operation): mixed
    {
        return Db::transaction(function () use ($request, $application, $community, $action, $operation) {
            $result = $operation();
            $id = $community ? (int) $community->id : (is_array($result) ? ($result['id'] ?? null) : null);
            $context = ['community_id' => $id, 'owner_team_id' => $community?->team_id ?? (is_array($result) ? ($result['team_id'] ?? null) : null), 'reason' => $request->post('reason/s', ''), 'result' => 'success', 'target_ids' => ['post_id' => $request->route('post_id/d', 0), 'comment_id' => $request->route('comment_id/d', 0), 'entity_id' => $request->route('entity_id/d', 0)]];
            if ($application === 'admin') app(BusinessAudit::class)->recordPlatform($request->authenticated_user_id, 'community.' . $action, 'community', $id, $context, $request);
            else app(BusinessAudit::class)->record($request, $application, 'community.' . $action, 'community', $id, $context);
            return $result;
        });
    }
    public function resolve(int|string $key): Model
    {
        $row = is_int($key) ? Model::find($key) : Model::where('slug', $key)->find();
        if (!$row) throw new HttpException(404, '社区不存在');
        return $row;
    }

    public function actor(?array $actor, int $expected): array
    {
        if (!$actor) throw \app\exception\EntityContextException::required();
        app(Entity::class)->subject($actor['entity_id']);
        if ($expected !== $actor['entity_id']) throw new HttpException(409, '身份已切换，请刷新后重试');
        return $actor;
    }

    public function canManage(Model $community, ?array $actor): bool
    {
        if (!$actor) return false;
        $entity = \app\model\Entity::find($actor['entity_id']);
        if (!$entity || !$entity->is_valid) return false;
        return (bool) Administrator::where('community_id', $community->id)->where('entity_id', $actor['entity_id'])->find()
            || ($community->enumCase('owner_type') === Owner::Team
                && app(PermissionGate::class)->allows((int) $community->team_id, $actor, [PermissionDictionary::COMMUNITY_TEAM_MANAGE]));
    }

    public function manage(Model $community, ?array $actor): void
    {
        if (!$this->canManage($community, $actor)) throw new HttpException(403, '没有社区管理权限');
    }

    public function scope(Model $community, ?int $teamId): void
    {
        if ($teamId === null ? $community->enumCase('owner_type') !== Owner::Platform
            : ($community->enumCase('owner_type') !== Owner::Team || (int) $community->team_id !== $teamId)) {
            throw new HttpException(404, '社区不存在');
        }
    }

    public function data(Model $row, ?array $actor): array
    {
        $data = array_intersect_key($row->toArray(), array_flip(['id', 'slug', 'name', 'description', 'owner_type', 'team_id', 'is_official', 'status', 'create_time', 'update_time']));
        $entityId = $actor['entity_id'] ?? null;
        $mute = $entityId ? Mute::where('community_id', $row->id)->where('entity_id', $entityId)->find() : null;
        $data['owner'] = $row->team_id ? ['id' => (int) $row->team_id, 'slug' => (string) $row->team?->slug, 'name' => (string) $row->team?->profile?->name] : null;
        $data['entity_id'] = $entityId;
        $data['is_joined'] = $entityId ? (bool) Member::where('community_id', $row->id)->where('entity_id', $entityId)->find() : false;
        $data['is_muted'] = (bool) $mute;
        $data['mute_reason'] = $mute?->reason ?? '';
        $data['can_manage'] = $this->canManage($row, $actor);
        $data['team_available'] = !$row->team_id || (bool) $row->team?->is_valid;
        return $data;
    }

    public function listing(?int $teamId, bool $platform, ?array $actor, bool $mine, string $keyword, string $status, int $page, int $limit, bool $official = false): array
    {
        $q = Model::where('id', '>', 0);
        if ($platform) $q->where('owner_type', Owner::Platform->value);
        if ($official) $q->where('owner_type', Owner::Platform->value)->where('is_official', true);
        if ($teamId !== null) $q->where('owner_type', Owner::Team->value)->where('team_id', $teamId);
        if ($mine) $q->whereIn('id', Member::where('entity_id', $actor['entity_id'])->column('community_id'));
        if ($keyword !== '') $q->whereLike('name', '%' . $keyword . '%');
        if ($status !== '') $q->where('status', $this->status($status)->value);
        return $this->page($q->order('id', 'desc'), $page, $limit, fn ($row) => $this->data($row, $actor));
    }

    public function save(?Model $row, ?int $teamId, array $data): Model
    {
        if ($teamId !== null) $this->teamActive($teamId);
        $name = trim($data['name'] ?? ($row?->name ?? ''));
        $slug = strtolower(trim($data['slug'] ?? ($row?->slug ?? '')));
        if ($name === '' || mb_strlen($name) > 100 || !preg_match('/^[a-z][a-z0-9_-]{1,49}$/', $slug)) throw new HttpException(422, '社区名称或标识格式不正确');
        if (mb_strlen($data['description'] ?? ($row?->description ?? '')) > 10000) throw new HttpException(422, '社区简介超过长度限制');
        if (Model::where('slug', $slug)->where('id', '<>', $row?->id ?? 0)->find()) throw new HttpException(422, '社区标识已存在');
        $status = $this->status($data['status'] ?? ($row?->status ?? 'Active'));
        if ($status === Status::Paused && (!$row || $row->enumCase('status') !== Status::Paused)) $this->reason($data['reason'] ?? '');
        return Db::transaction(function () use ($row, $teamId, $data, $name, $slug, $status) {
            $create = !$row;
            $row ??= new Model;
            $values = ['name' => $name, 'slug' => $slug, 'description' => $data['description'] ?? ($row->description ?? ''), 'status' => $status];
            if ($teamId === null) $values['is_official'] = $data['is_official'] ?? ($row->is_official ?? false);
            if ($create) $values += ['owner_type' => $teamId === null ? Owner::Platform : Owner::Team, 'team_id' => $teamId, 'is_official' => false];
            $row->save($values);
            if ($create) Board::create(['community_id' => $row->id, 'name' => '讨论', 'sort' => 0, 'enabled' => true]);
            return $row;
        });
    }

    public function relation(Model $community, array $actor, string $kind, bool $enabled, int $postId = 0): void
    {
        Db::transaction(function () use ($community, $actor, $kind, $enabled, $postId) {
            $community = Model::where('id', $community->id)->lock(true)->find();
            if ($enabled) $this->interactive($community, $actor, $kind === 'like');
            $class = $kind === 'like' ? Like::class : Member::class;
            if ($kind === 'like') {
                $post = $enabled ? $this->visiblePost($community, $postId, $actor) : $this->resource(Post::class, $community, $postId);
                if ($enabled && $post->enumCase('status') !== ContentStatus::Visible) throw new HttpException(403, '帖子不能点赞');
            }
            $where = ['community_id' => $community->id, 'entity_id' => $actor['entity_id']];
            if ($kind === 'like') $where['post_id'] = $postId;
            $row = $class::where($where)->find();
            if ($enabled && !$row) $class::create($where);
            if (!$enabled && $row) $row->force()->delete();
        });
    }

    public function interactive(Model $community, array $actor, bool $joined = true, bool $mute = false): void
    {
        app(Entity::class)->subject($actor['entity_id']);
        if ($community->enumCase('status') !== Status::Active) throw new HttpException(403, '社区已暂停');
        if ($community->team_id) $this->teamActive((int) $community->team_id);
        if ($joined && !Member::where('community_id', $community->id)->where('entity_id', $actor['entity_id'])->find()) throw new HttpException(403, '请先加入社区');
        if ($mute && Mute::where('community_id', $community->id)->where('entity_id', $actor['entity_id'])->find()) throw new HttpException(403, '当前人员已被社区禁言');
    }

    public function resource(string $class, Model $community, int $id)
    {
        $row = $class::where('community_id', $community->id)->find($id);
        if (!$row) throw new HttpException(404, '社区资源不存在');
        return $row;
    }

    public function visiblePost(Model $community, int $id, ?array $actor): Post
    {
        $post = $this->resource(Post::class, $community, $id);
        if ($post->enumCase('status') === ContentStatus::Hidden && (int) $post->author_entity_id !== ($actor['entity_id'] ?? 0)) throw new HttpException(404, '帖子不存在');
        return $post;
    }

    public function contentData($row, ?array $actor, bool $manage = false): array
    {
        $data = $row->toArray();
        $data['author'] = $this->entityData((int) $row->author_entity_id);
        $data['can_edit'] = (int) $row->author_entity_id === ($actor['entity_id'] ?? 0) && $row->enumCase('status') !== ContentStatus::Deleted;
        if ($row->enumCase('status') === ContentStatus::Deleted) { $data['content'] = ''; if ($row instanceof Post) $data['title'] = '帖子已删除'; }
        if (!$manage && $row->enumCase('status') === ContentStatus::Hidden) $data['content'] = '';
        if ($row instanceof Post) {
            $data['like_count'] = Like::where('post_id', $row->id)->count();
            $data['comment_count'] = Comment::where('post_id', $row->id)->where('status', '<>', ContentStatus::Hidden->value)->count();
            $data['is_liked'] = $actor ? (bool) Like::where('post_id', $row->id)->where('entity_id', $actor['entity_id'])->find() : false;
        }
        return $data;
    }

    public function resources(Model $community, string $kind, ?array $actor, bool $manage, int $parent, int $board, string $keyword, int $page, int $limit): array
    {
        if ($kind === 'members') {
            $ids = array_values(array_unique(array_merge(Member::where('community_id', $community->id)->column('entity_id'), Mute::where('community_id', $community->id)->column('entity_id'))));
            return $this->page(\app\model\Entity::withTrashed()->whereIn('id', $ids)->order('id', 'desc'), $page, $limit, function ($entity) use ($community) {
                $member = Member::where('community_id', $community->id)->where('entity_id', $entity->id)->find();
                $mute = Mute::where('community_id', $community->id)->where('entity_id', $entity->id)->find();
                return ['entity_id' => (int) $entity->id, 'entity' => $this->entityData((int) $entity->id), 'community_id' => (int) $community->id, 'id' => (int) ($member?->id ?? $mute?->id), 'joined' => (bool) $member, 'muted' => (bool) $mute, 'reason' => $mute?->reason ?? '', 'create_time' => $member?->create_time ?? $mute?->create_time, 'update_time' => $member?->update_time ?? $mute?->update_time];
            });
        }
        $classes = ['boards' => Board::class, 'announcements' => Announcement::class, 'posts' => Post::class, 'comments' => Comment::class, 'members' => Member::class, 'administrators' => Administrator::class];
        $q = $classes[$kind]::where('community_id', $community->id);
        if ($kind === 'boards' && !$manage) $q->where('enabled', 1);
        if ($kind === 'announcements' && !$manage) $q->where('pinned', 1);
        if (in_array($kind, ['posts', 'comments'], true)) {
            if (!$manage) $q->where('status', '<>', ContentStatus::Hidden->value);
            if ($kind === 'comments') {
                if (!$manage || $parent > 0) {
                    $post = $manage ? $this->resource(Post::class, $community, $parent) : $this->visiblePost($community, $parent, $actor);
                    if (!$manage && $post->enumCase('status') === ContentStatus::Hidden) throw new HttpException(404, '帖子不存在');
                    $q->where('post_id', $parent);
                }
            }
            if ($kind === 'posts' && $board > 0) { $this->resource(Board::class, $community, $board); $q->where('board_id', $board); }
            if ($kind === 'posts' && $keyword !== '') $q->whereLike('title', '%' . $keyword . '%');
        }
        if ($kind === 'posts') $q->order('pinned', 'desc')->order('create_time', 'desc');
        $q->order($kind === 'boards' ? 'sort' : 'id', $kind === 'boards' ? 'asc' : 'desc');
        return $this->page($q, $page, $limit, function ($row) use ($kind, $actor, $community, $manage) {
            if (in_array($kind, ['posts', 'comments'], true)) return $this->contentData($row, $actor, $manage);
            $data = $row->toArray();
            if (in_array($kind, ['members', 'administrators'], true)) {
                $data['entity'] = $this->entityData((int) $row->entity_id);
                $mute = Mute::where('community_id', $community->id)->where('entity_id', $row->entity_id)->find();
                $data += ['joined' => (bool) Member::where('community_id', $community->id)->where('entity_id', $row->entity_id)->find(), 'muted' => (bool) $mute, 'reason' => $mute?->reason ?? ''];
            }
            return $data;
        });
    }

    public function writeContent(Model $community, array $actor, string $kind, int $id, int $parent, array $data, bool $delete = false): array
    {
        return Db::transaction(function () use ($community, $actor, $kind, $id, $parent, $data, $delete) {
            $community = Model::where('id', $community->id)->lock(true)->find();
            $class = $kind === 'post' ? Post::class : Comment::class;
            $row = $id ? $this->resource($class, $community, $id) : new $class;
            if ($id && (int) $row->author_entity_id !== $actor['entity_id']) throw new HttpException(403, '只能修改本人内容');
            if ($id && $row->enumCase('status') === ContentStatus::Deleted) throw new HttpException(409, '内容已删除');
            if ($delete) { $row->save(['content' => '', 'status' => ContentStatus::Deleted]); app(Markdown::class)->deleteSource($row, 'content'); return $this->contentData($row, $actor); }
            $this->interactive($community, $actor, true, true);
            $content = $this->text($data['content'] ?? '', 50000);
            $values = ['content' => $content];
            if ($kind === 'post') $values['title'] = $this->text($data['title'] ?? '', 200);
            if (!$id) {
                $values += ['community_id' => $community->id, 'author_entity_id' => $actor['entity_id'], 'status' => ContentStatus::Visible, 'hidden_reason' => ''];
                if ($kind === 'post') {
                    $board = $this->resource(Board::class, $community, $data['board_id']);
                    if (!$board->enabled) throw new HttpException(403, '板块已停用');
                    $values += ['board_id' => $board->id, 'pinned' => false];
                } else {
                    $post = $this->visiblePost($community, $parent, $actor);
                    if ($post->enumCase('status') !== ContentStatus::Visible) throw new HttpException(403, '帖子不能评论');
                    $values['post_id'] = $post->id;
                }
            }
            $row->save($values);
            app(Markdown::class)->sync($row, 'content', $content);
            return $this->contentData($row, $actor);
        });
    }

    public function saveBoard(Model $community, int $id, array $data): array
    {
        if ($data['sort'] < 0) throw new HttpException(422, '板块排序不能小于零');
        $row = $id ? $this->resource(Board::class, $community, $id) : new Board;
        $row->save(['community_id' => $community->id, 'name' => $this->text($data['name'], 100), 'sort' => $data['sort'], 'enabled' => $data['enabled']]);
        return $row->toArray();
    }

    public function saveAnnouncement(Model $community, int $id, array $data, ?array $actor): array
    {
        $row = $id ? $this->resource(Announcement::class, $community, $id) : new Announcement;
        $row->previousContent = (string) ($row->content ?? '');
        if (!$actor) app(FileUsage::class)->assertNoNewInternalReferences((string) ($row->content ?? ''), $data['content']);
        $row->save(['community_id' => $community->id, 'title' => $this->text($data['title'], 200), 'content' => $this->text($data['content'], 50000), 'pinned' => $data['pinned'], 'attachment_team_id' => $actor ? app(IdentitySession::class)->entityTeamId($actor['type'], $actor['id']) : ($row->attachment_team_id ?? null)]);
        app(Markdown::class)->sync($row, 'content', $data['content']);
        return $row->toArray();
    }

    public function moderate(Model $community, string $kind, int $id, ?bool $hidden, ?bool $pinned, string $reason): void
    {
        Db::transaction(function () use ($community, $kind, $id, $hidden, $pinned, $reason) {
        Model::where('id', $community->id)->lock(true)->find();
        $row = $this->resource($kind === 'post' ? Post::class : Comment::class, $community, $id);
        if ($row->enumCase('status') === ContentStatus::Deleted) throw new HttpException(409, '作者已删除内容');
        if ($hidden === null && ($kind !== 'post' || $pinned === null)) throw new HttpException(422, '请选择内容治理动作');
        $values = [];
        if ($hidden !== null) {
            if ($hidden) $reason = $this->reason($reason);
            $values += ['status' => $hidden ? ContentStatus::Hidden : ContentStatus::Visible, 'hidden_reason' => $hidden ? $reason : ''];
        }
        if ($kind === 'post' && $pinned !== null) $values['pinned'] = $pinned;
        $row->save($values);
        });
    }

    public function mute(Model $community, int $entityId, bool $muted, string $reason): void
    {
        if ($muted) { app(Entity::class)->subject($entityId); $reason = $this->reason($reason); }
        Db::transaction(function () use ($community, $entityId, $muted, $reason) {
            Model::where('id', $community->id)->lock(true)->find();
            $where = ['community_id' => $community->id, 'entity_id' => $entityId];
            $row = Mute::where($where)->find();
            if ($muted) { $row ??= new Mute; $row->save($where + ['reason' => $reason]); }
            elseif ($row) $row->force()->delete();
        });
    }

    public function administrator(Model $community, string $slug, int $entityId, bool $remove): void
    {
        if (!$remove) {
            $entity = \app\model\Entity::where('slug', $slug)->find();
            if (!$entity || !$entity->is_valid) throw new HttpException(422, '人员不存在或不可用');
            $entityId = (int) $entity->id;
        }
        Db::transaction(function () use ($community, $entityId, $remove) {
            Model::where('id', $community->id)->lock(true)->find();
            $where = ['community_id' => $community->id, 'entity_id' => $entityId];
            $row = Administrator::where($where)->find();
            if ($remove && !$row) throw new HttpException(404, '管理员不存在');
            if ($remove) $row->force()->delete();
            elseif (!$row) Administrator::create($where);
        });
    }

    public function entityData(int $id): ?array
    {
        $entity = \app\model\Entity::withTrashed()->find($id);
        return $entity ? ['id' => $id, 'slug' => $entity->slug, 'name' => $entity->name, 'avatar' => $entity->avatar, 'is_valid' => $entity->is_valid] : null;
    }

    private function page($query, int $page, int $limit, callable $map): array
    {
        [$page, $limit] = app(Pagination::class)->normalize($page, $limit);
        $total = (clone $query)->count();
        $list = array_map($map, $query->page($page, $limit)->select()->all());
        return compact('total', 'list', 'page', 'limit');
    }
    private function text(string $text, int $max): string
    {
        $text = trim($text);
        if ($text === '' || mb_strlen($text) > $max) throw new HttpException(422, '文本为空或超过长度限制');
        return $text;
    }
    private function reason(string $reason): string { return $this->text($reason, 500); }
    private function status(string $value): Status
    {
        return match ($value) { 'Active' => Status::Active, 'Paused' => Status::Paused, default => throw new HttpException(422, '社区状态不正确') };
    }
    private function teamActive(int $id): void
    {
        $team = \app\model\Team::find($id);
        if (!$team || !$team->is_valid) throw new HttpException(403, '团队不可用');
    }
}
