<?php
declare (strict_types = 1);

namespace app\team\controller;

use think\Request;

class Entity
{
    protected $middleware = ['JwtAuth', 'Context'];

    public function search(Request $request)
    {
        $result = app(\app\service\EntityIdentity::class)->search(
            (string) $request->get('keyword', ''),
            (int) $request->get('limit', 10),
            (int) $request->user_id
        );

        return success($result);
    }

    public function resolve(Request $request)
    {
        $slugs = $request->get('slugs', []);
        if (!is_array($slugs)) {
            $slugs = explode(',', (string) $slugs);
        }

        return success(app(\app\service\EntityIdentity::class)->resolve($slugs, (int) $request->user_id));
    }
}
