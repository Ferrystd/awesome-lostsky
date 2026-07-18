const API_BASE = import.meta.env.DEV ? '/api' : (import.meta.env.VITE_API_BASE || '//api.lostsky.work')
const TOKEN_KEY = 'lostsky_token'
const USER_KEY = 'lostsky_user'
const PAGE_ID_KEY = 'lostsky_page_id'
const AUTH_MAX_AGE = 60 * 60 * 24 * 30

export interface ApiEnvelope<T> { code: number; message: string; data: T }
export interface ApiErrorDetail {
  status?: number
  code?: number | null
  method?: string
  path?: string
  data?: unknown
  response?: unknown
  cause?: unknown
  network?: boolean
}

export class ApiError extends Error {
  status: number
  code: number | null
  method: string
  path: string
  data: unknown
  response: unknown
  network: boolean

  constructor(message: string, detail: ApiErrorDetail = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = detail.status ?? 0
    this.code = detail.code ?? null
    this.method = detail.method ?? ''
    this.path = detail.path ?? ''
    this.data = detail.data
    this.response = detail.response
    this.cause = detail.cause
    this.network = Boolean(detail.network)
  }
}

function uuid() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function pageId() {
  try {
    const current = sessionStorage.getItem(PAGE_ID_KEY)
    if (current) return current
    const next = uuid()
    sessionStorage.setItem(PAGE_ID_KEY, next)
    return next
  } catch { return uuid() }
}

function cookieDomain() {
  return location.hostname === 'lostsky.work' || location.hostname.endsWith('.lostsky.work') ? '; domain=.lostsky.work' : ''
}

function readCookie(name: string) {
  const prefix = `${encodeURIComponent(name)}=`
  return document.cookie.split('; ').find((item) => item.startsWith(prefix))?.slice(prefix.length) ?? ''
}

function writeCookie(name: string, value: string, maxAge = AUTH_MAX_AGE) {
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax${cookieDomain()}${location.protocol === 'https:' ? '; Secure' : ''}`
}

export const auth = {
  token() {
    const fromCookie = decodeURIComponent(readCookie(TOKEN_KEY))
    const fromStorage = localStorage.getItem(TOKEN_KEY) ?? ''
    if (!fromCookie && fromStorage) writeCookie(TOKEN_KEY, fromStorage)
    return fromCookie || fromStorage
  },
  user<T = Record<string, unknown>>(): T | null {
    const raw = decodeURIComponent(readCookie(USER_KEY)) || localStorage.getItem(USER_KEY)
    try { return raw ? JSON.parse(raw) as T : null } catch { return null }
  },
  save(data: { token?: string; user?: unknown }) {
    if (!data.token) return
    localStorage.setItem(TOKEN_KEY, data.token)
    writeCookie(TOKEN_KEY, data.token)
    if (data.user) {
      const raw = JSON.stringify(data.user)
      localStorage.setItem(USER_KEY, raw)
      writeCookie(USER_KEY, raw)
    }
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    writeCookie(TOKEN_KEY, '', 0)
    writeCookie(USER_KEY, '', 0)
  },
}

const inflight = new Map<string, Promise<unknown>>()

function queryString(params?: Record<string, unknown>) {
  if (!params) return ''
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === '' || value == null) return
    if (Array.isArray(value)) value.forEach((item) => query.append(key, String(item)))
    else query.set(key, String(value))
  })
  const serialized = query.toString()
  return serialized ? `?${serialized}` : ''
}

async function request<T>(method: string, path: string, body?: unknown, options: { signal?: AbortSignal; timeout?: number } = {}): Promise<T> {
  const key = method === 'GET' ? '' : `${method}:${path}:${JSON.stringify(body ?? null)}`
  if (key && inflight.has(key)) return inflight.get(key) as Promise<T>

  const task = (async () => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), options.timeout ?? 15000)
    options.signal?.addEventListener('abort', () => controller.abort(), { once: true })
    const headers: Record<string, string> = { 'X-Page-Id': pageId() }
    if (method !== 'GET') headers['X-Request-Id'] = uuid()
    const token = auth.token()
    if (token) headers.Authorization = `Bearer ${token}`
    let payload: BodyInit | undefined
    if (body instanceof FormData) payload = body
    else if (body != null) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body) }

    try {
      const response = await fetch(`${API_BASE}${path}`, { method, headers, body: payload, signal: controller.signal })
      let envelope: Partial<ApiEnvelope<T>> = {}
      try { envelope = await response.json() as ApiEnvelope<T> } catch { /* handled below */ }
      if (response.status === 401 || envelope.code === 401) {
        auth.clear()
        window.dispatchEvent(new CustomEvent('lostsky:auth-expired'))
      }
      if (!response.ok || envelope.code !== 0) {
        throw new ApiError(envelope.message || response.statusText || '请求失败', {
          status: response.status, code: envelope.code, method, path, data: envelope.data, response: envelope,
        })
      }
      return envelope.data as T
    } catch (error) {
      if (error instanceof ApiError) throw error
      const aborted = error instanceof DOMException && error.name === 'AbortError'
      throw new ApiError(aborted ? '请求超时或已取消' : '网络请求失败', { method, path, cause: error, network: !aborted })
    } finally { clearTimeout(timeout) }
  })()

  if (key) {
    inflight.set(key, task)
    task.finally(() => inflight.delete(key))
  }
  return task
}

export const api = {
  get: <T>(path: string, params?: Record<string, unknown>, options?: { signal?: AbortSignal; timeout?: number }) => request<T>('GET', `${path}${queryString(params)}`, undefined, options),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  delete: <T>(path: string, body?: unknown) => request<T>('DELETE', path, body),
  upload: <T>(file: File, path = '/upload') => { const body = new FormData(); body.append('file', file); return request<T>('POST', path, body, { timeout: 60000 }) },
}

export function friendlyError(error: unknown) {
  if (!(error instanceof ApiError)) return '发生未知错误，请稍后再试'
  if (error.status === 429) return '操作太频繁，请稍后再试'
  if (error.status >= 500) return '服务暂时不可用，请稍后再试'
  if (error.network) return '网络连接失败，请检查网络后重试'
  return error.message || '请求失败'
}
