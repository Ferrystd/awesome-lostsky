import defaults from '../../../../config/site-content.json'

export interface SiteMember {
  name: string
  role: string
  description: string
  tags: string[]
  initials: string
  avatar: string
  visible: boolean
}
export interface SiteStat { value: string; label: string; visible: boolean }
export interface SiteContent { icp: string; members: SiteMember[]; stats: SiteStat[] }
export const defaultSiteContent = (): SiteContent => JSON.parse(JSON.stringify(defaults))

/** Public request has no login dependency and never sends a bearer token. */
export async function loadPublicSiteContent(): Promise<SiteContent> {
  const base = import.meta.env.DEV ? '/api' : (import.meta.env.VITE_API_BASE || '//api.lostsky.work')
  const response = await fetch(`${base}/site-content`, { headers: { 'X-LostSky-App': 'common' }, credentials: 'omit', cache: 'no-store', signal: AbortSignal.timeout(10000) })
  const envelope = await response.json()
  if (!response.ok || envelope.code !== 0 || !envelope.data || !Array.isArray(envelope.data.members) || !Array.isArray(envelope.data.stats) || typeof envelope.data.icp !== 'string') throw new Error('官网内容暂时不可用')
  return envelope.data as SiteContent
}
