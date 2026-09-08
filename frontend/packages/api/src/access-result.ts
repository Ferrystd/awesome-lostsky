// Preserve a denied read separately from a successful empty response, including in query caches.
export function deniedRead(reason: string) {
  return Object.assign([], { accessDenialReason: reason, list: [], total: 0 })
}

export function readAccessReason(data: unknown): string {
  if (!data || typeof data !== 'object') return ''
  const reason = Reflect.get(data, 'accessDenialReason')
  return typeof reason === 'string' ? reason : ''
}
