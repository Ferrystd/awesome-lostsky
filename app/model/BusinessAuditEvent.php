<?php
declare(strict_types=1);

namespace app\model;

class BusinessAuditEvent extends Base
{
    protected $type = [
        'team_id' => 'integer',
        'entity_id' => 'integer',
        'authenticated_user_id' => 'integer',
        'application' => 'string',
        'action' => 'string',
        'resource_type' => 'string',
        'resource_id' => 'integer',
        'request_id' => 'string',
        'context' => 'json',
    ] + self::COMMON_TYPES;

    protected $json = ['context'];
    protected $readonly = [
        'team_id',
        'entity_id',
        'authenticated_user_id',
        'application',
        'action',
        'resource_type',
        'resource_id',
        'request_id',
        'context',
    ];
}
