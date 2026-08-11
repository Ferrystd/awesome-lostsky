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
        $data = $request->only(['name', 'avatar', 'description', 'intro_image', 'intro_video', 'introduction_markdown'], 'post');
        app(EntitySelfManagement::class)->updateProfile(
            $request->acting_entity,
            $request->post('expected_entity_id/d', 0),
            $data
        );
        app(\app\service\BusinessAudit::class)->record(
            $request,
            'team',
            'update',
            'entity',
            $request->entity_id,
            ['changed_fields' => array_keys($data), 'changed' => $data !== []]
        );
        return message('个人资料已保存');
    }

    public function slug(Request $request)
    {
        $result = app(EntitySelfManagement::class)->claimSlug(
            $request->acting_entity,
            $request->post('expected_entity_id/d', 0),
            $request->post('slug/s', '')
        );
        app(\app\service\BusinessAudit::class)->record(
            $request,
            'team',
            'setSlug',
            'entity',
            $request->entity_id,
            ['changed_fields' => ['slug']]
        );
        return success($result, '对象标识已确定');
    }

    public function fields(Request $request)
    {
        $values = $request->post('values/a', []);
        app(EntitySelfManagement::class)->saveFields(
            $request->acting_entity,
            $request->post('expected_entity_id/d', 0),
            $values
        );
        app(\app\service\BusinessAudit::class)->record(
            $request,
            'team',
            'save',
            'entityFieldValues',
            $request->entity_id,
            ['changed_fields' => array_map('strval', array_keys($values)), 'changed' => $values !== []]
        );
        return message('对象字段已保存');
    }

    public function upload(Request $request)
    {
        $file = $request->file('file');
        if (!$file) return error('请选择文件', 1, 422);
        $result = app(EntitySelfManagement::class)->upload(
            $request->acting_entity,
            $request->post('expected_entity_id/d', 0),
            $file
        );
        app(\app\service\BusinessAudit::class)->record(
            $request,
            'team',
            'upload',
            'file',
            (int) ($result['id'] ?? 0),
            ['changed_fields' => ['file']]
        );
        return success($result, '上传成功');
    }
}
