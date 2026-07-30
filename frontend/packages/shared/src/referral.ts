export const REFERRAL_QUERY_KEY = 'ref'
const STORAGE_KEY = 'lostsky_referral_slug'
const SLUG_PATTERN = /^[a-z][a-z0-9_-]{1,49}$/

export function normalizeReferral(value: unknown) {
  const raw = Array.isArray(value) ? value[0] : value
  if (typeof raw !== 'string') return ''
  const slug = raw.trim().toLowerCase()
  return SLUG_PATTERN.test(slug) ? slug : ''
}

export function storedReferral() {
  try {
    return normalizeReferral(localStorage.getItem(STORAGE_KEY))
  } catch {
    return ''
  }
}

export function syncReferral(value: unknown) {
  const explicit = normalizeReferral(value)
  if (explicit) {
    try { localStorage.setItem(STORAGE_KEY, explicit) } catch { /* storage can be unavailable */ }
    return explicit
  }
  return storedReferral()
}

export function withReferral(value: string, slug = storedReferral()) {
  const referral = normalizeReferral(slug)
  if (!referral) return value
  const url = new URL(value, location.href)
  url.searchParams.set(REFERRAL_QUERY_KEY, referral)
  if (value.startsWith('//')) return `//${url.host}${url.pathname}${url.search}${url.hash}`
  if (value.startsWith('/')) return `${url.pathname}${url.search}${url.hash}`
  return url.href
}
