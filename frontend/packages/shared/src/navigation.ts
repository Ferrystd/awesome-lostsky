const ACCOUNT_LOGIN_URL = '//account.lostsky.work/login'

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
  return `${ACCOUNT_LOGIN_URL}?${query}`
}

export function redirectToLogin(options: LoginRedirectOptions = {}) {
  const target = loginUrl(options)
  if (options.replace === false) location.assign(target)
  else location.replace(target)
}
