import { describe, expect, it } from 'vitest'
import { ApiError, friendlyError } from './client'

describe('friendlyError', () => {
  it('maps common statuses', () => {
    expect(friendlyError(new ApiError('x', { status: 429 }))).toContain('频繁')
    expect(friendlyError(new ApiError('x', { status: 500 }))).toContain('暂时')
  })
})
