<?php
declare(strict_types=1);

namespace app\middleware;

use app\model\UserDevice;
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

        // 设备校验：如果 JWT 中携带了设备标识，检查设备是否仍然有效
        if (!empty($decoded->dvt)) {
            $device = UserDevice::where('user_id', $decoded->uid)
                ->where('device_token', $decoded->dvt)
                ->find();

            if (!$device) {
                throw new HttpException(401, '设备已被取消授权，请重新登录');
            }
        }

        // 将用户信息绑定到请求
        $request->jwt = $decoded;

        return $next($request);
    }
}
