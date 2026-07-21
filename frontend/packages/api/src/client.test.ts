import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, auth, friendlyError } from './client'

function storage(entries: Record<string, string> = {}) {
  const values = new Map(Object.entries(entries))
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  }
}

afterEach(() => vi.unstubAllGlobals())

describe('auth', () => {
  it('does not revive a stale subdomain token when the shared production cookie is gone', () => {
    vi.stubGlobal('location', { hostname: 'account.lostsky.work', protocol: 'https:' })
    vi.stubGlobal('document', { cookie: '' })
    vi.stubGlobal('localStorage', storage({ lostsky_token: 'expired-token' }))

    expect(auth.token()).toBe('')
  })

  it('keeps local storage fallback for local development', () => {
    vi.stubGlobal('location', { hostname: '127.0.0.1', protocol: 'http:' })
    vi.stubGlobal('document', { cookie: '' })
    vi.stubGlobal('localStorage', storage({ lostsky_token: 'dev-token' }))

    expect(auth.token()).toBe('dev-token')
  })
})

describe('friendlyError', () => {
  it('maps common statuses', () => {
    expect(friendlyError(new ApiError('x', { status: 429 }))).toContain('频繁')
    expect(friendlyError(new ApiError('x', { status: 500 }))).toContain('暂时')
  })
})
