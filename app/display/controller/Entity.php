<?php
declare(strict_types=1);

namespace app\display\controller;

use app\service\Display as DisplayService;
use think\Request;

class Entity
{
    public function index(Request $request)
    {
        $type = trim((string) $request->get('type', ''));
        return success(app(DisplayService::class)->entities(
            (int) $request->team_id,
            $type === '' ? null : $type,
            (int) $request->get('page', 1),
            (int) $request->get('limit', 20)
        ));
    }

    public function get(Request $request)
    {
        return success(app(DisplayService::class)->entity(
            (int) $request->team_id,
            (string) $request->get('slug', '')
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
