<?php
declare(strict_types=1);

namespace app\service;

use app\model\BusinessAuditEvent;
use app\model\Entity;
use app\model\User;
use think\Request;

final class BusinessAudit
{
    public function record(
        Request $request,
        string $application,
        string $action,
        string $resourceType,
        ?int $resourceId = null,
        array $context = []
    ): int {
        $entityId = $request->entity_id ?? null;
        $authenticatedUserId = $request->authenticated_user_id ?? null;
        if (!is_int($authenticatedUserId) || $authenticatedUserId <= 0) {
            throw new \LogicException('业务审计需要 authenticated_user_id');
        }
        $entityId = is_int($entityId) && $entityId > 0 ? $entityId : null;

        $context = $this->sanitizeContext($context);
        $context['actor_snapshot'] = $this->actorSnapshot(
            $authenticatedUserId,
            $entityId
        );
        $context['target_snapshot'] = [
            'type' => trim($resourceType),
            'id' => $resourceId && $resourceId > 0 ? $resourceId : null,
        ];
        if (!array_key_exists('changed', $context)) {
            $context['changed'] = true;
        }

        $event = new BusinessAuditEvent;
        $event->save([
            'team_id' => isset($request->team_id) ? $request->team_id : null,
            'entity_id' => $entityId,
            'authenticated_user_id' => $authenticatedUserId,
            'application' => trim($application),
            'action' => trim($action),
            'resource_type' => trim($resourceType),
            'resource_id' => $resourceId && $resourceId > 0 ? $resourceId : null,
            'request_id' => $this->requestId($request),
            'context' => $context,
        ]);

        return (int) $event->id;
    }

    public function recordPlatform(
        ?int $authenticatedUserId,
        string $action,
        string $resourceType,
        ?int $resourceId = null,
        array $context = [],
        ?Request $request = null
    ): int {
        $context = ['source' => $request ? 'api' : 'cli'] + $context;
        $event = new BusinessAuditEvent;
        $event->save([
            'team_id' => null,
            'entity_id' => null,
            'authenticated_user_id' => $authenticatedUserId && $authenticatedUserId > 0
                ? $authenticatedUserId
                : null,
            'application' => 'admin',
            'action' => trim($action),
            'resource_type' => trim($resourceType),
            'resource_id' => $resourceId && $resourceId > 0 ? $resourceId : null,
            'request_id' => $request ? $this->requestId($request) : null,
            'context' => $context ?: null,
        ]);

        return (int) $event->id;
    }

    public function sanitizeContext(array $context): array
    {
        $safe = [];
        foreach ($context as $key => $value) {
            $name = is_string($key) ? $key : (string) $key;
            if ($this->isSensitiveKey($name)) {
                $safe[$name] = ['changed' => true, 'redacted' => true];
                continue;
            }
            $safe[$name] = strtolower($name) === 'changes' && is_array($value)
                ? $this->sanitizeChanges($value)
                : $this->sanitizeValue($value, 0);
        }

        return $safe;
    }

    private function requestId(Request $request): ?string
    {
        $value = $request->request_id ?? $request->header('X-Request-Id', '');
        $requestId = is_scalar($value) ? trim((string) $value) : '';

        return $requestId === '' ? null : mb_substr($requestId, 0, 100);
    }

    private function actorSnapshot(int $authenticatedUserId, ?int $entityId): array
    {
        $entity = $entityId ? Entity::withTrashed()->find($entityId) : null;

        return [
            'authenticated_user_id' => $authenticatedUserId,
            'username' => User::withTrashed()->where('id', $authenticatedUserId)->value('username'),
            'entity_id' => $entityId,
            'entity_type' => $entity ? (string) $entity->entityable_type : null,
            'entity_slug' => $entity ? (string) $entity->slug : null,
            'entity_name' => $entity ? (string) $entity->name : null,
        ];
    }

    private function isSensitiveKey(string $key): bool
    {
        return (bool) preg_match(
            '/(?:password|token|secret|signature|authorization|cookie|phone|mobile|email|contact|wechat|qq|content|body|markdown|memo|url|uri)/i',
            $key
        );
    }

    private function sanitizeChanges(array $changes): array
    {
        $safe = [];
        foreach (array_slice($changes, 0, 100, true) as $key => $change) {
            $field = is_string($key) ? $key : null;
            if (is_array($change) && isset($change['field']) && is_scalar($change['field'])) {
                $field = (string) $change['field'];
            }
            if ($field !== null && $this->isSensitiveKey($field)) {
                $redacted = ['changed' => true, 'redacted' => true];
                if (is_array($change) && array_key_exists('field', $change)) {
                    $redacted['field'] = $field;
                }
                $safe[$key] = $redacted;
                continue;
            }
            $safe[$key] = $this->sanitizeValue($change, 1);
        }

        return $safe;
    }

    private function sanitizeValue($value, int $depth)
    {
        if ($depth >= 4) {
            return '[truncated]';
        }
        if (is_array($value)) {
            $safe = [];
            foreach (array_slice($value, 0, 100, true) as $key => $item) {
                $name = is_string($key) ? $key : (string) $key;
                $safe[$key] = $this->isSensitiveKey($name)
                    ? ['changed' => true, 'redacted' => true]
                    : $this->sanitizeValue($item, $depth + 1);
            }

            return $safe;
        }
        if (is_string($value)) {
            return mb_substr($value, 0, 500);
        }
        if (is_int($value) || is_float($value) || is_bool($value) || $value === null) {
            return $value;
        }

        return (string) $value;
    }
}
