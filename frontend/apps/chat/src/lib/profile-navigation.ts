import { auth } from '@lostsky/api/client'
import { identityUrl, shopWorkspaceUrl, teamWorkspaceUrl } from '@lostsky/shared/navigation'

export interface IdentityManagementLink {
  href: string
  label: string
}

export function identityManagementLink(type = auth.entity()?.type): IdentityManagementLink {
  if (type === 'team' || type === 'teamMember' || type === 'teamVirtual') return { href: teamWorkspaceUrl('/personal'), label: '个人工作台' }
  if (type === 'teamCustomer') return { href: shopWorkspaceUrl('/customer/profile'), label: '客户中心' }
  return { href: identityUrl(location.href), label: '切换身份' }
}

export function redirectLegacyProfile() {
  location.replace(identityManagementLink().href)
}
