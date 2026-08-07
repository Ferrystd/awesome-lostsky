<?php
declare(strict_types=1);

namespace app\team\controller;

use app\service\EntitySelfManagement;
use think\Request;

final class Personal
{
    protected $middleware = [
        'JwtAuth', 'Context', 'EntityType:team,teamMember,teamVirtual', 'TeamAuth',
    ];

    public function current(Request $request)
    {
        return success(app(EntitySelfManagement::class)->current($request->acting_entity));
    }

    public function profile(Request $request)
    {
        app(EntitySelfManagement::class)->updateProfile(
            $request->acting_entity,
            $request->post('expected_entity_id/d', 0),
            $request->only(['name', 'avatar', 'description', 'intro_image', 'intro_video', 'introduction_markdown'], 'post')
        );
        return message('个人资料已保存');
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

    public function upload(Request $request)
    {
        $file = $request->file('file');
        if (!$file) return error('请选择文件', 1, 422);
        return success(app(EntitySelfManagement::class)->upload(
            $request->acting_entity,
            $request->post('expected_entity_id/d', 0),
            $file
        ), '上传成功');
    }
}
