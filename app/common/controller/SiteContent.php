<?php
declare(strict_types=1);

namespace app\common\controller;

final class SiteContent
{
    public function index()
    {
        return success(app(\app\service\SiteContent::class)->get(true))->header(['Cache-Control' => 'no-store']);
    }
}
