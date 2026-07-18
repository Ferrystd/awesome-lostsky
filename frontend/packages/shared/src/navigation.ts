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
  if (/^https:\/\//.test(target)) location.href = target
  else location.assign(target)
}
