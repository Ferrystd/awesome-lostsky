<?php
declare(strict_types=1);

namespace app\display\controller;

use app\service\Display as DisplayService;
use think\Request;

class Document
{
    public function index(Request $request)
    {
        $slug = trim((string) $request->get('entity_slug', ''));
        return success(app(DisplayService::class)->documents(
            (int) $request->team_id,
            $slug === '' ? null : $slug,
            (int) $request->get('page', 1),
            (int) $request->get('limit', 20)
        ));
    }

    public function get(Request $request)
    {
        return success(app(DisplayService::class)->document(
            (int) $request->team_id,
            (int) $request->get('id', 0)
        ));
    }
}
