<?php
declare(strict_types=1);

namespace app\shop\controller;

use app\service\Storefront as StorefrontService;
use think\Request;

class Storefront
{
    public function index(Request $request)
    {
        return success(app(StorefrontService::class)->home((int) $request->team_id));
    }

    public function products(Request $request)
    {
        return success(app(StorefrontService::class)->products(
            (int) $request->team_id,
            (int) $request->get('page', 1),
            (int) $request->get('limit', 20)
        ));
    }

    public function product(Request $request)
    {
        return success(app(StorefrontService::class)->product(
            (int) $request->team_id,
            (int) $request->param('id', 0)
        ));
    }
}
