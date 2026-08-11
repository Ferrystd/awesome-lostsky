<?php
declare(strict_types=1);

namespace app\team\controller;

use app\service\PermissionDictionary as Permissions;
use app\service\TeamCustomerManagement;
use think\Request;

class Customer
{
    protected $middleware = [
        'JwtAuth', 'Context',
        'EntityType:team,teamMember,teamCustomer,teamVirtual',
        'TeamAuth',
        'Permission:' . Permissions::TEAM_CUSTOMER_READ . ',' . Permissions::TEAM_CUSTOMER_MANAGE => ['only' => ['assignees']],
        'Permission:' . Permissions::TEAM_CUSTOMER_MANAGE => ['only' => ['update']],
    ];

    public function index(Request $request)
    {
        return success(app(TeamCustomerManagement::class)->listing(
            $request->team_id,
            $request->acting_entity,
            [
                'keyword' => $request->get('keyword/s', ''),
                'assignee_entity_id' => $request->get('assignee_entity_id'),
                'blocked' => $request->get('blocked'),
            ],
            $request->get('page/d', 1),
            $request->get('limit/d', 20)
        ));
    }

    public function get(Request $request)
    {
        return success(app(TeamCustomerManagement::class)->get(
            $request->team_id,
            $request->acting_entity,
            $request->route('id/d', 0)
        ));
    }

    public function assignees(Request $request)
    {
        return success(app(TeamCustomerManagement::class)->assignees($request->team_id));
    }

    public function update(Request $request)
    {
        $id = $request->route('id/d', 0);
        $data = [];
        foreach (['name', 'avatar', 'description', 'assignee_entity_id', 'is_blocked'] as $field) {
            if ($request->has($field, 'post')) {
                $data[$field] = $request->post($field);
            }
        }
        app(TeamCustomerManagement::class)->update($request->team_id, $id, $data);
        app(\app\service\BusinessAudit::class)->record(
            $request,
            'team',
            'update',
            'customer',
            $id,
            ['changed_fields' => array_keys($data), 'changed' => $data !== []]
        );
        return message('客户资料已更新');
    }
}
