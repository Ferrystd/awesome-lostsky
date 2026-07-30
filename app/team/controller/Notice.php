<?php
declare(strict_types=1);

namespace app\team\controller;

use app\service\Notice as NoticeService;
use app\service\PermissionDictionary as Permissions;
use app\service\PermissionGate;
use think\exception\HttpException;
use think\Request;

class Notice
{
    protected $middleware = [
        'JwtAuth', 'Context', 'EntityType:team,teamMember,teamCustomer,teamVirtual',
        'TeamAuth',
        'Permission:' . Permissions::TEAM_NOTICE_SEND => ['only' => ['send']],
    ];

    public function index(Request $request)
    {
        $service = app(NoticeService::class);
        $scope = $this->scope($request);
        $filters = [
            'is_read' => $request->get('is_read', ''),
            'keyword' => $request->get('keyword', ''),
        ];
        $result = $scope === 'team'
            ? $service->list(
                $request->team_id,
                $filters,
                $request->get('page/d', 1),
                $request->get('limit/d', 20)
            )
            : $service->listForEntity(
                $request->entity_id,
                $filters,
                $request->get('page/d', 1),
                $request->get('limit/d', 20)
            );
        $result['can_send'] = app(PermissionGate::class)->allows(
            $request->team_id,
            $request->acting_entity,
            [Permissions::TEAM_NOTICE_SEND]
        );

        return success($result);
    }

    public function get(Request $request)
    {
        $service = app(NoticeService::class);
        $result = $this->scope($request) === 'team'
            ? $service->get($request->team_id, $request->get('id/d', 0))
            : $service->getForEntity($request->entity_id, $request->get('id/d', 0));

        return success($result);
    }

    public function capabilities(Request $request)
    {
        $gate = app(PermissionGate::class);
        $canReadTeam = $gate->allows(
            $request->team_id,
            $request->acting_entity,
            [Permissions::TEAM_NOTICE_READ]
        );
        $canSend = $gate->allows(
            $request->team_id,
            $request->acting_entity,
            [Permissions::TEAM_NOTICE_SEND]
        );

        return success([
            'can_read_team' => $canReadTeam,
            'can_send' => $canSend,
            'default_scope' => $this->isTeam($request) && $canReadTeam ? 'team' : 'entity',
        ]);
    }

    public function send(Request $request)
    {
        $result = app(NoticeService::class)->sendToEntity(
            $request->team_id,
            $request->post('entity_id/d', 0),
            $request->post('title/s', ''),
            $request->post('content') === null ? null : $request->post('content/s'),
            $request->post('is_pinned/b', false)
        );

        app(\app\service\BusinessAudit::class)->record(
            $request,
            'team',
            'create',
            'notice',
            (int) $result['id']
        );

        return success($result, '通知已发送');
    }

    public function confirm(Request $request)
    {
        $service = app(NoticeService::class);
        $scope = $this->scope($request);
        if ($scope === 'team') {
            $service->confirm($request->team_id, $request->post('id/d', 0));
        } else {
            $service->confirmForEntity($request->entity_id, $request->post('id/d', 0));
        }

        return message($scope === 'team' ? '站内通知已标记为已读' : '通知已标记为已读');
    }

    public function confirmAll(Request $request)
    {
        $service = app(NoticeService::class);
        $scope = $this->scope($request);
        $count = $scope === 'team'
            ? $service->confirmAll($request->team_id)
            : $service->confirmAllForEntity($request->entity_id);

        return success(
            ['count' => $count],
            $scope === 'team' ? '站内通知已全部标记为已读' : '通知已全部标记为已读'
        );
    }

    public function receive(Request $request)
    {
        $service = app(NoticeService::class);
        if ($this->scope($request) === 'team') {
            $service->receive($request->team_id, $request->post('id/d', 0));
        } else {
            $service->receiveForEntity($request->entity_id, $request->post('id/d', 0));
        }

        return message('站内通知资产已收取');
    }

    public function receiveAll(Request $request)
    {
        $service = app(NoticeService::class);
        if ($this->scope($request) === 'team') {
            $service->receiveAll($request->team_id);
        } else {
            $service->receiveAllForEntity($request->entity_id);
        }

        return message('站内通知资产已全部收取');
    }

    private function isTeam(Request $request): bool
    {
        return ($request->acting_entity['type'] ?? '') === 'team';
    }

    private function scope(Request $request): string
    {
        $scope = trim((string) (
            $request->isGet()
                ? $request->get('scope', '')
                : $request->post('scope', '')
        ));
        if ($scope === '') {
            $scope = $this->isTeam($request) ? 'team' : 'entity';
        }
        if (!in_array($scope, ['team', 'entity'], true)) {
            throw new HttpException(422, '通知收件箱 scope 必须为 team 或 entity');
        }
        if ($scope === 'team') {
            app(PermissionGate::class)->assert(
                $request->team_id,
                $request->acting_entity,
                [Permissions::TEAM_NOTICE_READ]
            );
        }

        return $scope;
    }
}
