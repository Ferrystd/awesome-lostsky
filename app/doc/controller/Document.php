<?php
declare(strict_types=1);

namespace app\doc\controller;

use app\service\Document as DocumentService;
use think\Request;

class Document
{
    protected $middleware = [
        'JwtAuth'      => ['except' => []],
        'Context'      => ['except' => []],
        'MemberAccess' => ['except' => []],
        'DocAbility'   => ['except' => []],
    ];

    public function index(Request $request)
    {
        $service    = app(DocumentService::class);
        $targetType = $request->get('target_type', 'team');
        $targetId   = (int) $request->get('target_id', $request->team_id);
        $result     = $service->list($targetType, $targetId, [
            'scope'   => $request->get('scope'),
            'keyword' => $request->get('keyword'),
        ], (int) $request->get('page', 1), (int) $request->get('limit', 20), (int) $request->team_id);

        return success($result);
    }

    public function get(Request $request)
    {
        $id      = (int) $request->param('id', 0);
        $service = app(DocumentService::class);
        $result  = $service->get($id, (int) $request->team_id);

        return success($result);
    }

    public function create(Request $request)
    {
        $service    = app(DocumentService::class);
        $targetType = $request->post('target_type', 'team');
        $targetId   = (int) $request->post('target_id', $request->team_id);
        $id         = $service->create($targetType, $targetId, (int) $request->post('scope', 1), [
            'title'   => $request->post('title', ''),
            'content' => $request->post('content', null),
            'sort'    => (int) $request->post('sort', 0),
        ], (int) $request->team_id);

        return success(['id' => $id], '文档已创建');
    }

    public function edit(Request $request)
    {
        $id      = (int) $request->param('id', 0);
        $service = app(DocumentService::class);

        $data = [];
        foreach (['title', 'content', 'scope', 'sort'] as $field) {
            if ($request->has($field, 'post')) {
                $data[$field] = $request->post($field);
            }
        }

        $service->edit($id, $data, (int) $request->team_id);

        return message('文档已更新');
    }

    public function delete(Request $request)
    {
        $id      = (int) $request->param('id', 0);
        $service = app(DocumentService::class);
        $service->delete($id, (int) $request->team_id);

        return message('文档已删除');
    }
}
