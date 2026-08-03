<?php
declare(strict_types=1);

namespace app\team\controller;

use app\service\PermissionDictionary as Permissions;
use app\service\TeamMemberDeparture as DepartureService;
use think\Request;

class MemberDeparture
{
    protected $middleware = [
        'JwtAuth' => ['except' => []],
        'Context' => ['except' => []],
        'EntityType:team,teamMember,teamCustomer,teamVirtual' => ['only' => ['index', 'get', 'create', 'approve', 'reject']],
        'EntityType:teamMember' => ['only' => ['mine', 'apply', 'cancel']],
        'TeamAuth' => ['except' => []],
        'Permission:' . Permissions::TEAM_MEMBER_REMOVE => ['only' => ['index', 'get', 'create', 'approve', 'reject']],
    ];

    public function index(Request $request)
    {
        return success(app(DepartureService::class)->list(
            $request->team_id,
            [
                'status' => $request->get('status'),
                'member_id' => $request->get('member_id'),
            ],
            $request->get('page/d', 1),
            $request->get('limit/d', 20)
        ));
    }

    public function get(Request $request)
    {
        return success(app(DepartureService::class)->get(
            $request->team_id,
            $request->get('id/d', 0)
        ));
    }

    public function mine(Request $request)
    {
        $memberId = $this->directMemberId($request);
        return success(app(DepartureService::class)->mine($request->team_id, $memberId));
    }

    public function apply(Request $request)
    {
        $memberId = $this->directMemberId($request);
        $result = app(DepartureService::class)->apply(
            $request->team_id,
            $memberId,
            $request->entity_id
        );
        app(\app\service\BusinessAudit::class)->record(
            $request,
            'team',
            $result['status_code'] === 'approved' ? 'depart' : 'applyDeparture',
            'memberDeparture',
            (int) $result['id']
        );
        return success($result, $result['status_code'] === 'approved' ? '已完成离队' : '离队申请已提交');
    }

    public function create(Request $request)
    {
        $id = app(DepartureService::class)->create(
            $request->team_id,
            $request->post('member_id/d', 0),
            $request->entity_id
        );
        app(\app\service\BusinessAudit::class)->record($request, 'team', 'create', 'memberDeparture', $id);
        return success(['id' => $id], '离队申请已创建');
    }

    public function cancel(Request $request)
    {
        $memberId = $this->directMemberId($request);
        $id = $request->post('id/d', 0);
        app(DepartureService::class)->cancel(
            $request->team_id,
            $memberId,
            $id,
            $request->entity_id
        );
        app(\app\service\BusinessAudit::class)->record($request, 'team', 'cancel', 'memberDeparture', $id);
        return message('离队申请已取消');
    }

    public function approve(Request $request)
    {
        $id = $request->post('id/d', 0);
        $memberId = app(DepartureService::class)->approve($request->team_id, $id, $request->entity_id);
        app(\app\service\BusinessAudit::class)->record(
            $request,
            'team',
            'approve',
            'memberDeparture',
            $id,
            ['member_id' => $memberId]
        );
        return message('离队申请已批准');
    }

    public function reject(Request $request)
    {
        $id = $request->post('id/d', 0);
        app(DepartureService::class)->reject($request->team_id, $id, $request->entity_id);
        app(\app\service\BusinessAudit::class)->record($request, 'team', 'reject', 'memberDeparture', $id);
        return message('离队申请已拒绝');
    }

    private function directMemberId(Request $request): int
    {
        return app(DepartureService::class)->directMemberId(
            $request->team_id,
            $request->acting_entity ?? null,
            $request->entity_session ?? null,
            $request->authenticated_user_id
        );
    }
}
