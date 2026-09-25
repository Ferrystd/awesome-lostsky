<?php
declare(strict_types=1);

namespace app\service;

use app\model\User;
use think\exception\HttpException;
use think\facade\Db;

class MemberJoinCode
{
    /**
     * 为真实登录用户生成一次性入队码，替换旧码，30 分钟有效。
     */
    public function issue(int $userId): array
    {
        return Db::transaction(function () use ($userId): array {
            $user = User::where('id', $userId)->lock(true)->find();
            if (!$user || $user->is_banned) {
                throw new HttpException(403, '当前账号不可生成入队码');
            }

            $code = strtoupper(bin2hex(random_bytes(10)));
            $expiresAt = time() + 1800;
            $user->save([
                'member_join_code_hash' => hash('sha256', $code),
                'member_join_code_expires_at' => $expiresAt,
            ]);

            return ['code' => $code, 'expires_at' => $expiresAt];
        });
    }

    /**
     * 以个人入队码添加成员；成功创建和消费同事务，失败保留原码。
     */
    public function addMember(int $teamId, string $code, ?array $joinForm = null): int
    {
        $code = strtoupper(trim($code));
        if (!preg_match('/^[A-F0-9]{20}$/D', $code)) {
            throw new HttpException(422, '请输入有效的个人入队码');
        }

        return Db::transaction(function () use ($teamId, $code, $joinForm): int {
            $user = User::where('member_join_code_hash', hash('sha256', $code))->lock(true)->find();
            if (!$user || $user->is_banned || $user->member_join_code_expires_at <= time()) {
                throw new HttpException(422, '入队码无效或已过期，请对方重新生成');
            }

            if ($joinForm === null) {
                $memberId = app(TeamMember::class)->add($teamId, $user->id, []);
            } else {
                // Direct addition must not become a reinstatement or unblock path.
                if (\app\model\TeamMember::where('team_id', $teamId)->where('user_id', $user->id)->find()) {
                    throw new HttpException(409, '该用户已有成员记录，离队成员请通过复职流程加入');
                }
                $join = app(TeamJoin::class);
                $applicationId = $join->apply($teamId, $user->id, [
                    'values' => $joinForm['values'] ?? [],
                    'memo' => $joinForm['memo'] ?? null,
                ]);
                $memberId = $join->approve($teamId, $applicationId);
            }
            $user->save([
                'member_join_code_hash' => null,
                'member_join_code_expires_at' => null,
            ]);

            return $memberId;
        });
    }
}
