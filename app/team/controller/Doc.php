<?php
declare(strict_types=1);

namespace app\team\controller;

use app\service\Document as DocumentService;
use think\exception\HttpException;
use think\Request;

class Doc
{
    protected $middleware = ['JwtAuth', 'Context', 'MemberAccess', 'DocAbility'];

    public function __call($name, $arguments)
    {
        if (ctype_digit((string) $name)) {
            $request = app('request');
            $service = app(DocumentService::class);
            $id      = (int) $name;

            if ($request->method(true) === 'GET') {
                return success($service->get($id, (int) $request->team_id, (int) $request->user_id, (int) $request->member_id));
            }

            if ($request->method(true) === 'POST') {
                $input = $this->input($request);
                $data  = [];
                foreach (['title', 'content', 'manager_scope', 'visibility', 'visibility_targets', 'sort'] as $field) {
                    if (array_key_exists($field, $input)) {
                        $data[$field] = $input[$field];
                    }
                }

                $service->edit($id, $data, (int) $request->team_id, (int) $request->user_id, (int) $request->member_id);
                return message('文档已更新');
            }
        }

        throw new HttpException(404, '文档接口不存在');
    }

    public function index(Request $request)
    {
        if ($request->method(true) === 'POST') {
            return $this->create($request);
        }

        $service    = app(DocumentService::class);
        $targetType = $request->get('target_type', 'team');
        $targetId   = (int) $request->get('target_id', $request->team_id);
        $result     = $service->list($targetType, $targetId, [
            'manager_scope' => $request->get('manager_scope'),
            'visibility'    => $request->get('visibility'),
            'keyword'       => $request->get('keyword'),
        ], (int) $request->get('page', 1), (int) $request->get('limit', 20), (int) $request->team_id, (int) $request->user_id, (int) $request->member_id);

        return success($result);
    }

    public function get(Request $request)
    {
        if ($request->method(true) === 'POST') {
            return $this->edit($request);
        }

        $service = app(DocumentService::class);
        $result  = $service->get((int) $request->param('id', 0), (int) $request->team_id, (int) $request->user_id, (int) $request->member_id);

        return success($result);
    }

    public function create(Request $request)
    {
        $input      = $this->input($request);
        $service    = app(DocumentService::class);
        $targetType = $input['target_type'] ?? 'team';
        $targetId   = (int) ($input['target_id'] ?? $request->team_id);
        $id         = $service->create($targetType, $targetId, [
            'title'              => $input['title'] ?? '',
            'content'            => $input['content'] ?? null,
            'manager_scope'      => $input['manager_scope'] ?? null,
            'visibility'         => $input['visibility'] ?? null,
            'visibility_targets' => $input['visibility_targets'] ?? [],
            'sort'               => (int) ($input['sort'] ?? 0),
        ], (int) $request->team_id, (int) $request->user_id, (int) $request->member_id);

        return success(['id' => $id], '文档已创建');
    }

    public function edit(Request $request)
    {
        $input = $this->input($request);
        $input['id'] = $input['id'] ?? $request->param('id', 0);
        $data = [];
        foreach (['title', 'content', 'manager_scope', 'visibility', 'visibility_targets', 'sort'] as $field) {
            if (array_key_exists($field, $input)) {
                $data[$field] = $input[$field];
            }
        }

        $service = app(DocumentService::class);
        $service->edit((int) ($input['id'] ?? 0), $data, (int) $request->team_id, (int) $request->user_id, (int) $request->member_id);

        return message('文档已更新');
    }

    public function delete(Request $request)
    {
        $input   = $this->input($request);
        $input['id'] = $input['id'] ?? $request->param('id', 0);
        $service = app(DocumentService::class);
        $service->delete((int) ($input['id'] ?? 0), (int) $request->team_id, (int) $request->user_id, (int) $request->member_id);

        return message('文档已删除');
    }

    public function deleteLegacy(Request $request)
    {
        return $this->delete($request);
    }

    private function input(Request $request): array
    {
        $input = $request->param();
        $json  = json_decode((string) $request->getContent(), true);

        if (is_array($json)) {
            $input = array_merge($input, $json);
        }

        return $input;
    }
}
