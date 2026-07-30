<?php
declare(strict_types=1);

namespace app\service;

use app\model\Entity as EntityModel;
use app\model\EntitySession;
use app\model\Team;
use app\model\TeamCustomer;
use app\model\TeamCustomerBalance;
use app\model\User;
use think\exception\HttpException;
use think\facade\Db;

class CustomerBinding
{
    public function bind(
        int $teamId,
        int $userId,
        string $deviceToken,
        ?EntitySession $current,
        ?string $slug = null,
        ?string $inviterSlug = null
    ): array {
        if (!Team::active()->find($teamId)) {
            throw new HttpException(404, '团队不存在或不可用');
        }

        if ($current) {
            $source = $current->subject;
            if (!$source || !$source->is_valid) {
                throw new HttpException(401, '当前实体身份会话已失效');
            }
            if ((string) $source->entityable_type === 'teamCustomer'
                && app(IdentitySession::class)->entityTeamId(
                    'teamCustomer',
                    (int) $source->entityable_id
                ) === $teamId) {
                $customer = TeamCustomer::with(['identity', 'profile', 'balance'])
                    ->find((int) $source->entityable_id);

                return $this->result($customer, null, false);
            }
            $ownerEntityId = (int) $source->id;
            $customer = TeamCustomer::where('team_id', $teamId)
                ->where('owner_entity_id', $ownerEntityId)
                ->with(['identity', 'profile', 'balance'])
                ->find();
        } else {
            $ownerEntityId = null;
            $customer = TeamCustomer::where('team_id', $teamId)
                ->where('user_id', $userId)
                ->with(['identity', 'profile', 'balance'])
                ->find();
        }

        $created = false;
        if (!$customer) {
            $assignee = app(CustomerAssignment::class)->resolveInviter($teamId, $inviterSlug);
            try {
                $customer = Db::transaction(function () use (
                    $teamId,
                    $userId,
                    $ownerEntityId,
                    $current,
                    $slug,
                    $assignee
                ) {
                    $customer = new TeamCustomer;
                    $customer->save([
                        'team_id' => $teamId,
                        'user_id' => $ownerEntityId === null ? $userId : null,
                        'owner_entity_id' => $ownerEntityId,
                        'assignee_entity_id' => $assignee?->id,
                        'is_blocked' => 0,
                    ]);

                    $balance = new TeamCustomerBalance;
                    $balance->save([
                        'customer_id' => (int) $customer->id,
                        'balance' => '0.00',
                        'recharged' => '0.00',
                        'spent' => '0.00',
                    ]);

                    $identity = app(\app\service\Entity::class)->claimCustomer(
                        (int) $customer->id,
                        trim((string) $slug) !== '' ? (string) $slug : "customer-{$customer->id}"
                    );
                    $identity->save(['search_override' => 0]);
                    $profile = $this->sourceProfile($userId, $current);
                    app(EntityProfile::class)->update($teamId, (int) $identity->id, $profile);

                    return TeamCustomer::with(['identity', 'profile', 'balance'])
                        ->find((int) $customer->id);
                });
                $created = true;
            } catch (HttpException $exception) {
                throw $exception;
            } catch (\Throwable $exception) {
                $customer = $ownerEntityId === null
                    ? TeamCustomer::where('team_id', $teamId)->where('user_id', $userId)->find()
                    : TeamCustomer::where('team_id', $teamId)->where('owner_entity_id', $ownerEntityId)->find();
                if (!$customer) {
                    throw $exception;
                }
                $customer = TeamCustomer::with(['identity', 'profile', 'balance'])
                    ->find((int) $customer->id);
            }
        }

        if (!$customer || $customer->is_blocked || !$customer->identity) {
            throw new HttpException(403, '客户身份不可用');
        }

        $issue = app(IdentitySession::class)->receiveBoundCustomer(
            $userId,
            $deviceToken,
            $customer,
            $current
        );

        return $this->result($customer, $issue, $created);
    }

    private function sourceProfile(int $userId, ?EntitySession $current): array
    {
        if ($current && $current->subject) {
            $source = EntityModel::with(['profile'])->find((int) $current->entity_id);
            return [
                'name' => (string) ($source?->profile?->name ?: $source?->slug ?: '客户'),
                'avatar' => $source?->profile?->avatar ?: null,
                'description' => null,
            ];
        }

        $user = User::with(['profile'])->find($userId);
        return [
            'name' => (string) ($user?->nickname ?: $user?->username ?: '客户'),
            'avatar' => $user?->avatar ?: null,
            'description' => null,
        ];
    }

    private function result(?TeamCustomer $customer, ?array $issue, bool $created): array
    {
        if (!$customer || $customer->is_blocked || !$customer->identity) {
            throw new HttpException(403, '客户身份不可用');
        }

        return [
            'token' => $issue['token'] ?? null,
            'identity' => $issue['identity'] ?? app(IdentitySession::class)->customerIdentity($customer),
            'customer' => $customer->toArray(),
            'created' => $created,
        ];
    }
}
