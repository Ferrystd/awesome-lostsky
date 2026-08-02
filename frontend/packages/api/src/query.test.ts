import { describe, expect, it } from 'vitest'
import { ApiError } from './client'
import { shouldRefetchOnWindowFocus, shouldRetryQuery } from './query'

describe('后台查询恢复策略', () => {
  it('不重试权限、能力和其他 4xx 响应', () => {
    expect(shouldRetryQuery(0, new ApiError('forbidden', { status: 403 }))).toBe(false)
    expect(shouldRetryQuery(0, new ApiError('not found', { status: 404 }))).toBe(false)
  })

  it('只有限重试网络与服务端临时错误', () => {
    const network = new ApiError('offline', { network: true })
    const server = new ApiError('unavailable', { status: 503 })
    expect(shouldRetryQuery(0, network)).toBe(true)
    expect(shouldRetryQuery(1, server)).toBe(true)
    expect(shouldRetryQuery(2, server)).toBe(false)
  })

  it('窗口聚焦重新校验普通查询，但不会重复 4xx 请求', () => {
    expect(shouldRefetchOnWindowFocus({ state: { error: null } })).toBe('always')
    expect(shouldRefetchOnWindowFocus({ state: { error: new ApiError('unavailable', { status: 503 }) } })).toBe('always')
    expect(shouldRefetchOnWindowFocus({ state: { error: new ApiError('forbidden', { status: 403 }) } })).toBe(false)
  })
})
