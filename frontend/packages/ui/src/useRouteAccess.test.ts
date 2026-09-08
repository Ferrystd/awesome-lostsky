import { effectScope, nextTick, reactive, ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { deniedRead } from '@lostsky/api/access-result'

const feedback = vi.hoisted(() => ({ info: vi.fn() }))

vi.mock('./feedback', () => ({ feedback }))
vi.mock('vue-router', () => ({
  useRoute: () => route,
}))

import { useRouteAccess } from './useRouteAccess'
const route = reactive({ fullPath: '/detail/1', meta: { accessReason: '缺少权限' } })
beforeEach(() => { route.fullPath = '/detail/1'; route.meta.accessReason = '缺少权限'; feedback.info.mockClear() })

describe('useRouteAccess', () => {
  it('redacts a denied detail before hydration and clears the reason on success', async () => {
    route.meta.accessReason = ''
    const scope = effectScope()
    const access = scope.run(() => useRouteAccess())!
    const result = await access.read(async () => deniedRead('server denial'))
    await nextTick()
    expect(result).toBeNull()
    expect(access.reason.value).toBe('server denial')
    expect(access.restricted.value).toBe(true)
    // The request client already displayed this server denial.
    expect(feedback.info).not.toHaveBeenCalled()
    const detail = { domains: [] }
    expect(await access.read(async () => detail)).toBe(detail)
    expect(access.restricted.value).toBe(false)
    scope.stop()
  })

  it('does not apply a late denial to a different detail route', async () => {
    route.meta.accessReason = ''
    const scope = effectScope()
    const access = scope.run(() => useRouteAccess())!
    await access.read(async () => deniedRead('old denial'))
    route.fullPath = '/detail/2'
    expect(access.restricted.value).toBe(false)
    let finish!: (value: ReturnType<typeof deniedRead>) => void
    const pending = access.read(() => new Promise<ReturnType<typeof deniedRead>>(resolve => { finish = resolve }))
    route.fullPath = '/detail/3'
    finish(deniedRead('late denial'))
    expect(await pending).toBeNull()
    expect(access.restricted.value).toBe(false)
    scope.stop()
  })

  it('preserves non-authorization request failures', async () => {
    const scope = effectScope()
    const access = scope.run(() => useRouteAccess())!
    const error = new Error('offline')
    await expect(access.read(async () => { throw error })).rejects.toBe(error)
    scope.stop()
  })
  it('notifies once for a known local read restriction and not again for unchanged state', async () => {
    feedback.info.mockClear()
    const reason = ref('缺少 Permission：weibo.personal.use')
    const scope = effectScope()
    scope.run(() => useRouteAccess(reason))
    reason.value = '缺少 Permission：weibo.personal.use'
    await nextTick()
    expect(feedback.info).toHaveBeenCalledTimes(1)
    expect(feedback.info).toHaveBeenCalledWith(reason.value)
    scope.stop()
  })
  it('shows a route access reason only through info feedback', () => {
    const scope = effectScope()
    const access = scope.run(() => useRouteAccess())
    expect(access?.restricted.value).toBe(true)
    expect(feedback.info).toHaveBeenCalledWith('缺少权限')
    scope.stop()
  })
})
