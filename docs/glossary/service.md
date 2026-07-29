# Service 字典

> 本页由 `php think docs:services` 生成。修改 Service 后运行该命令，使用 `--check` 可只校验是否最新。

列出 `app/service` 中各类直接声明的 public 方法。`?类型` 表示可空，`= 值` 表示默认值；类型名称省略 `app\` 前缀。

## Balance

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `logs` | `int $teamId`、`int $customerId`、`int $page = 1`、`int $limit = 20` | `array` |
| `recharge` | `int $teamId`、`int $customerId`、`mixed $amount`、`string $memo = ''` | `void` |

## BusinessAudit

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `record` | `think\Request $request`、`string $application`、`string $action`、`string $resourceType`、`?int $resourceId = null`、`array $context = []` | `int` |

## ChatActor

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `list` | `int $teamId`、`array $actingEntity` | `array` |
| `resolve` | `int $teamId`、`string $slug` | `array` |
| `assertCanAct` | `array $actor`、`int $teamId`、`array $actingEntity` | `void` |
| `canAct` | `array $actor`、`int $teamId`、`array $actingEntity` | `bool` |
| `summary` | `enum\ChatActorType\|string $type`、`int $id` | `array` |
| `summaryEntity` | `int $entityId` | `array` |
| `actorEntity` | `int $entityId` | `array` |

## ChatCleanup

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `run` | — | `array` |

## ChatConversation

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `list` | `int $teamId`、`array $actingEntity` | `array` |
| `get` | `int $teamId`、`string $uuid`、`array $actingEntity` | `array` |
| `create` | `int $teamId`、`array $actingEntity`、`array $data` | `array` |
| `close` | `int $teamId`、`string $uuid`、`array $actingEntity` | `void` |
| `addParticipants` | `int $teamId`、`string $uuid`、`array $actingEntity`、`array $slugs` | `void` |
| `removeParticipant` | `int $teamId`、`string $uuid`、`array $actingEntity`、`string $slug` | `void` |
| `model` | `int $teamId`、`string $uuid`、`bool $withParticipants = false` | `model\ChatConversation` |
| `assertAccess` | `model\ChatConversation $conversation`、`int $teamId`、`array $actingEntity` | `void` |
| `canAccess` | `model\ChatConversation $conversation`、`int $teamId`、`array $actingEntity` | `bool` |

## ChatIntegration

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `create` | `int $teamId`、`string $slug`、`array $data` | `array` |
| `update` | `int $teamId`、`string $slug`、`int $id`、`array $data` | `void` |
| `rotate` | `int $teamId`、`string $slug`、`int $id` | `array` |
| `delete` | `int $teamId`、`string $slug`、`int $id` | `void` |
| `authenticate` | `string $token` | `model\TeamVirtualIntegration` |
| `authenticateActor` | `string $token` | `array` |
| `endpointResolution` | `string $url` | `array` |

## ChatMessage

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `list` | `int $teamId`、`string $uuid`、`array $actingEntity`、`int $beforeId = 0`、`int $limit = 50` | `array` |
| `send` | `int $teamId`、`array $actingEntity`、`array $data`、`?int $integrationId = null` | `array` |
| `edit` | `int $teamId`、`array $actingEntity`、`int $messageId`、`string $content` | `void` |
| `revoke` | `int $teamId`、`array $actingEntity`、`int $messageId` | `void` |
| `read` | `int $teamId`、`string $uuid`、`string $actorSlug`、`array $actingEntity`、`int $messageId` | `void` |

## ChatOutbox

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `runOnce` | `int $limit = 20` | `array` |

## ChatRealtime

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `connectionToken` | `int $userId` | `array` |
| `subscriptionToken` | `int $teamId`、`int $userId`、`array $actingEntity`、`string $uuid` | `array` |
| `publish` | `string $uuid`、`array $event` | `void` |
| `request` | `string $url`、`string $body`、`array $headers = []`、`array $resolve = []` | `array` |

## ChatTeam

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `list` | `int $userId` | `array` |

## ChatVirtual

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `list` | `int $teamId`、`array $actingEntity`、`string $mode = 'manage'` | `array` |
| `get` | `int $teamId`、`string $slug` | `array` |
| `create` | `int $teamId`、`array $data` | `array` |
| `update` | `int $teamId`、`string $slug`、`array $data` | `void` |
| `delete` | `int $teamId`、`string $slug` | `void` |
| `model` | `int $teamId`、`string $slug` | `model\TeamVirtual` |

## CustomerBinding

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `bind` | `int $teamId`、`int $userId`、`string $deviceToken`、`?model\EntitySession $current`、`?string $slug = null` | `array` |

## CustomerProfile

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `get` | `int $teamId`、`int $customerId` | `array` |
| `update` | `int $teamId`、`int $customerId`、`array $data` | `void` |
| `claimSlug` | `int $teamId`、`int $customerId`、`string $slug` | `array` |

## Device

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `quit` | `int $userId`、`string $deviceToken` | `void` |
| `quitAll` | `int $userId` | `void` |

## Display

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `profile` | `int $teamId` | `array` |
| `entities` | `int $teamId`、`?string $type`、`int $page`、`int $limit` | `array` |
| `entity` | `int $teamId`、`string $slug` | `array` |
| `documents` | `int $teamId`、`?string $entitySlug`、`int $page`、`int $limit` | `array` |
| `document` | `int $teamId`、`int $id` | `array` |
| `resolve` | `array $slugs` | `array` |

## Document

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `list` | `int $entityId`、`array $filters`、`int $page`、`int $limit`、`int $teamId`、`array $actingEntity` | `array` |
| `get` | `int $id`、`int $teamId`、`array $actingEntity` | `array` |
| `create` | `int $entityId`、`array $data`、`int $teamId`、`array $actingEntity` | `int` |
| `edit` | `int $id`、`array $data`、`int $teamId`、`array $actingEntity` | `void` |
| `delete` | `int $id`、`int $teamId`、`array $actingEntity` | `void` |

## Entity

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `optionsForTeam` | `int $teamId` | `array` |
| `requireBySubject` | `string $type`、`int $id` | `model\Entity` |
| `subject` | `int $entityId` | `array` |
| `assertInTeam` | `int $entityId`、`int $teamId` | `model\Entity` |
| `claimTeam` | `model\Team $team` | `model\Entity` |
| `claimMember` | `int $teamId`、`int $memberId`、`string $slug` | `model\Entity` |
| `claimCustomer` | `int $customerId`、`string $slug` | `model\Entity` |
| `claimVirtual` | `model\TeamVirtual $virtual`、`string $slug` | `model\Entity` |
| `setMemberSearch` | `int $teamId`、`int $memberId`、`mixed $override` | `void` |
| `setDisplay` | `int $teamId`、`int $entityId`、`mixed $isDisplayed` | `void` |
| `search` | `string $keyword`、`int $limit`、`int $userId` | `array` |
| `resolve` | `array $slugs`、`int $userId` | `array` |

## EntityProfile

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `ensure` | `int $entityId`、`array $data = []` | `model\TeamEntityProfile` |
| `listing` | `int $teamId`、`?string $type`、`int $page`、`int $limit` | `array` |
| `get` | `int $teamId`、`int $entityId` | `array` |
| `update` | `int $teamId`、`int $entityId`、`array $data` | `void` |

## EntityRole

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `list` | `int $teamId`、`string $slug` | `array` |
| `summary` | `int $teamId`、`string $slug` | `array` |
| `save` | `int $teamId`、`string $slug`、`array $roleIds` | `void` |
| `describe` | `int $teamId`、`string $slug` | `array` |

## File

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `upload` | `think\file\UploadedFile $file`、`int $teamId`、`array $actor` | `array` |
| `uploadForJoin` | `think\file\UploadedFile $file`、`int $teamId` | `array` |
| `uploadSystem` | `think\file\UploadedFile $file` | `array` |
| `uploadByCommand` | `string $localPath`、`?int $entityId = null`、`?int $teamId = null`、`?string $originalName = null` | `array` |
| `list` | `int $teamId`、`array $filters`、`int $page = 1`、`int $limit = 20` | `array` |
| `get` | `int $teamId`、`int $id` | `array` |
| `delete` | `int $id`、`int $entityId` | `void` |
| `deleteByTeam` | `int $teamId`、`int $id` | `void` |
| `checkAbility` | `int $teamId`、`int $newSize` | `void` |
| `usage` | `int $teamId` | `array` |
| `purgeObject` | `string $path` | `void` |

## IdentitySession

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `candidates` | `int $userId`、`?model\EntitySession $current = null` | `array` |
| `receive` | `int $userId`、`string $deviceToken`、`string $slug`、`?model\EntitySession $current = null` | `array` |
| `receiveMember` | `int $userId`、`string $deviceToken`、`string $teamSlug` | `array` |
| `receiveBoundCustomer` | `int $userId`、`string $deviceToken`、`model\TeamCustomer $customer`、`?model\EntitySession $current` | `array` |
| `customerIdentity` | `model\TeamCustomer $customer` | `array` |
| `publicIssue` | `array $issued` | `array` |
| `drop` | `int $userId`、`string $deviceToken`、`string $jti = ''` | `array` |
| `session` | `int $userId`、`string $deviceToken`、`string $jti`、`string $type`、`int $id` | `model\EntitySession` |
| `entityTeamId` | `string $type`、`int $id` | `int` |
| `assumePermissionKeys` | `model\Entity $target` | `array` |
| `entityName` | `string $type`、`int $id` | `string` |
| `teamSummary` | `int $teamId` | `?array` |

## Jwt

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `createToken` | `int $uid`、`string $deviceToken = ''`、`array $extra = []`、`?int $expiresAt = null` | `string` |
| `parseToken` | `string $token` | `object` |
| `validate` | `string $token` | `bool` |

## LifecycleCleanup

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `run` | — | `array` |

## Login

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `byPhone` | `string $phone`、`string $password`、`array $deviceInfo = []` | `array` |
| `bySms` | `string $phone`、`string $code`、`array $deviceInfo = []` | `array` |
| `byAccount` | `string $account`、`string $password`、`array $deviceInfo = []` | `array` |
| `loginSuccess` | `model\User $user`、`array $deviceInfo` | `array` |
| `refresh` | `string $refreshToken` | `array` |

## Markdown

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `sync` | `think\Model $source`、`string $field`、`?string $markdown` | `void` |
| `deleteSource` | `think\Model $source`、`string $field` | `void` |

## Notice

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `send` | `int $teamId`、`string $title`、`?string $content = null`、`bool $isPinned = false` | `array` |
| `sendToEntity` | `int $senderTeamId`、`int $entityId`、`string $title`、`?string $content = null`、`bool $isPinned = false` | `array` |
| `list` | `int $teamId`、`array $filters = []`、`int $page = 1`、`int $limit = 20` | `array` |
| `listForEntity` | `int $entityId`、`array $filters = []`、`int $page = 1`、`int $limit = 20` | `array` |
| `get` | `int $teamId`、`int $id` | `array` |
| `getForEntity` | `int $entityId`、`int $id` | `array` |
| `confirm` | `int $teamId`、`int $id` | `void` |
| `confirmForEntity` | `int $entityId`、`int $id` | `void` |
| `confirmAll` | `int $teamId` | `int` |
| `confirmAllForEntity` | `int $entityId` | `int` |
| `receive` | `int $teamId`、`int $id` | `void` |
| `receiveForEntity` | `int $entityId`、`int $id` | `void` |
| `receiveAll` | `int $teamId` | `void` |
| `receiveAllForEntity` | `int $entityId` | `void` |

## Order

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `list` | `int $teamId`、`array $filters`、`int $page = 1`、`int $limit = 20` | `array` |
| `get` | `int $teamId`、`int $id` | `array` |
| `create` | `int $teamId`、`array $data` | `int` |
| `cancel` | `int $teamId`、`int $id` | `void` |
| `complete` | `int $teamId`、`int $id` | `void` |

## Pagination

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `normalize` | `int $page`、`int $limit` | `array` |

## PermissionDictionary

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `groups` | — | `array` |
| `keys` | — | `array` |
| `contains` | `string $key` | `bool` |
| `dynamic` | `string $key` | `?array` |
| `virtual` | `string $slug`、`string $action` | `string` |
| `assume` | `string $type`、`string $slug = '*'` | `string` |
| `entityField` | `string $type` | `string` |

## PermissionGate

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `assert` | `int $teamId`、`array\|int $subject`、`array $permissionKeys` | `void` |
| `allows` | `int $teamId`、`array\|int $subject`、`array $permissionKeys` | `bool` |
| `delegatedAllows` | `int $targetTeamId`、`array $source`、`model\Entity $target` | `bool` |
| `candidates` | `think\Request $request`、`string ...$templates` | `array` |
| `assertKey` | `string $key` | `void` |

## Product

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `list` | `int $teamId`、`array $filters`、`int $page = 1`、`int $limit = 20` | `array` |
| `get` | `int $teamId`、`int $id` | `array` |
| `create` | `int $teamId`、`array $data` | `int` |
| `edit` | `int $teamId`、`int $id`、`array $data` | `void` |
| `delete` | `int $teamId`、`int $id` | `void` |
| `setHandlers` | `int $teamId`、`int $productId`、`array $entityIds` | `void` |

## RefreshToken

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `issue` | `model\UserDevice $device`、`?string $familyId = null` | `array` |
| `rotate` | `string $plain` | `array` |
| `revokeDevice` | `int $userId`、`int $deviceId` | `void` |

## Register

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `phone` | `string $phone`、`string $code`、`string $password`、`array $deviceInfo = []` | `array` |

## Role

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `list` | `int $teamId` | `array` |
| `get` | `int $teamId`、`int $id` | `array` |
| `create` | `int $teamId`、`array $data` | `int` |
| `update` | `int $teamId`、`int $id`、`array $data` | `void` |
| `delete` | `int $teamId`、`int $id` | `void` |

## RolePermission

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `list` | `int $teamId`、`int $roleId` | `array` |
| `catalog` | `int $teamId` | `array` |
| `bootstrapOwner` | `int $teamId`、`int $memberId` | `void` |
| `save` | `int $teamId`、`int $roleId`、`mixed $permissionKeys` | `void` |

## Sender

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `bindings` | `int $teamId`、`int $entityId` | `array` |
| `allBindings` | `int $teamId` | `array` |
| `bind` | `int $teamId`、`int $entityId`、`int $customerId` | `void` |
| `unbind` | `int $teamId`、`int $id` | `void` |

## SmsVerification

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `send` | `string $phone`、`string $purpose` | `array` |
| `verify` | `string $phone`、`string $code`、`string $purpose` | `void` |

## Storefront

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `home` | `int $teamId` | `array` |
| `products` | `int $teamId`、`int $page = 1`、`int $limit = 20` | `array` |
| `product` | `int $teamId`、`int $id` | `array` |

## Team

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `list` | `int $userId` | `array` |
| `create` | `int $userId`、`string $slug`、`string $displayName` | `array` |

## TeamCustomer

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `me` | `int $teamId`、`int $customerId` | `array` |
| `order` | `int $teamId`、`int $customerId`、`int $orderId` | `array` |
| `purchase` | `int $teamId`、`int $customerId`、`array $data` | `int` |
| `cancelOrder` | `int $teamId`、`int $customerId`、`int $orderId` | `void` |
| `orders` | `int $teamId`、`int $customerId`、`array $filters`、`int $page = 1`、`int $limit = 20` | `array` |
| `transactions` | `int $teamId`、`int $customerId`、`array $filters`、`int $page = 1`、`int $limit = 20` | `array` |
| `balance` | `int $teamId`、`int $customerId` | `array` |
| `balanceLogs` | `int $teamId`、`int $customerId`、`int $page = 1`、`int $limit = 20` | `array` |

## TeamEntityField

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `list` | `int $teamId`、`string $entityType` | `array` |
| `get` | `int $teamId`、`int $id` | `array` |
| `create` | `int $teamId`、`array $data` | `void` |
| `update` | `int $teamId`、`int $id`、`array $data` | `void` |
| `delete` | `int $teamId`、`int $id` | `void` |
| `typeFor` | `int $teamId`、`int $id` | `string` |
| `values` | `int $teamId`、`string $entitySlug` | `array` |
| `saveValues` | `int $teamId`、`string $entitySlug`、`array $values` | `void` |
| `saveOwnValues` | `int $teamId`、`string $entitySlug`、`array $values` | `void` |

## TeamJoin

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `fields` | `int $teamId`、`bool $onlyFillable = false` | `array` |
| `createField` | `int $teamId`、`array $data` | `int` |
| `updateField` | `int $teamId`、`int $id`、`array $data` | `void` |
| `deleteField` | `int $teamId`、`int $id` | `void` |
| `apply` | `int $teamId`、`int $userId`、`array $data` | `int` |
| `mine` | `int $teamId`、`int $userId` | `array` |
| `list` | `int $teamId`、`array $filters`、`int $page = 1`、`int $limit = 20` | `array` |
| `get` | `int $teamId`、`int $id`、`?int $userId = null` | `array` |
| `cancel` | `int $teamId`、`int $userId`、`int $id` | `void` |
| `startReview` | `int $teamId`、`int $id` | `void` |
| `reject` | `int $teamId`、`int $id`、`string $memo` | `void` |
| `approve` | `int $teamId`、`int $id` | `int` |
| `saveTasks` | `int $teamId`、`int $id`、`array $tasks` | `void` |
| `setTaskPassed` | `int $teamId`、`int $id`、`int $taskId`、`bool $isPassed` | `void` |
| `upload` | `think\file\UploadedFile $file`、`int $teamId` | `array` |

## TeamMember

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `list` | `int $teamId` | `array` |
| `get` | `int $teamId`、`int $memberId` | `array` |
| `capabilities` | `int $teamId`、`array $subject`、`array $member` | `array` |
| `add` | `int $teamId`、`int $userId`、`array $data` | `void` |
| `edit` | `int $teamId`、`int $memberId`、`array $data` | `void` |
| `block` | `int $teamId`、`int $memberId` | `void` |
| `unblock` | `int $teamId`、`int $memberId` | `void` |
| `remove` | `int $teamId`、`int $memberId` | `void` |

## TeamSetting

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `internal` | `int $teamId`、`string $appName` | `array` |
| `internalMany` | `array $teamIds`、`string $appName` | `array` |
| `get` | `int $teamId`、`string $appName`、`array $actingEntity` | `array` |
| `schema` | `int $teamId` | `array` |
| `set` | `int $teamId`、`string $appName`、`string $key`、`mixed $value`、`int $visibility = 1`、`array $targets = []` | `void` |
| `batch` | `int $teamId`、`string $appName`、`array $kv` | `void` |

## Transaction

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `options` | `int $teamId` | `array` |
| `list` | `int $teamId`、`array $filters`、`int $page = 1`、`int $limit = 20` | `array` |
| `get` | `int $teamId`、`int $id` | `array` |
| `create` | `int $teamId`、`array $data` | `int` |
| `edit` | `int $teamId`、`int $id`、`array $data` | `void` |
| `delete` | `int $teamId`、`int $id` | `void` |

## TransactionStats

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `summary` | `int $teamId`、`int $startTime`、`int $endTime` | `array` |
| `byRole` | `int $teamId`、`int $startTime`、`int $endTime` | `array` |
| `byEntity` | `int $teamId`、`int $startTime`、`int $endTime`、`string $role` | `array` |
| `timeline` | `int $teamId`、`int $startTime`、`int $endTime`、`string $granularity = 'day'` | `array` |
| `byCustomer` | `int $teamId`、`int $startTime`、`int $endTime` | `array` |

## Visibility

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `isTeamManager` | `int $teamId`、`array $actingEntity` | `bool` |
| `assertManage` | `enum\ManageScope $scope`、`bool $isTeamManager`、`bool $isSubject` | `void` |
| `assertView` | `think\Model $model`、`int $actingEntityId`、`bool $isTeamManager`、`bool $isSubject` | `void` |
| `canView` | `think\Model $model`、`int $actingEntityId`、`bool $isTeamManager`、`bool $isSubject` | `bool` |
| `syncTargets` | `think\Model $model`、`array $targets`、`int $teamId` | `void` |
| `normalizeTargets` | `array $targets`、`int $teamId` | `array` |
