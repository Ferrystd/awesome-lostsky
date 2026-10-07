<?php
declare(strict_types=1);
namespace app\community\controller;
use think\Request;
final class Manage extends \app\controller\CommunityManagement
{
    protected $middleware = ['JwtAuth', 'Context', 'EntityRequired'];
    protected function authorize(Request $request, string $operation): ?int { return null; }
    protected function application(): string { return 'community'; }
}
