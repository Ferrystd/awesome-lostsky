<?php
declare(strict_types=1);

namespace app\team\controller;

use app\service\Notice as NoticeService;
use app\service\PermissionDictionary as Permissions;
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
        $filters = [
            'is_read' => $request->get('is_read', ''),
            'keyword' => $request->get('keyword', ''),
        ];
        $result = $this->isTeam($request)
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
        $result['can_send'] = app(\app\service\PermissionGate::class)->allows(
            $request->team_id,
            $request->acting_entity,
            [Permissions::TEAM_NOTICE_SEND]
        );

        return success($result);
    }

    public function get(Request $request)
    {
        $service = app(NoticeService::class);
        $result = $this->isTeam($request)
            ? $service->get($request->team_id, $request->get('id/d', 0))
            : $service->getForEntity($request->entity_id, $request->get('id/d', 0));

        return success($result);
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
        if ($this->isTeam($request)) {
            $service->confirm($request->team_id, $request->post('id/d', 0));
        } else {
            $service->confirmForEntity($request->entity_id, $request->post('id/d', 0));
        }

        return message('站内信已确认');
    }

    public function confirmAll(Request $request)
    {
        $service = app(NoticeService::class);
        $count = $this->isTeam($request)
            ? $service->confirmAll($request->team_id)
            : $service->confirmAllForEntity($request->entity_id);

        return success(['count' => $count], '站内信已全部确认');
    }

    public function receive(Request $request)
    {
        $service = app(NoticeService::class);
        if ($this->isTeam($request)) {
            $service->receive($request->team_id, $request->post('id/d', 0));
        } else {
            $service->receiveForEntity($request->entity_id, $request->post('id/d', 0));
        }

        return message('站内信资产已收取');
    }

    public function receiveAll(Request $request)
    {
        $service = app(NoticeService::class);
        if ($this->isTeam($request)) {
            $service->receiveAll($request->team_id);
        } else {
            $service->receiveAllForEntity($request->entity_id);
        }

        return message('站内信资产已全部收取');
    }

    private function isTeam(Request $request): bool
    {
        return ($request->acting_entity['type'] ?? '') === 'team';
    }
}
