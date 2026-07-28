<?php
declare(strict_types=1);

namespace app\middleware;

use app\model\UserDevice;
use app\model\User;
use app\service\Jwt;
use Firebase\JWT\ExpiredException;
use think\exception\HttpException;
use think\Request;

/**
 * JWT 认证中间件
 * 校验 Token 有效性 + 设备存在性（被踢出的设备即时失效）
 */
class JwtAuth
{
    public function handle(Request $request, \Closure $next)
    {
        $token = $request->header('Authorization');

        if (empty($token)) {
            throw new HttpException(401, '缺少 Token');
        }

        // 去掉 Bearer 前缀
        if (str_starts_with($token, 'Bearer ')) {
            $token = substr($token, 7);
        }

        $jwt = app(Jwt::class);

        try {
            $decoded = $jwt->parseToken($token);
        } catch (ExpiredException $e) {
            throw new HttpException(401, 'Token 已过期');
        } catch (\Exception $e) {
            throw new HttpException(401, 'Token 无效');
        }

        $uid = is_numeric($decoded->uid ?? null) ? (int) $decoded->uid : 0;
        $deviceToken = is_string($decoded->dvt ?? null) ? (string) $decoded->dvt : '';
        if (($decoded->iss ?? null) !== config('jwt.iss')
            || $uid < 1
            || $deviceToken === ''
            || !is_numeric($decoded->iat ?? null)
            || !is_numeric($decoded->exp ?? null)) {
            throw new HttpException(401, 'Token 声明无效');
        }

        $device = UserDevice::where('user_id', $uid)
            ->where('device_token', $deviceToken)
            ->find();
        if (!$device || !User::find($uid)) {
            throw new HttpException(401, '设备已被取消授权，请重新登录');
        }

        $hasEntityClaim = isset($decoded->act) || isset($decoded->jti) || isset($decoded->aud);
        if ($hasEntityClaim) {
            $act = isset($decoded->act) ? (array) $decoded->act : [];
            if (($decoded->aud ?? '') !== 'lostsky' || !is_string($decoded->jti ?? null)
                || !preg_match('/^[a-f0-9]{48}$/', (string) $decoded->jti)
                || !in_array($act['type'] ?? null, ['team', 'teamMember', 'teamCustomer', 'teamVirtual'], true)
                || !is_numeric($act['id'] ?? null) || (int) $act['id'] < 1) {
                throw new HttpException(401, 'Entity identity token is invalid');
            }
            $request->entity_session = app(\app\service\IdentitySession::class)->session(
                $uid, $deviceToken, (string) $decoded->jti,
                (string) $act['type'], (int) $act['id']
            );
        }

        $request->jwt = $decoded;

        return $next($request);
    }
}
