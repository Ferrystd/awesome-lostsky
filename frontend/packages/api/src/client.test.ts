import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, api, auth, friendlyError } from './client'

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

describe('unauthorized responses', () => {
  function unauthorized() {
    return new Response(JSON.stringify({ code: 401, message: '请重新登录', data: null }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  it('returns login errors without replacing the preserved redirect', async () => {
    const replace = vi.fn()
    vi.stubGlobal('location', { hostname: 'account.lostsky.work', protocol: 'https:', href: 'https://account.lostsky.work/login?redirect=keep', replace })
    vi.stubGlobal('document', { cookie: '' })
    vi.stubGlobal('localStorage', storage())
    vi.stubGlobal('sessionStorage', storage())
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(unauthorized()))

    await expect(api.get('/login/phone')).rejects.toMatchObject({ status: 401 })
    expect(replace).not.toHaveBeenCalled()
  })

  it('sends authenticated 401 responses back through the shared login redirect', async () => {
    const replace = vi.fn()
    const href = 'https://demo.chat.lostsky.work/?conversation=123'
    vi.stubGlobal('location', { hostname: 'demo.chat.lostsky.work', protocol: 'https:', href, replace })
    vi.stubGlobal('document', { cookie: 'lostsky_token=expired-token' })
    vi.stubGlobal('localStorage', storage())
    vi.stubGlobal('sessionStorage', storage())
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(unauthorized()))

    await expect(api.get('/conversation')).rejects.toMatchObject({ status: 401 })
    const target = new URL(String(replace.mock.calls[0]?.[0]), 'https://account.lostsky.work')
    expect(target.searchParams.get('redirect')).toBe(href)
    expect(target.searchParams.get('expired')).toBe('1')
  })
})

describe('friendlyError', () => {
  it('maps common statuses', () => {
    expect(friendlyError(new ApiError('x', { status: 429 }))).toContain('频繁')
    expect(friendlyError(new ApiError('x', { status: 500 }))).toContain('暂时')
  })
})
