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

  it('stores and clears the rotating refresh token with the access token', () => {
    const local = storage()
    vi.stubGlobal('location', { hostname: '127.0.0.1', protocol: 'http:' })
    vi.stubGlobal('document', { cookie: '' })
    vi.stubGlobal('localStorage', local)

    auth.save({
      token: 'access-token',
      refresh_token: 'refresh-token',
      refresh_expires_at: Math.floor(Date.now() / 1000) + 60,
    })
    expect(auth.refreshToken()).toBe('refresh-token')

    auth.clear()
    expect(auth.refreshToken()).toBe('')
  })

  it('reads the current entity claim from the access token', () => {
    const payload = Buffer.from(JSON.stringify({ act: { type: 'teamMember', id: 42 } })).toString('base64url')
    vi.stubGlobal('location', { hostname: '127.0.0.1', protocol: 'http:' })
    vi.stubGlobal('document', { cookie: '' })
    vi.stubGlobal('localStorage', storage({ lostsky_token: `header.${payload}.signature` }))

    expect(auth.entity()).toEqual({ type: 'teamMember', id: 42 })
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

  it('rotates the refresh token once and retries an authenticated request', async () => {
    const local = storage({
      lostsky_token: 'expired-access',
      lostsky_refresh_token: 'a'.repeat(64),
    })
    const fetch = vi.fn()
      .mockResolvedValueOnce(unauthorized())
      .mockResolvedValueOnce(new Response(JSON.stringify({
        code: 0,
        message: 'ok',
        data: {
          token: 'fresh-access',
          refresh_token: 'b'.repeat(64),
          refresh_expires_at: Math.floor(Date.now() / 1000) + 600,
        },
      }), { headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        code: 0,
        message: 'ok',
        data: { id: 7 },
      }), { headers: { 'Content-Type': 'application/json' } }))

    vi.stubGlobal('location', { hostname: '127.0.0.1', protocol: 'http:', href: 'http://127.0.0.1/', replace: vi.fn() })
    vi.stubGlobal('document', { cookie: '' })
    vi.stubGlobal('localStorage', local)
    vi.stubGlobal('sessionStorage', storage())
    vi.stubGlobal('fetch', fetch)

    await expect(api.get<{ id: number }>('/protected')).resolves.toEqual({ id: 7 })
    expect(local.getItem('lostsky_token')).toBe('fresh-access')
    expect(local.getItem('lostsky_refresh_token')).toBe('b'.repeat(64))
    expect(fetch).toHaveBeenCalledTimes(3)
  })
})

describe('team identity and common uploads', () => {
  it('declares only the common app and does not consume response token headers', async () => {
    const local = storage({ lostsky_token: 'base-token' })
    const fetch = vi.fn().mockImplementation((_url: string, init: RequestInit) => {
      const headers = new Headers(init.headers)
      expect(headers.get('X-LostSky-App')).toBe('common')
      expect(headers.get('Authorization')).toBe('Bearer base-token')
      return Promise.resolve(new Response(JSON.stringify({
        code: 0,
        message: 'ok',
        data: { id: 1 },
      }), {
        headers: {
          'Content-Type': 'application/json',
          'X-LostSky-Token': 'member-token',
        },
      }))
    })
    vi.stubGlobal('location', { hostname: '127.0.0.1', protocol: 'http:' })
    vi.stubGlobal('document', { cookie: '' })
    vi.stubGlobal('localStorage', local)
    vi.stubGlobal('sessionStorage', storage())
    vi.stubGlobal('fetch', fetch)

    await api.upload(new Blob(['fixture']) as File)

    expect(local.getItem('lostsky_token')).toBe('base-token')
    expect(fetch).toHaveBeenCalledOnce()
  })

  it('uploads to the current Account route without forcing the common app header', async () => {
    const fetch = vi.fn().mockImplementation((_url: string, init: RequestInit) => {
      const headers = new Headers(init.headers)
      expect(headers.has('X-LostSky-App')).toBe(false)
      expect(init.body).toBeInstanceOf(FormData)
      expect((init.body as FormData).get('expected_entity_id')).toBe('42')
      return Promise.resolve(new Response(JSON.stringify({ code: 0, message: 'ok', data: { url: '/avatar.png' } }), {
        headers: { 'Content-Type': 'application/json' },
      }))
    })
    vi.stubGlobal('location', { hostname: '127.0.0.1', protocol: 'http:' })
    vi.stubGlobal('document', { cookie: '' })
    vi.stubGlobal('localStorage', storage())
    vi.stubGlobal('sessionStorage', storage())
    vi.stubGlobal('fetch', fetch)

    await expect(api.uploadTo(new Blob(['fixture']) as File, '/identity/current/upload', { expected_entity_id: 42 }))
      .resolves.toEqual({ url: '/avatar.png' })
  })

  it.each([
    [42801, 'missing'],
    [40301, 'team_mismatch'],
  ])('redirects entity error %s through the Account member callback', async (code, reason) => {
    const assign = vi.fn()
    const href = 'https://demo.shop.lostsky.work/orders/12'
    vi.stubGlobal('location', {
      hostname: 'demo.shop.lostsky.work',
      protocol: 'https:',
      href,
      assign,
    })
    vi.stubGlobal('document', { cookie: 'lostsky_token=current-token' })
    vi.stubGlobal('localStorage', storage())
    vi.stubGlobal('sessionStorage', storage())
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      code,
      message: 'identity required',
      data: { team_slug: 'demo' },
    }), { status: code === 42801 ? 428 : 403, headers: { 'Content-Type': 'application/json' } })))

    await expect(api.get('/orders/12')).rejects.toMatchObject({ code })
    const target = new URL(String(assign.mock.calls[0]?.[0]), 'https://account.lostsky.work')
    expect(target.pathname).toBe('/identity/member-callback')
    expect(target.searchParams.get('team_slug')).toBe('demo')
    expect(target.searchParams.get('reason')).toBe(reason)
    expect(target.searchParams.get('return_to')).toBe(href)
  })
})

describe('write request deduplication', () => {
  it('releases a rejected request without creating a detached rejection', async () => {
    const fetch = vi.fn().mockRejectedValue(new TypeError('offline'))
    vi.stubGlobal('location', { hostname: '127.0.0.1', protocol: 'http:' })
    vi.stubGlobal('document', { cookie: '' })
    vi.stubGlobal('localStorage', storage())
    vi.stubGlobal('sessionStorage', storage())
    vi.stubGlobal('fetch', fetch)

    await expect(api.post('/write', { id: 1 })).rejects.toMatchObject({ network: true })
    await expect(api.post('/write', { id: 1 })).rejects.toMatchObject({ network: true })

    expect(fetch).toHaveBeenCalledTimes(2)
  })
})

describe('friendlyError', () => {
  it('maps common statuses', () => {
    expect(friendlyError(new ApiError('x', { status: 429 }))).toContain('频繁')
    expect(friendlyError(new ApiError('x', { status: 500 }))).toContain('暂时')
  })
})
