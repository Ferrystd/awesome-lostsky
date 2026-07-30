const ACCOUNT_LOGIN_URL = '//account.lostsky.work/login'
const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost', '::1'])
const LOCAL_APP_PORTS = new Set(['5173', '5174', '5175', '5176', '5177', '5178', '5179', '5180'])

function isLocalDevelopmentHost(hostname: string | undefined) {
  return import.meta.env.DEV && Boolean(hostname && LOCAL_HOSTS.has(hostname))
}

function isLostSkyHost(hostname: string | undefined) {
  return Boolean(hostname && (hostname === 'lostsky.work' || hostname.endsWith('.lostsky.work')))
}

function accountDevelopmentUrl(path: string) {
  if (!import.meta.env.DEV) return ''
  if (isLocalDevelopmentHost(location.hostname)) {
    return `${location.protocol}//${location.hostname}:5174${path}`
  }
  if (isLostSkyHost(location.hostname)) {
    const port = location.port ? ':5174' : ''
    return `${location.protocol}//account.lostsky.work${port}${path}`
  }
  return ''
}

function accountLoginUrl() {
  return accountDevelopmentUrl('/login') || ACCOUNT_LOGIN_URL
}

function accountIdentityUrl() {
  return accountDevelopmentUrl('/identity') || '//account.lostsky.work/identity'
}

export interface LoginRedirectOptions {
  redirect?: string
  expired?: boolean
  replace?: boolean
}

export function safeRedirect(value: unknown, fallback = '/teams') {
  if (typeof value !== 'string' || !value) return fallback
  if (value.startsWith('/') && !value.startsWith('//')) return value
  try {
    const url = new URL(value)
    if (url.protocol === 'https:' && (url.hostname === 'lostsky.work' || url.hostname.endsWith('.lostsky.work'))) return url.href
    if (
      typeof location !== 'undefined'
      && url.protocol === location.protocol
      && isLostSkyHost(location.hostname)
      && isLostSkyHost(url.hostname)
      && (!url.port || (import.meta.env.DEV && LOCAL_APP_PORTS.has(url.port)))
    ) return url.href
    if (
      typeof location !== 'undefined'
      && import.meta.env.DEV
      && url.protocol === location.protocol
      && (!url.port || LOCAL_APP_PORTS.has(url.port))
      && isLocalDevelopmentHost(location.hostname)
      && url.hostname === location.hostname
    ) return url.href
  } catch { /* invalid redirect falls back */ }
  return fallback
}

export function goToSafeRedirect(value: unknown, fallback = '/teams') {
  const target = safeRedirect(value, fallback)
  location.replace(target)
}

export function loginUrl(options: Omit<LoginRedirectOptions, 'replace'> = {}) {
  const query = new URLSearchParams({ redirect: options.redirect ?? location.href })
  if (options.expired) query.set('expired', '1')
  return `${accountLoginUrl()}?${query}`
}

export function redirectToLogin(options: LoginRedirectOptions = {}) {
  const target = loginUrl(options)
  if (options.replace === false) location.assign(target)
  else location.replace(target)
}

function workspaceUrl(
  app: 'chat' | 'shop' | 'team',
  developmentPort: number,
  path = '/',
  params: Record<string, string | number | boolean | null | undefined> = {},
) {
  const host = location.hostname.replace(
    /\.(?:account|team|chat|transaction|display|shop|admin)\./,
    `.${app}.`,
  )
  const port = import.meta.env.DEV ? `:${developmentPort}` : location.port ? `:${location.port}` : ''
  const url = new URL(path, `${location.protocol}//${host}${port}`)
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== '') url.searchParams.set(key, String(value))
  }
  return url.href
}

export function chatWorkspaceUrl(
  path = '/',
  params: Record<string, string | number | boolean | null | undefined> = {},
) {
  return workspaceUrl('chat', 5176, path, params)
}

export function shopWorkspaceUrl(path = '/') {
  return workspaceUrl('shop', 5179, path)
}

export function teamWorkspaceUrl(path = '/') {
  return workspaceUrl('team', 5175, path)
}

export type EntityCallbackReason = 'missing' | 'team_mismatch'

export function identityUrl(redirect = location.href, targetSlug = '') {
  const query = new URLSearchParams()
  const target = safeRedirect(redirect, '')
  if (target) query.set('redirect', target)
  if (/^[a-z0-9][a-z0-9_-]{0,49}$/.test(targetSlug)) query.set('target', targetSlug)
  const base = accountIdentityUrl()
  return query.size ? `${base}?${query}` : base
}

export function memberIdentityCallbackUrl(teamSlug: string, reason: EntityCallbackReason) {
  const query = new URLSearchParams({ team_slug: teamSlug, reason })
  const returnTo = safeRedirect(location.href, '')
  if (returnTo) query.set('return_to', returnTo)
  return `${accountIdentityUrl()}/member-callback?${query}`
}

export function redirectToMemberIdentity(teamSlug: string, reason: EntityCallbackReason) {
  location.assign(memberIdentityCallbackUrl(teamSlug, reason))
}
