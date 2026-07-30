import { auth } from '@lostsky/api/client'
import { identityUrl, shopWorkspaceUrl, teamWorkspaceUrl } from '@lostsky/shared/navigation'

export interface IdentityManagementLink {
  href: string
  label: string
}

export function identityManagementLink(type = auth.entity()?.type): IdentityManagementLink {
  if (type === 'teamCustomer') {
    return { href: shopWorkspaceUrl('/customer/profile'), label: '顾客中心' }
  }
  if (type === 'teamMember') {
    return { href: teamWorkspaceUrl('/me'), label: '我的资料' }
  }
  return { href: identityUrl(location.href), label: '切换身份' }
}

export function redirectLegacyProfile() {
  location.replace(identityManagementLink().href)
}
