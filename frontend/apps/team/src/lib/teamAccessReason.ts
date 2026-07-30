export interface AccessSnapshotLike {
  permissions: string[]
  abilities: Record<string, {
    enabled: boolean
    label: string
  } | undefined>
}

export function hasPermission(snapshot: AccessSnapshotLike | undefined, permission: string) {
  return Boolean(snapshot?.permissions.includes(permission))
}

export function hasPermissionMatching(
  snapshot: AccessSnapshotLike | undefined,
  pattern: RegExp,
) {
  return Boolean(snapshot?.permissions.some(permission => pattern.test(permission)))
}

export function permissionReason(permission: string) {
  return `缺少权限(Permission): ${permission}`
}

export function abilityReason(key: string, label: string) {
  return `当前团队缺失能力(Ability): ${label}(${key.charAt(0).toUpperCase()}${key.slice(1)})`
}

export function fileUploadReason(snapshot: AccessSnapshotLike | undefined) {
  if (!snapshot) return ''
  const ability = snapshot.abilities.file
  if (!ability?.enabled) return abilityReason('file', ability?.label ?? '文件上传')
  if (!hasPermission(snapshot, 'file.upload')) return permissionReason('file.upload')
  return ''
}
