import { formatAbilityDenied, formatPermissionDenied } from '@lostsky/api/error-format'

export interface AccessSnapshotLike {
  permissions?: string[]
  abilities?: Record<string, {
    enabled: boolean
    label: string
  } | undefined>
}

export function hasPermission(snapshot: AccessSnapshotLike | undefined, permission: string) {
  return Boolean(snapshot?.permissions?.includes(permission))
}

export function hasPermissionMatching(
  snapshot: AccessSnapshotLike | undefined,
  pattern: RegExp,
) {
  return Boolean(snapshot?.permissions?.some(permission => pattern.test(permission)))
}

export function permissionReason(permission: string) {
  return formatPermissionDenied([permission])
}

export function abilityReason(key: string, label: string) {
  return formatAbilityDenied(key, label)
}

export function fileUploadReason(snapshot: AccessSnapshotLike | undefined) {
  if (!snapshot) return ''
  const ability = snapshot.abilities?.file
  if (ability && !ability.enabled) return abilityReason('file', ability.label ?? '文件上传')
  if (snapshot.permissions && !hasPermission(snapshot, 'file.upload')) return permissionReason('file.upload')
  return ''
}
