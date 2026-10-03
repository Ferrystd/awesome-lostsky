import { identityUrl } from '@lostsky/shared/navigation'

export interface IdentityManagementLink { href: string; label: string }
export function identityManagementLink(): IdentityManagementLink {
  return { href: identityUrl(location.href), label: '切换身份' }
}
export function redirectLegacyProfile() { location.replace(identityManagementLink().href) }
