<?php
declare(strict_types=1);

namespace app\weibo\controller;

use app\enum\WeiboOperationType;
use app\service\BusinessAudit;
use app\service\Entity;
use app\service\TeamAccess;
use app\service\WeiboAccounts;
use app\service\WeiboCommentPresets;
use app\service\WeiboFeed;
use app\service\WeiboMediaLibrary;
use app\service\WeiboOperations;
use app\service\WeiboProtocol;
use app\service\WeiboTasks;
use think\exception\HttpException;
use think\Request;

abstract class WorkspaceController
{
    abstract protected function teamScope(): bool;

    public function access(Request $request) { return success(app(TeamAccess::class)->snapshot($request->team_id, $request->acting_entity)); }
    public function accounts(Request $request) { return success(app(WeiboAccounts::class)->list($request->team_id, $request->entity_id, $this->teamScope())); }
    public function account(Request $request) { return success(app(WeiboAccounts::class)->detail($request->team_id, $request->entity_id, $request->route('id/d', 0), $this->teamScope())); }
    public function loginStart(Request $request) { $this->expected($request); return success(app(WeiboAccounts::class)->start($request->team_id, $this->resourceEntityId($request), $request->post('phone/s', ''))); }
    public function loginConfirm(Request $request) { $this->expected($request); $result = app(WeiboAccounts::class)->confirm($request->team_id, $this->resourceEntityId($request), $request->post('challenge_id/s', ''), $request->post('code/s', '')); app(BusinessAudit::class)->record($request, 'weibo', 'bind', 'weiboAccount', $result['id']); return success($result, '账号已绑定'); }
    public function accountCheck(Request $request) { $this->expected($request); return success(app(WeiboAccounts::class)->check($request->team_id, $this->resourceEntityId($request), $request->route('id/d', 0), $this->teamScope())); }
    public function unbind(Request $request) { $this->expected($request); $id = $request->route('id/d', 0); app(WeiboAccounts::class)->unbind($request->team_id, $request->entity_id, $id, $this->teamScope()); app(BusinessAudit::class)->record($request, 'weibo', 'unbind', 'weiboAccountBinding', $id); return message('已解除绑定'); }

    public function mediaUpload(Request $request)
    {
        $this->expected($request); $file = $request->file('file');
        if (!$file) throw new HttpException(422, '请选择图片');
        return success(app(WeiboMediaLibrary::class)->upload($request->team_id, $this->resourceEntityId($request), $request->post('account_id/d', 0), $this->teamScope(), $file));
    }

    public function mediaContent(Request $request)
    {
        $image = app(WeiboMediaLibrary::class)->content($request->team_id, $request->entity_id, $request->route('id/d', 0), $this->teamScope());
        return response($image['content'], 200, ['Content-Type' => $image['content_type'], 'Cache-Control' => 'private, max-age=300']);
    }

    public function post(Request $request) { return $this->manual($request, WeiboOperationType::Post); }
    public function like(Request $request) { return $this->manual($request, WeiboOperationType::Like); }
    public function comment(Request $request) { return $this->manual($request, WeiboOperationType::Comment); }

    public function tasks(Request $request) { return success(app(WeiboTasks::class)->list($request->team_id, $request->entity_id, $this->teamScope())); }
    public function task(Request $request) { return success(app(WeiboTasks::class)->get($request->team_id, $request->entity_id, $request->route('id/d', 0), $this->teamScope())); }
    public function taskCreate(Request $request) { $this->expected($request); $result = app(WeiboTasks::class)->create($request->team_id, $request->entity_id, $this->teamScope() ? null : $request->entity_id, $this->taskInput($request)); app(BusinessAudit::class)->record($request, 'weibo', 'create', 'weiboTask', $result['id']); return success($result); }
    public function taskEdit(Request $request) { $this->expected($request); $id = $request->route('id/d', 0); $result = app(WeiboTasks::class)->edit($request->team_id, $request->entity_id, $id, $this->teamScope(), $this->taskInput($request, true)); app(BusinessAudit::class)->record($request, 'weibo', 'edit', 'weiboTask', $id, ['expected_version' => $request->post('expected_version/d', 0)]); return success($result); }
    public function taskPause(Request $request) { return $this->transition($request, 'pause'); }
    public function taskStart(Request $request) { return $this->transition($request, 'start'); }
    public function taskResume(Request $request) { return $this->transition($request, 'resume'); }
    public function taskCancel(Request $request) { return $this->transition($request, 'cancel'); }
    public function operations(Request $request) { return success(app(WeiboOperations::class)->list($request->team_id, $request->entity_id, $this->teamScope(), $request->get('page/d', 1), $request->get('limit/d', 20))); }

