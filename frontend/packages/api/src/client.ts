import { identityUrl, redirectToLogin, redirectToMemberIdentity } from '@lostsky/shared/navigation'
import { feedback } from '@lostsky/ui/feedback'
import { formatStructuredAccessError } from './error-format'
import { ERROR_MESSAGES } from './error-messages'
import { deniedRead } from './access-result'

const API_BASE = import.meta.env.DEV ? '/api' : (import.meta.env.VITE_API_BASE || '//api.lostsky.work')
const TOKEN_KEY = 'lostsky_token'
const REFRESH_TOKEN_KEY = 'lostsky_refresh_token'
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

function usesSharedAuthCookie() {
  return location.hostname === 'lostsky.work' || location.hostname.endsWith('.lostsky.work')
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
    if (usesSharedAuthCookie()) return fromCookie
    const fromStorage = localStorage.getItem(TOKEN_KEY) ?? ''
    if (!fromCookie && fromStorage) writeCookie(TOKEN_KEY, fromStorage)
    return fromCookie || fromStorage
  },
  refreshToken() {
    const fromCookie = decodeURIComponent(readCookie(REFRESH_TOKEN_KEY))
    if (usesSharedAuthCookie()) return fromCookie
    const fromStorage = localStorage.getItem(REFRESH_TOKEN_KEY) ?? ''
    if (!fromCookie && fromStorage) writeCookie(REFRESH_TOKEN_KEY, fromStorage)
    return fromCookie || fromStorage
  },
  user<T = Record<string, unknown>>(): T | null {
    const fromCookie = decodeURIComponent(readCookie(USER_KEY))
    const raw = fromCookie || (usesSharedAuthCookie() ? null : localStorage.getItem(USER_KEY))
    try { return raw ? JSON.parse(raw) as T : null } catch { return null }
  },
  entity(): { type: string; id: number } | null {
    const token = this.token()
    try {
      const part = token.split('.')[1]
      if (!part) return null
      const padded = part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=')
      const payload = JSON.parse(atob(padded)) as { act?: { type?: unknown; id?: unknown } }
      const type = typeof payload.act?.type === 'string' ? payload.act.type : ''
      const id = Number(payload.act?.id ?? 0)
      return type && Number.isInteger(id) && id > 0 ? { type, id } : null
    } catch {
      return null
    }
  },
  save(data: { token?: string; refresh_token?: string; refresh_expires_at?: number; user?: unknown }) {
    if (!data.token) return
    if (usesSharedAuthCookie()) localStorage.removeItem(TOKEN_KEY)
    else localStorage.setItem(TOKEN_KEY, data.token)
    writeCookie(TOKEN_KEY, data.token)
    if (data.refresh_token) {
      const maxAge = data.refresh_expires_at
        ? Math.max(1, data.refresh_expires_at - Math.floor(Date.now() / 1000))
        : AUTH_MAX_AGE
      if (usesSharedAuthCookie()) localStorage.removeItem(REFRESH_TOKEN_KEY)
      else localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token)
      writeCookie(REFRESH_TOKEN_KEY, data.refresh_token, maxAge)
    }
    if (data.user) {
      const raw = JSON.stringify(data.user)
      if (usesSharedAuthCookie()) localStorage.removeItem(USER_KEY)
      else localStorage.setItem(USER_KEY, raw)
      writeCookie(USER_KEY, raw)
    }
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    writeCookie(TOKEN_KEY, '', 0)
    writeCookie(REFRESH_TOKEN_KEY, '', 0)
    writeCookie(USER_KEY, '', 0)
  },
}

const inflight = new Map<string, Promise<unknown>>()
let refreshTask: Promise<boolean> | null = null

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

