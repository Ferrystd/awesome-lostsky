import { afterEach, describe, expect, it, vi } from 'vitest'

const feedback = vi.hoisted(() => ({ info: vi.fn() }))

vi.mock('@lostsky/ui/feedback', () => ({ feedback }))

import { ApiError, api, auth, friendlyError, uploadFileUrl } from './client'

function storage(entries: Record<string, string> = {}) {
  const values = new Map(Object.entries(entries))
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
  feedback.info.mockClear()
})

describe('auth', () => {
  it.each(['attachment', 'markdown'] as const)('sends the %s source through common upload', async (source) => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: 0, data: { url: 'https://example.com/file.png' } }), { headers: { 'Content-Type': 'application/json' } }))
    vi.stubGlobal('location', { hostname: '127.0.0.1', protocol: 'http:' })
    vi.stubGlobal('document', { cookie: '' })
    vi.stubGlobal('localStorage', storage())
    vi.stubGlobal('sessionStorage', storage())
    vi.stubGlobal('fetch', fetch)
    expect(await uploadFileUrl(new Blob(['fixture']) as File, source)).toBe('https://example.com/file.png')
    const init = fetch.mock.calls[0][1] as RequestInit
    expect((init.body as FormData).get('source')).toBe(source)
    expect(new Headers(init.headers).get('X-LostSky-App')).toBe('common')
  })
  it.each([
    ['account.lostsky.work', 'include'],
    ['demo.team.lostsky.work', 'include'],
    ['lostsky.work.example.test', 'same-origin'],
    ['custom.example.test', 'same-origin'],
  ])('uses the expected credential mode for %s', async (hostname, credentials) => {
    vi.stubGlobal('location', { hostname, protocol: 'https:' })
    vi.stubGlobal('document', { cookie: '' })
    vi.stubGlobal('localStorage', storage())
    vi.stubGlobal('sessionStorage', storage())
    const fetch = vi.fn().mockImplementation(async () => new Response(JSON.stringify({ code: 0, data: {} })))
    vi.stubGlobal('fetch', fetch)
    await api.post('/identity/workspace-warning/acknowledge', { team_slug: 'demo' })
    await api.get('/access')
    for (const [, init] of fetch.mock.calls) expect(init.credentials).toBe(credentials)
  })
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
  it('reports a malformed success response instead of the HTTP status text', async () => {
    vi.stubGlobal('location', { hostname: '127.0.0.1', protocol: 'http:' })
    vi.stubGlobal('document', { cookie: '' })
    vi.stubGlobal('localStorage', storage())
    vi.stubGlobal('sessionStorage', storage())
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(
      '<br><b>Notice</b>{"code":0,"message":"上传成功","data":{"url":"/uploaded.png"}}',
      { status: 200, statusText: 'OK', headers: { 'Content-Type': 'application/json' } },
    )))

    await expect(api.upload(new Blob(['fixture']) as File)).rejects.toMatchObject({
      message: '服务响应格式异常，请稍后重试',
      status: 200,
    })
  })

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

    await expect(api.uploadTo(new Blob(['fixture']) as File, '/personal/upload', { expected_entity_id: 42 }))
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
  it('maps common errors to stable messages', () => {
    expect(friendlyError(new Error('x'))).toBe('发生未知错误，请稍后再试')
    expect(friendlyError(new ApiError('x', { status: 429 }))).toBe('操作太频繁，请稍后再试')
    expect(friendlyError(new ApiError('x', { status: 500 }))).toBe('服务暂时不可用，请稍后再试')
    expect(friendlyError(new ApiError('x', { network: true }))).toBe('网络连接失败，请检查网络后重试')
    expect(friendlyError(new ApiError(''))).toBe('请求失败')
  })

  it('does not turn structured access errors into inline error copy', () => {
    expect(friendlyError(new ApiError('server permission message', {
      status: 403,
      code: 40302,
      data: { kind: 'permission', required_any: ['file.upload'] },
    }))).toBe('')
    expect(friendlyError(new ApiError('server ability message', {
      status: 403,
      code: 40303,
      data: { kind: 'ability', key: 'file', label: '文件上传', reason: 'missing' },
    }))).toBe('')
  })

  it('keeps the server message when structured access details are incomplete', () => {
    expect(friendlyError(new ApiError('服务端具体原因', {
      status: 403,
      code: 40302,
      data: { kind: 'permission', required_any: [] },
    }))).toBe('服务端具体原因')
  })

})

describe('structured access responses', () => {
  function response(kind: 'permission' | 'ability') {
    const data = kind === 'permission'
      ? { kind, required_any: ['file.read'] }
      : { kind, key: 'file', label: '文件上传', reason: 'missing' }
    return new Response(JSON.stringify({ code: kind === 'permission' ? 40302 : 40303, message: 'forbidden', data }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  it.each(['permission', 'ability'] as const)('degrades denied GET %s responses to an empty collection and only uses info feedback', async (kind) => {
    vi.stubGlobal('location', { hostname: '127.0.0.1', protocol: 'http:' })
    vi.stubGlobal('document', { cookie: '' })
    vi.stubGlobal('localStorage', storage())
    vi.stubGlobal('sessionStorage', storage())
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(kind)))

    const result = await api.get<unknown[]>('/protected')
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(0)
    expect(Reflect.get(result, 'accessDenialReason')).toEqual(expect.stringContaining(kind === 'permission' ? 'Permission' : 'Ability'))
    expect(feedback.info).toHaveBeenCalledOnce()
  })

  it('keeps denied writes failed while suppressing duplicate inline copy', async () => {
    vi.stubGlobal('location', { hostname: '127.0.0.1', protocol: 'http:' })
    vi.stubGlobal('document', { cookie: '' })
    vi.stubGlobal('localStorage', storage())
    vi.stubGlobal('sessionStorage', storage())
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response('permission')))

    const result = api.post('/protected', { value: 1 })
    await expect(result).rejects.toMatchObject({ code: 40302 })
    await result.catch((error) => expect(friendlyError(error)).toBe(''))
    expect(feedback.info).toHaveBeenCalledOnce()
  })
})


