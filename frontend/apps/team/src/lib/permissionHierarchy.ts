export function permissionCovers(granted: string, required: string): boolean {
  const grantedSegments = granted.split('.').filter(Boolean)
  const requiredSegments = required.split('.').filter(Boolean)
  if (!grantedSegments.length || grantedSegments.length > requiredSegments.length) return false

  return grantedSegments.every((segment, index) => (
    segment === requiredSegments[index]
    || segment === '*'
  ))
}

export function coveringPermission(permissions: string[], required: string): string | undefined {
  return permissions
    .filter(permission => permission !== required && permissionCovers(permission, required))
    .sort((left, right) => right.split('.').length - left.split('.').length)[0]
}

export function minimalPermissions(permissions: string[]): string[] {
  const ordered = [...new Set(permissions.filter(Boolean))].sort((left, right) => (
    left.split('.').length - right.split('.').length
    || left.localeCompare(right)
  ))
  const minimal: string[] = []
  for (const permission of ordered) {
    if (!minimal.some(granted => permissionCovers(granted, permission))) minimal.push(permission)
  }
  return minimal.sort()
}

export function selectPermissionScope(permissions: string[], scope: string): string[] {
  return minimalPermissions([...permissions, scope])
}

export function permissionsForSave(permissions: string[]): string[] {
  return minimalPermissions(permissions)
}