async function refreshSession(): Promise<boolean> {
  if (refreshTask) return refreshTask

  refreshTask = (async () => {
    let refreshToken = auth.refreshToken()
    for (let attempt = 0; attempt < 2 && refreshToken; attempt++) {
      try {
        const response = await fetch(`${API_BASE}/login/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Page-Id': pageId(),
            'X-Request-Id': uuid(),
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        })
        const envelope = await response.json() as Partial<ApiEnvelope<{
          token: string
          refresh_token: string
          refresh_expires_at: number
        }>>
        if (response.ok && envelope.code === 0 && envelope.data?.token) {
          auth.save(envelope.data)
          return true
        }
        if (response.status === 409) {
          let latest = refreshToken
          for (let wait = 0; wait < 5; wait++) {
            latest = auth.refreshToken()
            if (latest && latest !== refreshToken) break
            await new Promise((resolve) => setTimeout(resolve, 50))
          }
          if (latest && latest !== refreshToken) {
            refreshToken = latest
            continue
          }
        }
        return false
      } catch {
        return false
      }
    }
    return false
  })()

  try {
    return await refreshTask
  } finally {
    refreshTask = null
  }
}

async function request<T>(method: string, path: string, body?: unknown, options: { signal?: AbortSignal; timeout?: number; app?: 'common' } = {}): Promise<T> {
  const key = method === 'GET' ? '' : `${method}:${path}:${JSON.stringify(body ?? null)}`
  if (key && inflight.has(key)) return inflight.get(key) as Promise<T>

  const task = (async () => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), options.timeout ?? 15000)
    options.signal?.addEventListener('abort', () => controller.abort(), { once: true })
    let payload: BodyInit | undefined
    if (body instanceof FormData) payload = body
    else if (body != null) payload = JSON.stringify(body)

    try {
      let token = auth.token()
      let refreshAttempted = false
      while (true) {
        const headers: Record<string, string> = { 'X-Page-Id': pageId() }
        if (method !== 'GET') headers['X-Request-Id'] = uuid()
        if (options.app) headers['X-LostSky-App'] = options.app
        if (body != null && !(body instanceof FormData)) headers['Content-Type'] = 'application/json'
        if (token) headers.Authorization = `Bearer ${token}`

        const response = await fetch(`${API_BASE}${path}`, { method, headers, body: payload, signal: controller.signal, credentials: usesSharedAuthCookie() ? 'include' : 'same-origin' })
        let envelope: Partial<ApiEnvelope<T>> = {}
        let parsed = false
        try {
          envelope = await response.json() as ApiEnvelope<T>
          parsed = true
        } catch { /* handled below */ }
        if (token && (response.status === 401 || envelope.code === 401)) {
          if (!refreshAttempted && path !== '/login/refresh' && auth.refreshToken()) {
            refreshAttempted = true
            if (await refreshSession()) {
              token = auth.token()
              continue
            }
          }
          auth.clear()
          redirectToLogin({ expired: true })
        }
        if (!parsed) {
          throw new ApiError(ERROR_MESSAGES.request.invalidResponse, {
            status: response.status, method, path,
          })
        }
        if ((envelope.code === 42801 || envelope.code === 40301) && envelope.data && typeof envelope.data === 'object') {
          const teamSlug = Reflect.get(envelope.data, 'team_slug')
          if (typeof teamSlug === 'string' && teamSlug) {
            redirectToMemberIdentity(teamSlug, envelope.code === 42801 ? 'missing' : 'team_mismatch')
          } else if (envelope.code === 42801) {
            location.assign(identityUrl())
          }
        }
        if (!response.ok || envelope.code !== 0) {
          const error = new ApiError(envelope.message || response.statusText || ERROR_MESSAGES.request.failed, {
            status: response.status, code: envelope.code, method, path, data: envelope.data, response: envelope,
          })
          const accessReason = formatStructuredAccessError(envelope.data)
          if (accessReason) {
            feedback.info(accessReason)
            if (method === 'GET') return deniedRead(accessReason) as T
          }
          throw error
        }
        return envelope.data as T
      }
    } catch (error) {
      if (error instanceof ApiError) throw error
      const aborted = error instanceof DOMException && error.name === 'AbortError'
      throw new ApiError(aborted ? ERROR_MESSAGES.request.timeoutOrCancelled : ERROR_MESSAGES.request.networkFailure, { method, path, cause: error, network: !aborted })
    } finally { clearTimeout(timeout) }
  })()

  if (key) {
    inflight.set(key, task)
    void task.then(
      () => inflight.delete(key),
      () => inflight.delete(key),
    )
  }
  return task
}

export const api = {
  get: <T>(path: string, params?: Record<string, unknown>, options?: { signal?: AbortSignal; timeout?: number }) => request<T>('GET', `${path}${queryString(params)}`, undefined, options),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  delete: <T>(path: string, body?: unknown) => request<T>('DELETE', path, body),
  upload: <T>(file: File, path = '/upload', fields: Record<string, string | number> = {}) => {
    const body = new FormData()
    body.append('file', file)
    Object.entries(fields).forEach(([key, value]) => body.append(key, String(value)))
    return request<T>('POST', path, body, { timeout: 60000, app: 'common' })
  },
  uploadTo: <T>(file: File, path: string, fields: Record<string, string | number> = {}) => {
    const body = new FormData()
    body.append('file', file)
    Object.entries(fields).forEach(([key, value]) => body.append(key, String(value)))
    return request<T>('POST', path, body, { timeout: 60000 })
  },
}

/**
 * Upload one file through the common file service and return the persisted URL.
 * Keeping this contract here prevents every form from interpreting upload
 * responses differently.
 */
export async function uploadFileUrl(file: File, source: 'attachment' | 'markdown' = 'attachment'): Promise<string> {
  try {
    const result = await api.upload<Record<string, unknown>>(file, '/upload', { source })
    const url = String(result.url ?? result.path ?? '')
    if (!url) throw new ApiError('上传结果缺少文件地址', { method: 'POST', path: '/upload', data: result })
    return url
  } catch (error) {
    throw new Error(friendlyError(error), { cause: error })
  }
}

export function friendlyError(error: unknown) {
  if (!(error instanceof ApiError)) return ERROR_MESSAGES.friendly.unknown
  const accessMessage = formatStructuredAccessError(error.data)
  if (accessMessage) return ''
  if (error.status === 429) return ERROR_MESSAGES.friendly.tooManyRequests
  if (error.status >= 500) return ERROR_MESSAGES.friendly.serviceUnavailable
  if (error.network) return ERROR_MESSAGES.friendly.networkConnectionFailed
  return error.message || ERROR_MESSAGES.request.failed
}
