---
title: Service 字典
description: 由代码生成的 Service public 方法字典。
tags: [glossary]
status: 生成文档
aliases: [服务, Service]
---

# Service 字典

> 本页由 `php think docs:services` 生成。说明正文编辑 `Templates/dictionaries/services.md`；修改 Service 后运行生成命令，使用 `--check` 可只校验是否最新。

列出 `app/service` 中各类直接声明的 public 方法。`?类型` 表示可空，`= 值` 表示默认值；类型名称省略 `app\` 前缀。仅供开发侧查询方法签名，不代表 HTTP 接口或调用授权。

## AbilityCatalog

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `all` | — | `array` |
| `label` | `string $key` | `string` |

## AbilityExpirationScheduler

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `schedule` | `model\TeamAbilityGrant $grant` | `?int` |

## AbilityResolver

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `resolve` | `int $teamId`、`string $key`、`int $minimumLevel = 1`、`?int $at = null` | `array` |
| `resolveGrants` | `int $teamId`、`string $key`、`int $minimumLevel = 1`、`?int $at = null` | `array` |
| `available` | `int $teamId`、`string $key`、`int $minimumLevel = 1` | `bool` |
| `syncProjection` | `int $teamId`、`string $key` | `void` |

## Balance

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `logs` | `int $teamId`、`int $customerId`、`int $page = 1`、`int $limit = 20` | `array` |
| `recharge` | `int $teamId`、`int $customerId`、`mixed $amount`、`string $memo = ''` | `void` |

## BenefitFulfillment

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `snapshotProduct` | `model\TeamProduct $product`、`array $path = []` | `array` |
| `fulfillOrder` | `model\TeamOrder $order` | `array` |
| `servicesFromClaim` | `model\RedemptionClaim $claim`、`int $teamId`、`int $customerId`、`int $holderEntityId` | `array` |
| `grantProduct` | `model\TeamProduct $product`、`model\TeamCustomer $customer`、`int $quantity`、`?int $senderEntityId`、`?int $csEntityId` | `array` |

## BenefitPackagePricing

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `normalizeItem` | `array $item`、`int $sort` | `array` |
| `isItemized` | `model\BenefitPackage $package` | `bool` |
| `itemMoney` | `model\BenefitPackageService $item` | `array` |
| `summary` | `model\BenefitPackage $package` | `array` |
| `configuration` | `model\BenefitPackage $package` | `array` |
| `toCents` | `string $amount` | `int` |
| `fromCents` | `int $cents` | `string` |
| `itemTotalMoney` | `model\BenefitPackageService $item` | `array` |

## BusinessAudit

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `record` | `think\Request $request`、`string $application`、`string $action`、`string $resourceType`、`?int $resourceId = null`、`array $context = []` | `int` |
| `recordPlatform` | `?int $authenticatedUserId`、`string $action`、`string $resourceType`、`?int $resourceId = null`、`array $context = []`、`?think\Request $request = null` | `int` |
| `sanitizeContext` | `array $context` | `array` |

## ChatActor

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `current` | `array $acting` | `array` |
| `search` | `string $keyword`、`string $slug`、`int $userId` | `array` |
| `resolveGlobal` | `string $slug`、`bool $requireSearchable = false` | `array` |
| `summary` | `enum\ChatActorType\|string $type`、`int $id` | `array` |
| `summaryEntity` | `int $entityId` | `array` |
| `actorEntity` | `int $entityId` | `array` |

## ChatBlock

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `list` | `array $actingEntity` | `array` |
| `create` | `array $actingEntity`、`int $expectedEntityId`、`string $slug` | `void` |
| `delete` | `array $actingEntity`、`int $expectedEntityId`、`string $slug` | `void` |
| `blockedEitherWay` | `int $left`、`int $right` | `bool` |

## ChatCleanup

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `run` | — | `array` |

## ChatConversation

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `list` | `array $acting` | `array` |
| `get` | `string $uuid`、`array $acting` | `array` |
| `create` | `array $acting`、`int $expectedEntityId`、`array $data` | `array` |
| `invitations` | `array $acting` | `array` |
| `respondInvitation` | `array $acting`、`int $expectedEntityId`、`string $uuid`、`bool $accept` | `void` |
| `leave` | `array $acting`、`int $expectedEntityId`、`string $uuid` | `void` |
| `teamList` | `int $teamId` | `array` |
| `teamGet` | `int $teamId`、`string $uuid` | `array` |
| `teamCreate` | `int $teamId`、`array $acting`、`int $expected`、`string $title`、`array $slugs` | `array` |
| `teamUpdate` | `int $teamId`、`array $acting`、`int $expected`、`string $uuid`、`string $title` | `void` |
| `teamInvite` | `int $teamId`、`array $acting`、`int $expected`、`string $uuid`、`array $slugs` | `void` |
| `teamCancelInvitation` | `int $teamId`、`array $acting`、`int $expected`、`string $uuid`、`string $slug` | `void` |
| `teamRemove` | `int $teamId`、`array $acting`、`int $expected`、`string $uuid`、`string $slug` | `void` |
| `teamClose` | `int $teamId`、`array $acting`、`int $expected`、`string $uuid` | `void` |
| `model` | `string $uuid`、`bool $withParticipants = false` | `model\ChatConversation` |
| `assertAccess` | `model\ChatConversation $conversation`、`array $acting` | `void` |
| `canAccess` | `model\ChatConversation $conversation`、`array $acting` | `bool` |

## ChatIdentity

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `expected` | `array $actingEntity`、`int $expectedEntityId` | `int` |

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
| `list` | `string $uuid`、`array $acting`、`int $beforeId = 0`、`int $limit = 50` | `array` |
| `teamList` | `int $teamId`、`string $uuid`、`int $beforeId = 0`、`int $limit = 50` | `array` |
| `send` | `array $acting`、`int $expectedEntityId`、`array $data`、`?int $integrationId = null` | `array` |
| `edit` | `array $acting`、`int $expectedEntityId`、`int $messageId`、`string $content` | `void` |
| `revoke` | `array $acting`、`int $expectedEntityId`、`int $messageId` | `void` |
| `teamRevoke` | `int $teamId`、`array $acting`、`int $expected`、`int $messageId` | `void` |
| `read` | `array $acting`、`int $expected`、`string $uuid`、`int $messageId` | `void` |

## ChatMigration

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `inspect` | — | `array` |
| `apply` | — | `array` |
| `directKey` | `int $leftEntityId`、`int $rightEntityId` | `string` |

## ChatOutbox

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `runOnce` | `int $limit = 20` | `array` |

## ChatRealtime

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `connectionToken` | `int $sessionId`、`array $actingEntity`、`int $expectedEntityId` | `array` |
| `subscriptionToken` | `int $sessionId`、`array $actingEntity`、`int $expectedEntityId`、`string $uuid` | `array` |
| `publishToRecipients` | `string $uuid`、`array $event`、`array $entityIds` | `void` |
| `unsubscribeEntity` | `int $entityId`、`string $uuid` | `void` |
| `disconnectSession` | `int $sessionId` | `void` |
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
| `update` | `int $teamId`、`string $slug`、`array $data` | `int` |
| `delete` | `int $teamId`、`string $slug` | `int` |
| `model` | `int $teamId`、`string $slug` | `model\TeamVirtual` |

## CustomerAssignment

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `resolveInviter` | `int $teamId`、`?string $slug` | `?model\Entity` |
| `assertEntity` | `int $teamId`、`int $entityId` | `model\Entity` |
| `customer` | `int $teamId`、`int $customerId`、`bool $lock = false` | `model\TeamCustomer` |
| `sender` | `model\TeamCustomer $customer`、`int $teamId` | `?int` |
| `options` | `int $teamId` | `array` |

## CustomerBinding

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `bind` | `int $teamId`、`int $userId`、`string $deviceToken`、`?model\EntitySession $current`、`?string $slug = null`、`?string $inviterSlug = null` | `array` |

## CustomerProfile

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `get` | `int $teamId`、`int $customerId` | `array` |
| `update` | `int $teamId`、`int $customerId`、`array $data` | `void` |
| `assignees` | `int $teamId` | `array` |
| `claimSlug` | `int $teamId`、`int $customerId`、`string $slug` | `array` |

## Device

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `quit` | `int $userId`、`string $deviceToken` | `void` |
| `quitAll` | `int $userId` | `void` |
| `revokeAll` | `int $userId` | `array` |

## Display

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `profile` | `int $teamId` | `array` |
| `entities` | `int $teamId`、`?string $type`、`int $page`、`int $limit`、`string $keyword = ''` | `array` |
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

## EntitlementManagement

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `abilityCatalog` | — | `array` |
| `teamOptions` | `int $teamId` | `array` |
| `personalOptions` | `int $teamId`、`int $ownerEntityId` | `array` |
| `productOptions` | `int $teamId`、`?int $ownerEntityId = null` | `array` |
| `services` | `int $teamId`、`int $page`、`int $limit`、`string $keyword = ''`、`?int $ownerEntityId = null` | `array` |
| `service` | `int $teamId`、`int $id`、`?int $ownerEntityId = null` | `array` |
| `saveService` | `int $teamId`、`?int $id`、`array $data` | `int` |
| `serviceHandlers` | `int $teamId`、`int $serviceId` | `array` |
| `saveServiceHandlers` | `int $teamId`、`int $serviceId`、`array $entityIds` | `array` |
| `disableService` | `int $teamId`、`int $id`、`?int $ownerEntityId = null` | `void` |
| `packages` | `?int $issuerTeamId`、`int $page`、`int $limit`、`string $keyword = ''`、`?int $ownerEntityId = null` | `array` |
| `package` | `?int $issuerTeamId`、`int $id`、`?int $ownerEntityId = null` | `array` |
| `savePackage` | `?int $issuerTeamId`、`?int $id`、`array $data` | `int` |
| `disablePackage` | `?int $issuerTeamId`、`int $id`、`?int $ownerEntityId = null` | `void` |
| `campaigns` | `?int $issuerTeamId`、`int $page`、`int $limit`、`string $keyword = ''`、`?int $ownerEntityId = null` | `array` |
| `campaign` | `?int $issuerTeamId`、`int $id`、`?int $ownerEntityId = null` | `array` |
| `saveCampaign` | `?int $issuerTeamId`、`?int $id`、`array $data` | `int` |
| `disableCampaign` | `?int $issuerTeamId`、`int $id`、`?int $ownerEntityId = null` | `void` |
| `codes` | `?int $issuerTeamId`、`int $campaignId`、`int $page`、`int $limit`、`?int $ownerEntityId = null` | `array` |
| `issueCodes` | `?int $issuerTeamId`、`int $campaignId`、`array $data`、`?int $ownerEntityId = null` | `array` |
| `revealCode` | `?int $issuerTeamId`、`int $campaignId`、`int $codeId`、`?int $ownerEntityId = null` | `array` |
| `disableCode` | `?int $issuerTeamId`、`int $campaignId`、`int $codeId`、`?int $ownerEntityId = null` | `void` |

## EntitlementSelfManagement

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `options` | `int $teamId`、`array $actingEntity` | `array` |
| `services` | `int $teamId`、`array $actingEntity`、`int $page`、`int $limit`、`string $keyword = ''` | `array` |
| `service` | `int $teamId`、`array $actingEntity`、`int $id` | `array` |
| `saveService` | `int $teamId`、`array $actingEntity`、`int $expectedEntityId`、`?int $id`、`array $data` | `int` |
| `serviceHandlers` | `int $teamId`、`array $actingEntity`、`int $id` | `array` |
| `saveServiceHandlers` | `int $teamId`、`array $actingEntity`、`int $expectedEntityId`、`int $id`、`array $entityIds` | `array` |
| `disableService` | `int $teamId`、`array $actingEntity`、`int $expectedEntityId`、`int $id` | `void` |
| `packages` | `int $teamId`、`array $actingEntity`、`int $page`、`int $limit`、`string $keyword = ''` | `array` |
| `package` | `int $teamId`、`array $actingEntity`、`int $id` | `array` |
| `savePackage` | `int $teamId`、`array $actingEntity`、`int $expectedEntityId`、`?int $id`、`array $data` | `int` |
| `disablePackage` | `int $teamId`、`array $actingEntity`、`int $expectedEntityId`、`int $id` | `void` |
| `campaigns` | `int $teamId`、`array $actingEntity`、`int $page`、`int $limit`、`string $keyword = ''` | `array` |
| `campaign` | `int $teamId`、`array $actingEntity`、`int $id` | `array` |
| `saveCampaign` | `int $teamId`、`array $actingEntity`、`int $expectedEntityId`、`?int $id`、`array $data` | `int` |
| `disableCampaign` | `int $teamId`、`array $actingEntity`、`int $expectedEntityId`、`int $id` | `void` |
| `codes` | `int $teamId`、`array $actingEntity`、`int $campaignId`、`int $page`、`int $limit` | `array` |
| `issueCodes` | `int $teamId`、`array $actingEntity`、`int $expectedEntityId`、`int $campaignId`、`array $data` | `array` |
| `revealCode` | `int $teamId`、`array $actingEntity`、`int $expectedEntityId`、`int $campaignId`、`int $codeId` | `array` |
| `disableCode` | `int $teamId`、`array $actingEntity`、`int $expectedEntityId`、`int $campaignId`、`int $codeId` | `void` |

## Entity

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `optionsForTeam` | `int $teamId`、`bool $canReadAll = false` | `array` |
| `requireBySubject` | `string $type`、`int $id` | `model\Entity` |
| `idBySubject` | `string $type`、`int $id` | `int` |
| `subject` | `int $entityId` | `array` |
| `assertInTeam` | `int $entityId`、`int $teamId` | `model\Entity` |
| `assertBelongsToTeam` | `int $entityId`、`int $teamId` | `model\Entity` |
| `claimTeam` | `model\Team $team` | `model\Entity` |
| `claimMember` | `int $teamId`、`int $memberId`、`string $slug` | `model\Entity` |
| `claimCustomer` | `int $customerId`、`string $slug` | `model\Entity` |
| `claimVirtual` | `model\TeamVirtual $virtual`、`string $slug` | `model\Entity` |
| `setMemberSearch` | `int $teamId`、`int $memberId`、`mixed $override` | `void` |
| `setDisplay` | `int $teamId`、`int $entityId`、`mixed $isDisplayed` | `void` |
| `setInternalVisibility` | `int $teamId`、`int $entityId`、`mixed $isInternalVisible` | `void` |
| `setPresentation` | `int $teamId`、`int $entityId`、`mixed $isInternalVisible`、`mixed $isDisplayed` | `array` |
| `updatePresentation` | `think\Request $request`、`int $teamId`、`int $entityId`、`mixed $isInternalVisible`、`mixed $isDisplayed` | `array` |
| `search` | `string $keyword`、`int $limit`、`int $userId` | `array` |
| `resolve` | `array $slugs`、`int $userId`、`int $teamId = 0` | `array` |

## EntityProfile

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `ensure` | `int $entityId`、`array $data = []` | `model\TeamEntityProfile` |
| `listing` | `int $teamId`、`?string $type`、`int $page`、`int $limit`、`bool $canReadAll` | `array` |
| `get` | `int $teamId`、`int $entityId`、`bool $canReadAll` | `array` |
| `update` | `int $teamId`、`int $entityId`、`array $data` | `void` |

## EntityRole

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `list` | `int $teamId`、`string $slug` | `array` |
| `summary` | `int $teamId`、`string $slug` | `array` |
| `save` | `int $teamId`、`string $slug`、`array $roleIds` | `int` |
| `describe` | `int $teamId`、`string $slug` | `array` |

## EntitySelfManagement

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `current` | `?array $actingEntity` | `array` |
| `updateProfile` | `array $actingEntity`、`int $expectedEntityId`、`array $data` | `void` |
| `claimSlug` | `array $actingEntity`、`int $expectedEntityId`、`string $slug` | `array` |
| `saveFields` | `array $actingEntity`、`int $expectedEntityId`、`array $values` | `void` |
| `upload` | `array $actingEntity`、`int $expectedEntityId`、`think\file\UploadedFile $file` | `array` |

## File

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `upload` | `think\file\UploadedFile $file`、`int $teamId`、`array $actor`、`enum\FileSource $source = app\enum\FileSource::Manual`、`bool $immediate = false` | `array` |
| `uploadForJoin` | `think\file\UploadedFile $file`、`int $teamId` | `array` |
| `uploadSystem` | `think\file\UploadedFile $file` | `array` |
| `uploadByCommand` | `string $localPath`、`?int $entityId = null`、`?int $teamId = null`、`?string $originalName = null` | `array` |
| `list` | `int $teamId`、`array $filters`、`int $page = 1`、`int $limit = 20` | `array` |
| `get` | `int $teamId`、`int $id` | `array` |
| `delete` | `int $id`、`int $entityId` | `void` |
| `deleteByTeam` | `int $teamId`、`int $id` | `void` |
| `checkAbility` | `int $teamId`、`int $newSize` | `void` |
| `usage` | `int $teamId` | `array` |
| `uploadAvailability` | `int $teamId` | `array` |
| `capacityAbility` | `int $teamId` | `array` |
| `purgeObject` | `string $path` | `void` |
| `expirePending` | `int $now` | `int` |

## FileUsage

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `tracks` | `model\Base $model` | `bool` |
| `activateSaved` | `model\Base $model`、`array $changed` | `void` |

## IdentitySession

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `revokeInactiveMembers` | `int $teamId` | `void` |
| `revokeForEntities` | `array $entityIds` | `void` |
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
| `currentTarget` | `?array $actingEntity` | `array` |

## Inviter

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `resolve` | `mixed $slug` | `?model\Entity` |
| `summary` | `int $targetTeamId`、`mixed $entityId` | `?array` |

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

## ManualEntitlementGrant

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `personalHistory` | `int $teamId`、`int $actorEntityId`、`string $keyword = ''`、`int $page = 1`、`int $limit = 20` | `array` |
| `options` | `int $teamId`、`array $actingEntity`、`int $actorEntityId`、`bool $personal = false` | `array` |
| `grant` | `int $teamId`、`int $actorEntityId`、`array $data`、`bool $personal = false` | `array` |

## Markdown

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `sync` | `think\Model $source`、`string $field`、`?string $markdown` | `void` |
| `deleteSource` | `think\Model $source`、`string $field` | `void` |

## MemberJoinCode

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `issue` | `int $userId` | `array` |
| `addMember` | `int $teamId`、`string $code`、`?array $joinForm = null` | `int` |

## MoneyAllocation

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `split` | `array $totals`、`array $weights` | `array` |

## Notice

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `send` | `int $teamId`、`string $title`、`?string $content = null`、`bool $isPinned = false` | `array` |
| `sendOnce` | `int $teamId`、`string $title`、`?string $content`、`string $dedupKey` | `array` |
| `sendToEntity` | `int $senderTeamId`、`int $entityId`、`string $title`、`?string $content = null`、`bool $isPinned = false` | `array` |
| `list` | `int $teamId`、`array $filters = []`、`int $page = 1`、`int $limit = 20` | `array` |
| `listForEntity` | `int $entityId`、`array $filters = []`、`int $page = 1`、`int $limit = 20` | `array` |
| `listSent` | `int $teamId`、`array $filters = []`、`int $page = 1`、`int $limit = 20` | `array` |
| `getSent` | `int $teamId`、`int $id` | `array` |
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
| `personal` | `int $teamId`、`int $actorEntityId`、`array $filters`、`int $page = 1`、`int $limit = 20` | `array` |
| `getPersonal` | `int $teamId`、`int $actorEntityId`、`int $id` | `array` |
| `get` | `int $teamId`、`int $id` | `array` |
| `create` | `int $teamId`、`array $data` | `int` |
| `cancel` | `int $teamId`、`int $id` | `void` |
| `complete` | `int $teamId`、`int $id` | `void` |
| `deliverClaimProduct` | `model\RedemptionClaim $claim`、`model\TeamCustomer $customer`、`array $entry`、`int $ordinal`、`?int $senderId`、`?int $csId` | `int` |
| `freezeOrdinaryHandlers` | `int $teamId`、`array $snapshot`、`mixed $handlerEntityId`、`array $productHandlers = []` | `array` |

## Pagination

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `normalize` | `int $page`、`int $limit` | `array` |

## PermissionDictionary

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `descriptions` | — | `array` |
| `dynamicDescriptions` | — | `array` |
| `groups` | — | `array` |
| `keys` | — | `array` |
| `contains` | `string $key` | `bool` |
| `isFixedKeyOrParent` | `string $key` | `bool` |
| `adminGroups` | — | `array` |
| `adminKeys` | — | `array` |
| `dynamic` | `string $key` | `?array` |
| `dynamicDescendant` | `string $key` | `?array` |
| `virtual` | `string $slug`、`string $action` | `string` |
| `assume` | `string $type`、`string $slug = '*'` | `string` |
| `documentManage` | `string $type`、`string $slug = '*'` | `string` |
| `entityField` | `string $type` | `string` |

## PermissionGate

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `assert` | `int $teamId`、`array\|int $subject`、`array $permissionKeys` | `void` |
| `effective` | `int $teamId`、`array\|int $subject` | `array` |
| `allows` | `int $teamId`、`array\|int $subject`、`array $permissionKeys` | `bool` |
| `delegatedAllows` | `int $targetTeamId`、`array $source`、`model\Entity $target` | `bool` |
| `candidates` | `think\Request $request`、`string ...$templates` | `array` |
| `assertKey` | `string $key` | `void` |

## PersonalPricing

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `allows` | `int $teamId`、`array $actingEntity` | `bool` |
| `preserve` | `array $data`、`array $baseline` | `array` |
| `defaults` | `int $teamId`、`mixed $price`、`mixed $cost`、`string $prefix = ''` | `array` |

## PlatformAdmin

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `dashboard` | `int $userId` | `array` |
| `search` | `string $keyword`、`int $userId` | `array` |
| `users` | `array $filters`、`bool $includeSensitive = false` | `array` |
| `user` | `int $id`、`bool $includeSensitive = false` | `array` |
| `moderateUser` | `int $actorUserId`、`int $targetUserId`、`bool $banned`、`string $reason`、`think\Request $request` | `void` |
| `revokeUserSessions` | `int $actorUserId`、`int $targetUserId`、`string $reason`、`think\Request $request` | `void` |
| `teams` | `array $filters` | `array` |
| `team` | `int $id` | `array` |
| `grantTeamAbility` | `int $actorUserId`、`int $teamId`、`string $abilityKey`、`int $level`、`int $expireTime`、`?think\Request $request = null`、`bool $enforceCatalogLevels = true` | `array` |
| `grantTeamAbilityBySlug` | `int $actorUserId`、`string $teamSlug`、`string $abilityKey`、`int $level`、`int $expireTime`、`?think\Request $request = null` | `array` |
| `moderateTeam` | `int $actorUserId`、`int $teamId`、`bool $banned`、`string $reason`、`think\Request $request` | `void` |
| `auditEvents` | `array $filters` | `array` |
| `systemHealth` | — | `array` |

## PlatformAdminAccess

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `session` | `int $userId` | `array` |
| `assertAdmin` | `int $userId` | `void` |
| `has` | `int $userId`、`string $permission` | `bool` |
| `assert` | `int $userId`、`string ...$permissions` | `void` |
| `administrators` | — | `array` |
| `roles` | — | `array` |
| `role` | `int $id` | `array` |
| `createRole` | `array $data`、`int $actorUserId`、`?think\Request $request = null` | `int` |
| `updateRole` | `int $id`、`array $data`、`int $actorUserId`、`?think\Request $request = null` | `void` |
| `deleteRole` | `int $id`、`int $actorUserId`、`?think\Request $request = null` | `void` |
| `savePermissions` | `int $roleId`、`array $permissionKeys`、`int $actorUserId`、`?think\Request $request = null` | `void` |
| `assignRoles` | `int $actorUserId`、`int $targetUserId`、`array $roleIds`、`?think\Request $request = null` | `void` |
| `grantByKey` | `int $userId`、`string $roleKey` | `void` |
| `revokeByKey` | `int $userId`、`string $roleKey` | `void` |
| `bootstrapSuperRole` | — | `void` |
| `assertAnotherActiveSuperAdmin` | `int $excludedUserId` | `void` |

## Product

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `list` | `int $teamId`、`array $filters`、`int $page = 1`、`int $limit = 20` | `array` |
| `get` | `int $teamId`、`int $id` | `array` |
| `create` | `int $teamId`、`array $data`、`bool $canReprice = true` | `int` |
| `edit` | `int $teamId`、`int $id`、`array $data`、`bool $canReprice = true` | `void` |
| `delete` | `int $teamId`、`int $id` | `void` |
| `setHandlers` | `int $teamId`、`int $productId`、`array $entityIds` | `void` |

## ProductComposition

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `inspectStored` | `array $root` | `array` |
| `inspect` | `array $root`、`callable $load` | `array` |
| `deliveries` | `array $root`、`callable $load`、`bool $redeemCard = false` | `array` |

## ProductPurchaseField

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `normalize` | `mixed $rows`、`array $existing = []` | `array` |
| `snapshot` | `array $fields`、`mixed $values` | `array` |

## ProductSelfManagement

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `list` | `int $teamId`、`array $actingEntity`、`array $filters`、`int $page`、`int $limit` | `array` |
| `options` | `int $teamId`、`array $actingEntity` | `array` |
| `get` | `int $teamId`、`array $actingEntity`、`int $id` | `array` |
| `create` | `int $teamId`、`array $actingEntity`、`int $expectedEntityId`、`array $data` | `int` |
| `edit` | `int $teamId`、`array $actingEntity`、`int $expectedEntityId`、`int $id`、`array $data` | `void` |
| `setHandlers` | `int $teamId`、`array $actingEntity`、`int $expectedEntityId`、`int $id`、`array $entityIds` | `void` |

## ProductVariant

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `assertAvailable` | `model\TeamProduct $product` | `void` |
| `displayName` | `model\TeamProduct $product` | `string` |

## Redemption

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `issueForOrder` | `model\TeamOrder $order`、`model\TeamProduct $product` | `array` |
| `issue` | `int $campaignId`、`?int $holderEntityId = null`、`array $target = []` | `model\RedemptionCode` |
| `held` | `int $holderEntityId` | `array` |
| `reveal` | `int $holderEntityId`、`int $id` | `array` |
| `inspect` | `string $plain` | `array` |
| `claimForTeam` | `string $plain`、`int $teamId`、`int $actorEntityId` | `int` |
| `claimForCustomer` | `string $plain`、`int $teamId`、`int $customerId`、`int $holderEntityId` | `int` |

## RedemptionCrypto

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `generate` | — | `string` |
| `hash` | `string $code` | `string` |
| `encrypt` | `string $code` | `string` |
| `decrypt` | `string $payload` | `string` |
| `hint` | `string $code` | `string` |

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

## ServiceAdjustment

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `create` | `int $teamId`、`array $subject`、`int $actorEntityId`、`int $instanceId`、`array $data` | `int` |
| `accept` | `int $teamId`、`int $customerId`、`int $actorEntityId`、`int $instanceId`、`int $adjustmentId` | `void` |
| `reject` | `int $teamId`、`int $customerId`、`int $actorEntityId`、`int $instanceId`、`int $adjustmentId` | `void` |
| `cancel` | `int $teamId`、`array $subject`、`int $actorEntityId`、`int $instanceId`、`int $adjustmentId` | `void` |
| `createPerformancesForInstance` | `model\TeamServiceInstance $instance` | `void` |

## ServiceQuantity

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `scaleForStep` | `mixed $step` | `int` |
| `normalize` | `mixed $value`、`mixed $step` | `string` |
| `toMinor` | `mixed $value` | `int` |
| `fromMinor` | `int $minor` | `string` |
| `display` | `mixed $value`、`mixed $step` | `string` |

## ServiceRedemption

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `customerList` | `int $teamId`、`int $customerId`、`array $filters`、`int $page = 1`、`int $limit = 20` | `array` |
| `customerGet` | `int $teamId`、`int $customerId`、`int $id` | `array` |
| `handlers` | `int $teamId`、`int $customerId`、`int $id` | `array` |
| `createOffer` | `int $teamId`、`int $customerId`、`int $entitlementId`、`mixed $quantity`、`int $handlerEntityId`、`string $memo`、`array $fieldValues`、`int $actorEntityId`、`string $idempotencyKey = ''` | `int` |
| `withdrawOffer` | `int $teamId`、`int $customerId`、`int $actorEntityId`、`int $id`、`string $reason = ''` | `void` |
| `assignmentOffers` | `int $teamId`、`int $actorEntityId`、`int $page = 1`、`int $limit = 20` | `array` |
| `assignmentOffer` | `int $teamId`、`int $actorEntityId`、`int $id` | `array` |
| `acceptOffer` | `int $teamId`、`int $actorEntityId`、`int $id`、`array $fieldValues = []` | `int` |
| `rejectOffer` | `int $teamId`、`int $actorEntityId`、`int $id`、`string $reason = ''` | `void` |
| `start` | `int $teamId`、`int $customerId`、`int $entitlementId`、`mixed $quantity`、`int $handlerEntityId`、`string $memo`、`array $fieldValues`、`int $actorEntityId` | `int` |
| `restart` | `int $teamId`、`int $customerId`、`int $id`、`int $handlerEntityId`、`string $memo`、`array $fieldValues`、`int $actorEntityId` | `void` |
| `requestCancel` | `int $teamId`、`int $customerId`、`int $id`、`string $reason`、`int $actorEntityId` | `int` |
| `list` | `int $teamId`、`array $subject`、`int $actorEntityId`、`array $filters`、`int $page = 1`、`int $limit = 20`、`bool $forcePersonal = false` | `array` |
| `get` | `int $teamId`、`array $subject`、`int $actorEntityId`、`int $id`、`bool $forcePersonal = false` | `array` |
| `availableHandlers` | `int $teamId`、`array $subject`、`int $actorEntityId`、`int $id` | `array` |
| `claimable` | `int $teamId`、`int $actorEntityId`、`int $page = 1`、`int $limit = 20` | `array` |
| `claimableGet` | `int $teamId`、`int $actorEntityId`、`int $id` | `array` |
| `claim` | `int $teamId`、`int $actorEntityId`、`int $id`、`mixed $quantity = null`、`array $fieldValues = []` | `int` |
| `returnToPool` | `int $teamId`、`int $actorEntityId`、`int $id`、`string $reason` | `void` |
| `invalidateOffersForHandlers` | `int $teamId`、`int $serviceId`、`array $entityIds` | `void` |
| `approveCancel` | `int $teamId`、`array $subject`、`int $actorEntityId`、`int $id` | `void` |
| `rejectCancel` | `int $teamId`、`array $subject`、`int $actorEntityId`、`int $id`、`string $reason` | `void` |
| `reject` | `int $teamId`、`array $subject`、`int $actorEntityId`、`int $id`、`string $reason` | `void` |
| `reassign` | `int $teamId`、`array $subject`、`int $actorEntityId`、`int $id`、`int $handlerEntityId`、`string $reason` | `void` |
| `complete` | `int $teamId`、`array $subject`、`int $actorEntityId`、`int $id`、`array $fieldValues = []` | `void` |
| `completeOwn` | `int $teamId`、`int $actorEntityId`、`int $id`、`array $fieldValues = []` | `void` |
| `confirmCompletion` | `int $teamId`、`int $customerId`、`int $actorEntityId`、`int $id` | `void` |
| `rejectCompletion` | `int $teamId`、`int $customerId`、`int $actorEntityId`、`int $id`、`string $reason` | `void` |
| `autoCompleteDue` | `?int $now = null`、`int $limit = 100` | `array` |
| `autoCompleteUnusedDue` | `?int $now = null`、`int $limit = 100` | `array` |

## ServiceRedemptionField

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `list` | `int $teamId`、`int $serviceId` | `array` |
| `sync` | `int $teamId`、`int $serviceId`、`array $rows` | `array` |
| `fieldsForInstance` | `model\TeamServiceInstance $instance`、`bool $customer` | `array` |
| `fieldsForService` | `int $teamId`、`int $serviceId`、`bool $customer`、`?int $instanceId = null`、`int $resourceIndex = 1` | `array` |
| `resourcesForInstance` | `model\TeamServiceInstance $instance`、`bool $customer` | `array` |
| `saveForStage` | `model\TeamServiceInstance $instance`、`string $stage`、`array $values` | `void` |
| `saveResourcesForStage` | `model\TeamServiceInstance $instance`、`string $stage`、`array $values` | `void` |
| `validateForService` | `int $teamId`、`int $serviceId`、`string $stage`、`array $values` | `array` |
| `validateResourcesForService` | `int $teamId`、`int $serviceId`、`string $stage`、`mixed $quantity`、`mixed $step`、`array $values` | `array` |
| `fieldsForValues` | `int $teamId`、`int $serviceId`、`array $values` | `array` |
| `resourcesForValues` | `int $teamId`、`int $serviceId`、`mixed $quantity`、`mixed $step`、`array $values`、`bool $customer = false` | `array` |
| `copyStageValues` | `model\TeamServiceInstance $source`、`model\TeamServiceInstance $target`、`string $stage` | `void` |
| `splitStageValues` | `model\TeamServiceInstance $source`、`model\TeamServiceInstance $target`、`string $stage`、`int $claimedResourceCount` | `void` |
| `resourceCount` | `string $quantity`、`string $step` | `int` |

## ShopAvailability

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `open` | `int $teamId` | `bool` |
| `assertOpen` | `int $teamId` | `void` |

## SiteContent

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `get` | `bool $public = false` | `array` |
| `save` | `array $input`、`think\Request $request` | `array` |
| `normalize` | `array $input` | `array` |

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

## TeamAccess

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `snapshot` | `int $teamId`、`array $actingEntity`、`?think\Request $request = null` | `array` |
| `ability` | `int $teamId`、`string $key`、`string $label`、`int $minimumLevel = 1` | `array` |
| `fileAbility` | `int $teamId` | `array` |

## TeamAudit

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `catalog` | — | `array` |
| `list` | `int $teamId`、`array $filters` | `array` |
| `get` | `int $teamId`、`int $id` | `array` |

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

## TeamCustomerManagement

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `listing` | `int $teamId`、`array $actingEntity`、`array $filters`、`int $page`、`int $limit` | `array` |
| `personalListing` | `int $teamId`、`int $entityId`、`array $filters`、`int $page`、`int $limit` | `array` |
| `get` | `int $teamId`、`array $actingEntity`、`int $customerId` | `array` |
| `update` | `int $teamId`、`int $customerId`、`array $data` | `void` |
| `assignees` | `int $teamId` | `array` |

## TeamDashboard

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `summary` | `int $teamId`、`array $actingEntity` | `array` |

## TeamEntityField

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `normalizeValue` | `string $type`、`mixed $value`、`array $options = []` | `array` |
| `emptyValue` | `mixed $value` | `bool` |
| `list` | `int $teamId`、`string $entityType` | `array` |
| `get` | `int $teamId`、`int $id` | `array` |
| `create` | `int $teamId`、`array $data` | `int` |
| `update` | `int $teamId`、`int $id`、`array $data` | `void` |
| `delete` | `int $teamId`、`int $id` | `void` |
| `typeFor` | `int $teamId`、`int $id` | `string` |
| `values` | `int $teamId`、`string $entitySlug` | `array` |
| `visibleFields` | `int $teamId`、`string $entityType`、`int $subjectEntityId`、`array $actingEntity`、`bool $isFieldManager = false` | `array` |
| `visibleValues` | `int $teamId`、`int $subjectEntityId`、`string $entityType`、`array $actingEntity`、`bool $isFieldManager = false` | `array` |
| `saveValues` | `int $teamId`、`string $entitySlug`、`array $values` | `int` |
| `saveOwnValues` | `int $teamId`、`string $entitySlug`、`array $values` | `void` |
| `teamActor` | `int $teamId`、`string $entitySlug` | `array` |

## TeamJoin

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `form` | `int $teamId`、`int $userId` | `array` |
| `fields` | `int $teamId`、`bool $onlyFillable = false` | `array` |
| `transferOptions` | `int $teamId` | `array` |
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
| `list` | `int $teamId`、`array $actingEntity`、`?string $statusCode = null` | `array` |
| `get` | `int $teamId`、`int $memberId`、`array $actingEntity` | `array` |
| `capabilities` | `int $teamId`、`array $subject`、`array $member` | `array` |
| `add` | `int $teamId`、`int $userId`、`array $data` | `int` |
| `edit` | `int $teamId`、`int $memberId`、`array $data` | `void` |
| `block` | `int $teamId`、`int $memberId` | `void` |
| `unblock` | `int $teamId`、`int $memberId` | `void` |

## TeamMemberDeparture

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `directMemberId` | `int $teamId`、`mixed $actingEntity`、`mixed $session`、`int $authenticatedUserId` | `int` |
| `list` | `int $teamId`、`array $filters`、`int $page`、`int $limit` | `array` |
| `get` | `int $teamId`、`int $id` | `array` |
| `mine` | `int $teamId`、`int $memberId` | `array` |
| `apply` | `int $teamId`、`int $memberId`、`int $requesterEntityId` | `array` |
| `depart` | `int $teamId`、`int $memberId`、`int $decisionEntityId` | `int` |
| `cancel` | `int $teamId`、`int $memberId`、`int $id`、`int $decisionEntityId` | `void` |
| `approve` | `int $teamId`、`int $id`、`int $decisionEntityId` | `int` |
| `reject` | `int $teamId`、`int $id`、`int $decisionEntityId` | `void` |

## TeamSetting

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `internal` | `int $teamId`、`string $appName` | `array` |
| `internalTyped` | `int $teamId`、`string $appName` | `array` |
| `internalMany` | `array $teamIds`、`string $appName` | `array` |
| `get` | `int $teamId`、`string $appName`、`array $actingEntity` | `array` |
| `schema` | `int $teamId` | `array` |
| `set` | `int $teamId`、`string $appName`、`string $key`、`mixed $value`、`int $visibility = 1`、`array $targets = []` | `void` |
| `batch` | `int $teamId`、`string $appName`、`array $kv` | `void` |
| `closeShop` | `int $teamId` | `bool` |

## Transaction

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `options` | `int $teamId`、`?int $actorEntityId = null` | `array` |
| `list` | `int $teamId`、`array $filters`、`int $page = 1`、`int $limit = 20` | `array` |
| `personal` | `int $teamId`、`int $actorEntityId`、`array $filters`、`int $page = 1`、`int $limit = 20` | `array` |
| `getPersonal` | `int $teamId`、`int $actorEntityId`、`int $id` | `array` |
| `get` | `int $teamId`、`int $id` | `array` |
| `create` | `int $teamId`、`array $data` | `int` |
| `createEntitlementReceipt` | `model\TeamServiceEntitlement $entitlement`、`array $data` | `int` |
| `createServiceRedemption` | `int $teamId`、`array $data` | `int` |
| `createUnusedServiceSettlement` | `int $teamId`、`array $data` | `int` |
| `createServiceAdjustmentReceipt` | `int $teamId`、`array $data` | `int` |
| `createServiceAdjustmentPerformance` | `int $teamId`、`array $data` | `int` |
| `edit` | `int $teamId`、`int $id`、`array $data` | `void` |
| `delete` | `int $teamId`、`int $id` | `void` |

## TransactionStats

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `personal` | `int $teamId`、`int $actorEntityId`、`int $startTime`、`int $endTime` | `array` |
| `summary` | `int $teamId`、`int $startTime`、`int $endTime` | `array` |
| `byRole` | `int $teamId`、`int $startTime`、`int $endTime` | `array` |
| `byEntity` | `int $teamId`、`int $startTime`、`int $endTime`、`string $role` | `array` |
| `timeline` | `int $teamId`、`int $startTime`、`int $endTime`、`string $granularity = 'day'` | `array` |
| `byPerson` | `int $teamId`、`int $startTime`、`int $endTime`、`int $page = 1`、`int $limit = 20`、`string $sortBy = 'handler_performance_total'`、`string $sortOrder = 'desc'` | `array` |
| `byCustomer` | `int $teamId`、`int $startTime`、`int $endTime` | `array` |
| `byAssignee` | `int $teamId`、`int $startTime`、`int $endTime` | `array` |

## Visibility

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `isTeamManager` | `int $teamId`、`array $actingEntity` | `bool` |
| `assertManage` | `enum\ManageScope $scope`、`bool $isTeamManager`、`bool $isSubject` | `void` |
| `assertView` | `think\Model $model`、`int $actingEntityId`、`bool $isTeamManager`、`bool $isSubject` | `void` |
| `canView` | `think\Model $model`、`int $actingEntityId`、`bool $isTeamManager`、`bool $isSubject` | `bool` |
| `syncTargets` | `think\Model $model`、`array $targets`、`int $teamId` | `void` |
| `normalizeTargets` | `array $targets`、`int $teamId` | `array` |

## WeiboAccounts

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `list` | `int $teamId`、`int $entityId`、`bool $teamScope` | `array` |
| `detail` | `int $teamId`、`int $entityId`、`int $accountId`、`bool $teamScope` | `array` |
| `start` | `int $teamId`、`int $entityId`、`string $phone` | `array` |
| `confirm` | `int $teamId`、`int $entityId`、`string $challengeId`、`string $code` | `array` |
| `check` | `int $teamId`、`int $entityId`、`int $accountId`、`bool $teamScope` | `array` |
| `unbind` | `int $teamId`、`int $entityId`、`int $bindingId`、`bool $teamScope` | `void` |
| `bound` | `int $teamId`、`int $entityId`、`int $accountId`、`bool $teamScope` | `model\WeiboAccount` |

## WeiboCommentPresets

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `personalList` | `int $teamId`、`int $entityId` | `array` |
| `teamList` | `int $teamId` | `array` |
| `replacePersonal` | `int $teamId`、`int $entityId`、`array $contents` | `array` |
| `replaceTeam` | `int $teamId`、`array $contents` | `array` |

## WeiboFeed

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `list` | `int $teamId`、`array $actingEntity`、`int $page = 1`、`int $limit = 20` | `array` |
| `get` | `int $teamId`、`array $actingEntity`、`int $postId` | `array` |
| `comment` | `int $teamId`、`int $entityId`、`int $postId`、`int $accountId`、`string $comment` | `array` |

## WeiboFeedPoller

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `run` | — | `array` |
| `classifyPending` | — | `array` |
| `extractSearchStatuses` | `array $payload` | `array` |

## WeiboMediaLibrary

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `upload` | `int $teamId`、`int $resourceEntityId`、`int $accountId`、`bool $teamScope`、`think\file\UploadedFile $file` | `array` |
| `content` | `int $teamId`、`int $entityId`、`int $mediaId`、`bool $teamScope` | `array` |

## WeiboOperations

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `execute` | `int $teamId`、`?int $ownerEntityId`、`?int $actorEntityId`、`int $accountId`、`enum\WeiboOperationType $type`、`array $payload`、`enum\WeiboOperationSource $source = app\enum\WeiboOperationSource::Manual`、`?int $taskId = null`、`?int $taskVersion = null`、`?string $dispatchKey = null`、`?int $plannedAt = null` | `array` |
| `list` | `int $teamId`、`int $entityId`、`bool $teamScope`、`int $page = 1`、`int $limit = 20` | `array` |
| `dto` | `model\WeiboOperationLog $log` | `array` |

## WeiboProtocol

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `generateS` | `string $uid`、`string $from` | `string` |
| `media` | `array $pids` | `array` |
| `dynamicFrom` | — | `string` |
| `sendLoginSms` | `string $phone` | `array` |
| `login` | `string $phone`、`string $code`、`string $from` | `array` |
| `check` | `model\WeiboAccount $account` | `array` |
| `resolveSupertopic` | `string $name` | `array` |
| `statusIdFromUrl` | `string $url` | `string` |
| `upload` | `model\WeiboAccount $account`、`string $path`、`string $contentType = 'application/octet-stream'` | `array` |
| `imageContent` | `string $pid` | `array` |
| `post` | `model\WeiboAccount $account`、`array $topic`、`string $content`、`array $pids = []` | `array` |
| `checkin` | `model\WeiboAccount $account`、`array $topic` | `array` |
| `like` | `model\WeiboAccount $account`、`string $statusId` | `array` |
| `comment` | `model\WeiboAccount $account`、`string $statusId`、`string $comment` | `array` |
| `classify` | `array $payload`、`int $httpStatus = 200` | `array` |

## WeiboTasks

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `list` | `int $teamId`、`int $entityId`、`bool $teamScope` | `array` |
| `get` | `int $teamId`、`int $entityId`、`int $id`、`bool $teamScope` | `array` |
| `create` | `int $teamId`、`int $actorEntityId`、`?int $ownerEntityId`、`array $data` | `array` |
| `edit` | `int $teamId`、`int $entityId`、`int $id`、`bool $teamScope`、`array $data` | `array` |
| `transition` | `int $teamId`、`int $entityId`、`int $id`、`bool $teamScope`、`string $action` | `array` |
| `enqueue` | `model\WeiboTask $task` | `void` |
| `recover` | `?int $taskId = null` | `int` |
| `dto` | `model\WeiboTask $task` | `array` |

## WorkspaceAccess

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `inspect` | `int $teamId`、`array $subject` | `array` |
| `assert` | `int $teamId`、`array $subject`、`string $teamSlug` | `array` |

## WorkspaceWarning

| 方法 | 参数 | 返回 |
| --- | --- | --- |
| `context` | `string $teamSlug`、`array $subject`、`int $entityId`、`think\Request $request` | `array` |
| `state` | `int $teamId`、`int $entityId`、`bool $external`、`?think\Request $request = null` | `array` |
| `acknowledge` | `think\Request $request`、`int $teamId`、`int $entityId` | `array` |
