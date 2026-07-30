import { beforeEach, describe, expect, it, vi } from 'vitest'

const message = vi.hoisted(() => ({
  error: vi.fn(),
  info: vi.fn(),
  success: vi.fn(),
  warning: vi.fn(),
}))

vi.mock('naive-ui', () => ({
  createDiscreteApi: () => ({ message }),
}))

import { feedback } from './feedback'

describe('global feedback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses closable transient messages with a longer error timeout', () => {
    feedback.success('已保存')
    feedback.error('保存失败')

    expect(message.success).toHaveBeenCalledWith('已保存', expect.objectContaining({
      closable: true,
      duration: 3800,
    }))
    expect(message.error).toHaveBeenCalledWith('保存失败', expect.objectContaining({
      closable: true,
      duration: 5000,
    }))
  })

  it('suppresses the same message repeated immediately', () => {
    feedback.info('权限原因')
    feedback.info('权限原因')

    expect(message.info).toHaveBeenCalledTimes(1)
  })
})
