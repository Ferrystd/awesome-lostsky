<?php
declare(strict_types=1);

namespace app\account\controller;

use app\service\EntitySelfManagement;
use think\Request;

class CurrentIdentity
{
    protected $middleware = [
        'JwtAuth',
        'Context',
        'EntityType:teamless,team,teamMember,teamCustomer,teamVirtual' => ['only' => ['current']],
        'EntityType:team,teamMember,teamCustomer,teamVirtual' => ['except' => ['current']],
    ];

    public function current(Request $request)
    {
        return success(app(EntitySelfManagement::class)->current($request->acting_entity ?? null));
    }

    public function profile(Request $request)
    {
        $fields = ['name', 'avatar', 'description', 'intro_image', 'intro_video', 'introduction_markdown'];
        $data = $request->only($fields, 'post');
        if ($request->has('assignee_entity_id', 'post')) {
            $data['assignee_entity_id'] = $request->post('assignee_entity_id');
        }
        app(EntitySelfManagement::class)->updateProfile(
            $request->acting_entity,
            $request->post('expected_entity_id/d', 0),
            $data
        );
        return message('当前实体资料已保存');
    }

    public function slug(Request $request)
    {
        return success(app(EntitySelfManagement::class)->claimSlug(
            $request->acting_entity,
            $request->post('expected_entity_id/d', 0),
            $request->post('slug/s', '')
        ), '对象标识已确定');
    }

    public function fields(Request $request)
    {
        app(EntitySelfManagement::class)->saveFields(
            $request->acting_entity,
            $request->post('expected_entity_id/d', 0),
            $request->post('values/a', [])
        );
        return message('对象字段已保存');
    }

    public function assignees(Request $request)
    {
        return success(app(EntitySelfManagement::class)->customerAssignees($request->acting_entity));
    }

    public function upload(Request $request)
    {
        $file = $request->file('file');
        if (!$file) {
            return error('请选择文件', 1, 422);
        }
        return success(app(EntitySelfManagement::class)->upload(
            $request->acting_entity,
            $request->post('expected_entity_id/d', 0),
            $file
        ), '上传成功');
    }
}