describe('teamless identity recovery', () => {
  it('returns missing Entity to generic Account identity selection', async () => {
    const assign = vi.fn()
    const href = 'https://chat.lostsky.work/?conversation=abc'
    vi.stubGlobal('location', { hostname: 'chat.lostsky.work', protocol: 'https:', href, assign })
    vi.stubGlobal('document', { cookie: 'lostsky_token=base-token' })
    vi.stubGlobal('localStorage', storage())
    vi.stubGlobal('sessionStorage', storage())
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: 42801, message: 'identity required', data: {} }), { status: 428 })))
    await expect(api.get('/conversation')).rejects.toMatchObject({ code: 42801 })
    const target = new URL(String(assign.mock.calls[0]?.[0]), 'https://account.lostsky.work')
    expect(target.pathname).toBe('/identity')
    expect(target.searchParams.get('redirect')).toBe(href)
    expect(target.searchParams.has('team_slug')).toBe(false)
  })
})

describe('identity ownership and independent uploads', () => {
  const token = (id: number, version = 1) => `x.${Buffer.from(JSON.stringify({ sub: 1, act: { type: 'teamMember', id }, iat: version })).toString('base64url')}.x`
  const ok = (data: unknown) => new Response(JSON.stringify({ code: 0, data }))
  function setup() {
    const doc = { cookie: `lostsky_token=${token(11)}` }
    vi.stubGlobal('document', doc)
    vi.stubGlobal('location', { hostname: 'demo.transaction.lostsky.work', protocol: 'https:', replace: vi.fn() })
    vi.stubGlobal('localStorage', storage())
    vi.stubGlobal('sessionStorage', storage())
    return doc
  }
  it('uploads different concurrent files independently while retaining JSON write deduplication', async () => {
    setup()
    const fetch = vi.fn().mockImplementation(async (_url, init: RequestInit) => {
      const file = init.body instanceof FormData ? init.body.get('file') as File : null
      return ok({ name: file?.name ?? 'json' })
    })
    vi.stubGlobal('fetch', fetch)
    const result = await Promise.all([api.upload(new File(['a'], 'a.txt')), api.upload(new File(['b'], 'b.txt'))])
    expect(result).toEqual([{ name: 'a.txt' }, { name: 'b.txt' }])
    expect(fetch).toHaveBeenCalledTimes(2)
    await Promise.all([api.post('/same', { id: 1 }), api.post('/same', { id: 1 })])
    expect(fetch).toHaveBeenCalledTimes(3)
  })
  it('blocks old-page writes after another tab switches identity but accepts same-actor token rotation', async () => {
    const doc = setup()
    const fetch = vi.fn().mockImplementation(async () => ok({}))
    vi.stubGlobal('fetch', fetch)
    await api.get('/draft')
    doc.cookie = `lostsky_token=${token(11, 2)}`
    await api.post('/save', { memo: 'same actor' })
    doc.cookie = `lostsky_token=${token(22)}`
    await expect(api.post('/save', { memo: 'old draft' })).rejects.toMatchObject({ status: 409 })
    expect(fetch).toHaveBeenCalledTimes(2)
    auth.save({ token: token(22) })
    await api.get('/new-identity')
    expect(fetch).toHaveBeenCalledTimes(3)
  })
  it.each([200, 401])('rejects late %i reads without clearing the new identity', async status => {
    const doc = setup()
    let resolve!: (response: Response) => void
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(done => { resolve = done })))
    const request = api.get('/old-data')
    doc.cookie = `lostsky_token=${token(22)}`
    resolve(new Response(JSON.stringify({ code: status === 200 ? 0 : 401, data: { private: true } }), { status }))
    await expect(request).rejects.toMatchObject({ status: 409 })
    expect(auth.token()).toBe(token(22))
    expect(location.replace).not.toHaveBeenCalled()
  })
  it('does not overwrite a changed identity with a late refresh response', async () => {
    const doc = setup()
    doc.cookie += '; lostsky_refresh_token=refresh-a'
    let resolve!: (response: Response) => void
    const fetch = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ code: 401 }), { status: 401 }))
      .mockImplementationOnce(() => new Promise<Response>(done => { resolve = done }))
    vi.stubGlobal('fetch', fetch)
    const request = api.get('/protected-old')
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(2))
    doc.cookie = `lostsky_token=${token(22)}`
    resolve(ok({ token: token(11, 2), refresh_token: 'rotated-a' }))
    await expect(request).rejects.toMatchObject({ status: 409 })
    expect(auth.token()).toBe(token(22))
  })
})
