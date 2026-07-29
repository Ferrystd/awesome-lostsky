<?php
declare(strict_types=1);

namespace app\display\controller;

use app\service\Display as DisplayService;
use think\Request;

class Entity
{
    public function index(Request $request)
    {
        $type = trim($request->get('type/s', ''));
        return success(app(DisplayService::class)->entities(
            $request->team_id,
            $type === '' ? null : $type,
            $request->get('page/d', 1),
            $request->get('limit/d', 20)
        ));
    }

    public function get(Request $request)
    {
        return success(app(DisplayService::class)->entity(
            $request->team_id,
            $request->get('slug/s', '')
        ));
    }

    public function resolve(Request $request)
    {
        $slugs = $request->get('slugs', []);
        if (!is_array($slugs)) {
            $slugs = explode(',', (string) $slugs);
        }

        return success(app(DisplayService::class)->resolve($slugs));
    }
}
