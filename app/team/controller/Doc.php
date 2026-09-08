<?php
declare(strict_types=1);

namespace app\team\controller;

use app\service\Document as DocumentService;
use think\Request;

class Doc
{
    protected $middleware = [
        'JwtAuth', 'Context', 'EntityType:team,teamMember,teamCustomer,teamVirtual',
        'TeamWorkspaceAuth', 'Ability:doc',
    ];

    public function index(Request $request)
    {
        $teamEntityId = (int) app(\app\service\Entity::class)
            ->requireBySubject('team', $request->team_id)->id;
        $result = app(DocumentService::class)->list(
            $request->get('entity_id/d', $teamEntityId),
            [
                'manager_scope' => $request->get('manager_scope'),
                'visibility' => $request->get('visibility'),
                'keyword' => $request->get('keyword'),
            ],
            $request->get('page/d', 1),
            $request->get('limit/d', 20),
            $request->team_id,
            $request->acting_entity
        );
        return success($result);
    }

    public function get(Request $request)
    {
        return success(app(DocumentService::class)->get(
            $request->get('id/d', 0),
            $request->team_id,
            $request->acting_entity
        ));
    }

    public function create(Request $request)
    {
        $input = $this->input($request);
        $teamEntityId = (int) app(\app\service\Entity::class)
            ->requireBySubject('team', $request->team_id)->id;
        $id = app(DocumentService::class)->create(
            (int) ($input['entity_id'] ?? $teamEntityId),
            [
                'title' => $input['title'] ?? '',
                'content' => $input['content'] ?? null,
                'manager_scope' => $input['manager_scope'] ?? null,
                'visibility' => $input['visibility'] ?? null,
                'visibility_targets' => $input['visibility_targets'] ?? [],
                'sort' => (int) ($input['sort'] ?? 0),
                'tags' => array_key_exists('tags', $input) ? $input['tags'] : [],
            ],
            $request->team_id,
            $request->acting_entity
        );
        app(\app\service\BusinessAudit::class)->record($request, 'team', 'create', 'document', $id);
        return success(['id' => $id], '文档已创建');
    }

    public function edit(Request $request)
    {
        $input = $this->input($request);
        $data = [];
        foreach (['title', 'content', 'manager_scope', 'visibility', 'visibility_targets', 'sort', 'tags'] as $field) {
            if (array_key_exists($field, $input)) {
                $data[$field] = $input[$field];
            }
        }
        $id = (int) ($input['id'] ?? 0);
        app(DocumentService::class)->edit(
            $id,
            $data,
            $request->team_id,
            $request->acting_entity
        );
        app(\app\service\BusinessAudit::class)->record($request, 'team', 'update', 'document', $id);
        return message('文档已更新');
    }

    public function delete(Request $request)
    {
        $input = $this->input($request);
        $id = (int) ($input['id'] ?? 0);
        app(DocumentService::class)->delete(
            $id,
            $request->team_id,
            $request->acting_entity
        );
        app(\app\service\BusinessAudit::class)->record($request, 'team', 'delete', 'document', $id);
        return message('文档已删除');
    }

    private function input(Request $request): array
    {
        $input = $request->post();
        $json = json_decode($request->getContent(), true);
        return is_array($json) ? array_merge($input, $json) : $input;
    }
}
