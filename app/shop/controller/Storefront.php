<?php
declare(strict_types=1);

namespace app\shop\controller;

use app\service\Storefront as StorefrontService;
use think\Request;

class Storefront
{
    public function index(Request $request)
    {
        return success(app(StorefrontService::class)->home($request->team_id));
    }

    public function products(Request $request)
    {
        return success(app(StorefrontService::class)->products(
            $request->team_id,
            $request->get('page/d', 1),
            $request->get('limit/d', 20)
        ));
    }

    public function product(Request $request)
    {
        return success(app(StorefrontService::class)->product(
            $request->team_id,
            $request->route('id/d', 0)
        ));
    }
}
