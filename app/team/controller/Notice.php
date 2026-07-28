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
                (int) $request->team_id,
                $filters,
                (int) $request->get('page', 1),
                (int) $request->get('limit', 20)
            )
            : $service->listForEntity(
                (int) $request->entity_id,
                $filters,
                (int) $request->get('page', 1),
                (int) $request->get('limit', 20)
            );
        $result['can_send'] = app(\app\service\PermissionGate::class)->allows(
            (int) $request->team_id,
            $request->acting_entity,
            [Permissions::TEAM_NOTICE_SEND]
        );

        return success($result);
    }

    public function get(Request $request)
    {
        $service = app(NoticeService::class);
        $result = $this->isTeam($request)
            ? $service->get((int) $request->team_id, (int) $request->param('id', 0))
            : $service->getForEntity((int) $request->entity_id, (int) $request->param('id', 0));

        return success($result);
    }

    public function send(Request $request)
    {
        $result = app(NoticeService::class)->sendToEntity(
            (int) $request->team_id,
            (int) $request->post('entity_id', 0),
            (string) $request->post('title', ''),
            $request->post('content') === null ? null : (string) $request->post('content'),
            (bool) $request->post('is_pinned', false)
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
            $service->confirm((int) $request->team_id, (int) $request->post('id', 0));
        } else {
            $service->confirmForEntity((int) $request->entity_id, (int) $request->post('id', 0));
        }

        return message('站内信已确认');
    }

    public function confirmAll(Request $request)
    {
        $service = app(NoticeService::class);
        $count = $this->isTeam($request)
            ? $service->confirmAll((int) $request->team_id)
            : $service->confirmAllForEntity((int) $request->entity_id);

        return success(['count' => $count], '站内信已全部确认');
    }

    public function receive(Request $request)
    {
        $service = app(NoticeService::class);
        if ($this->isTeam($request)) {
            $service->receive((int) $request->team_id, (int) $request->post('id', 0));
        } else {
            $service->receiveForEntity((int) $request->entity_id, (int) $request->post('id', 0));
        }

        return message('站内信资产已收取');
    }

    public function receiveAll(Request $request)
    {
        $service = app(NoticeService::class);
        if ($this->isTeam($request)) {
            $service->receiveAll((int) $request->team_id);
        } else {
            $service->receiveAllForEntity((int) $request->entity_id);
        }

        return message('站内信资产已全部收取');
    }

    private function isTeam(Request $request): bool
    {
        return (string) ($request->acting_entity['type'] ?? '') === 'team';
    }
}
