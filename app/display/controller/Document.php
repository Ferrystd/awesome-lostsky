<?php
declare(strict_types=1);

namespace app\display\controller;

use app\service\Display as DisplayService;
use think\Request;

class Document
{
    public function index(Request $request)
    {
        $slug = trim($request->get('entity_slug/s', ''));
        return success(app(DisplayService::class)->documents(
            $request->team_id,
            $slug === '' ? null : $slug,
            $request->get('page/d', 1),
            $request->get('limit/d', 20)
        ));
    }

    public function get(Request $request)
    {
        return success(app(DisplayService::class)->document(
            $request->team_id,
            $request->get('id/d', 0)
        ));
    }
}
