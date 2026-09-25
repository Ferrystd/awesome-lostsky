import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Ref } from 'vue'

const hooks = vi.hoisted(() => ({ leave: vi.fn(), update: vi.fn(), mount: vi.fn(), unmount: vi.fn() }))
vi.mock('vue', () => ({ onMounted: hooks.mount, onBeforeUnmount: hooks.unmount }))
vi.mock('vue-router', () => ({ onBeforeRouteLeave: hooks.leave, onBeforeRouteUpdate: hooks.update }))
import { useUnsavedChangesGuard } from './useUnsavedChangesGuard'

beforeEach(() => { vi.clearAllMocks(); vi.stubGlobal('window', { confirm: vi.fn(() => false), addEventListener: vi.fn(), removeEventListener: vi.fn() }) })

describe('shared draft navigation protection', () => {
  it('blocks leaving and same-component target changes; clean drafts do not prompt', () => {
    const dirty = { value: true } as Ref<boolean>
    const { canLeave } = useUnsavedChangesGuard(dirty)
    expect(hooks.leave.mock.calls[0][0]({}, {})).toBe(false)
    expect(hooks.update.mock.calls[0][0]({}, {})).toBe(false)
    dirty.value = false
    expect(canLeave()).toBe(true)
    expect(window.confirm).toHaveBeenCalledTimes(2)
  })
  it('allows explicitly preserved auxiliary navigation without bypassing unload protection', () => {
    useUnsavedChangesGuard({ value: true } as Ref<boolean>, { shouldConfirm: to => to.path !== '/presets' })
    expect(hooks.leave.mock.calls[0][0]({ path: '/presets' }, {})).toBe(true)
    expect(window.confirm).not.toHaveBeenCalled()
    hooks.mount.mock.calls[0][0]()
    const listener = vi.mocked(window.addEventListener).mock.calls[0][1] as (event: unknown) => void
    const event = { preventDefault: vi.fn(), returnValue: undefined }
    listener(event)
    expect(event.preventDefault).toHaveBeenCalledOnce()
    hooks.unmount.mock.calls[0][0]()
    expect(window.removeEventListener).toHaveBeenCalledWith('beforeunload', listener)
  })
})