    public function feed(Request $request)
    {
        return success(app(WeiboFeed::class)->list(
            $request->team_id,
            $request->acting_entity,
            $request->get('page/d', 1),
            $request->get('limit/d', 20)
        ));
    }

    public function commentPresets(Request $request)
    {
        $service = app(WeiboCommentPresets::class);
        return success($this->teamScope()
            ? $service->teamList($request->team_id)
            : $service->personalList($request->team_id, $request->entity_id));
    }

    public function commentPresetsReplace(Request $request)
    {
        $this->expected($request);
        $service = app(WeiboCommentPresets::class);
        $contents = $request->post('contents/a', []);
        $result = $this->teamScope()
            ? $service->replaceTeam($request->team_id, $contents)
            : $service->replacePersonal($request->team_id, $request->entity_id, $contents);
        app(BusinessAudit::class)->record($request, 'weibo', 'replace', 'weiboCommentPreset', null, ['count' => count($contents), 'scope' => $this->teamScope() ? 'team' : 'personal']);
        return success($result);
    }

    public function feedComment(Request $request)
    {
        $this->expected($request);
        $postId = $request->route('id/d', 0);
        $result = app(WeiboFeed::class)->comment(
            $request->team_id,
            $request->entity_id,
            $postId,
            $request->post('account_id/d', 0),
            $request->post('comment/s', '')
        );
        app(BusinessAudit::class)->record($request, 'weibo', 'comment', 'weiboFeedPost', $postId, ['result' => $result['status']]);
        return success($result);
    }

    private function manual(Request $request, WeiboOperationType $type)
    {
        $this->expected($request);
        $payload = ['comment' => $request->post('comment/s', ''), 'content' => $request->post('content/s', ''), 'media_ids' => $this->integerIds($request->post('media_ids/a', []), '媒体')];
        if ($type === WeiboOperationType::Post) {
            $payload['topic'] = app(WeiboProtocol::class)->resolveSupertopic($request->post('topic/s', ''));
        } else {
            $payload['status_id'] = app(WeiboProtocol::class)->statusIdFromUrl($request->post('status_url/s', ''));
        }
        $result = app(WeiboOperations::class)->execute($request->team_id, $this->teamScope() ? null : $request->entity_id, $request->entity_id, $request->post('account_id/d', 0), $type, $payload);
        app(BusinessAudit::class)->record($request, 'weibo', strtolower($type->name), 'weiboOperation', $result['id'], ['operation_type' => $type->name, 'result' => $result['status']]);
        return success($result);
    }

    private function transition(Request $request, string $action)
    {
        $this->expected($request); $id = $request->route('id/d', 0);
        $result = app(WeiboTasks::class)->transition($request->team_id, $request->entity_id, $id, $this->teamScope(), $action);
        app(BusinessAudit::class)->record($request, 'weibo', $action, 'weiboTask', $id);
        return success($result);
    }

    private function expected(Request $request): void
    {
        if (!$this->teamScope() && $request->post('expected_entity_id/d', 0) !== $request->entity_id) throw new HttpException(409, '当前 Entity 已变更，请刷新后重试');
    }

    private function resourceEntityId(Request $request): int
    {
        if (!$this->teamScope()) return $request->entity_id;
        return app(Entity::class)->idBySubject('team', $request->team_id);
    }

    private function taskInput(Request $request, bool $editing = false): array
    {
        $data = [
            'operation_type' => $request->post('operation_type/s', ''),
            'topic' => $request->post('topic/s', ''),
            'content' => $request->post('content/s', ''),
            'account_ids' => $this->integerIds($request->post('account_ids/a', []), '账号'),
            'media_ids' => $this->integerIds($request->post('media_ids/a', []), '媒体'),
            'start_at' => $request->post('start_at/d', 0),
            'min_interval' => $request->post('min_interval/d', 0),
            'max_interval' => $request->post('max_interval/d', 0),
        ];
        if ($editing) $data['expected_version'] = $request->post('expected_version/d', 0);
        return $data;
    }

    /** @return list<int> */
    private function integerIds(array $values, string $label): array
    {
        foreach ($values as $id) if (!is_int($id) || $id < 1) throw new HttpException(422, "{$label}参数无效");
        return array_values(array_unique($values));
    }
}
