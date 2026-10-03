<?php
declare(strict_types=1);

namespace app\chat\controller;

final class Block
{
    protected $middleware = ['JwtAuth', 'Context', 'EntityType:team,teamMember,teamCustomer,teamVirtual', 'EntityRequired'];
    public function index(\think\Request $request) { return success(app(\app\service\ChatBlock::class)->list($request->acting_entity)); }
    public function create(\think\Request $request) { app(\app\service\ChatBlock::class)->create($request->acting_entity, $request->post('expected_entity_id/d', 0), $request->post('entity_slug/s', '')); return message('已屏蔽该人员'); }
    public function delete(\think\Request $request) { app(\app\service\ChatBlock::class)->delete($request->acting_entity, $request->post('expected_entity_id/d', 0), $request->post('entity_slug/s', '')); return message('已取消屏蔽'); }
}
