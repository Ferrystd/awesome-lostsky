import { currentEntityUrl } from '@lostsky/shared/navigation'

export interface IdentityManagementLink {
  href: string
  label: string
}

export function identityManagementLink(_type?: string): IdentityManagementLink {
  return { href: currentEntityUrl(location.href), label: '当前实体' }
}

export function redirectLegacyProfile() {
  location.replace(identityManagementLink().href)
}
