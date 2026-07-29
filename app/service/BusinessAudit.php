<?php
declare(strict_types=1);

namespace app\service;

use app\model\BusinessAuditEvent;
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
        $entityId = ($request->entity_id ?? 0);
        $authenticatedUserId = ($request->authenticated_user_id ?? 0);
        if ($entityId <= 0 || $authenticatedUserId <= 0) {
            throw new \LogicException('业务审计需要 entity_id 与 authenticated_user_id');
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
            'context' => $context ?: null,
        ]);

        return (int) $event->id;
    }

    private function requestId(Request $request): ?string
    {
        $value = $request->request_id ?? $request->header('X-Request-Id', '');
        $requestId = is_scalar($value) ? trim((string) $value) : '';

        return $requestId === '' ? null : mb_substr($requestId, 0, 100);
    }
}
