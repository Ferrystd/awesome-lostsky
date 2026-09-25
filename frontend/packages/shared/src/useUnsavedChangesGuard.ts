import { onBeforeUnmount, onMounted, type Ref } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate, type RouteLocationNormalized } from 'vue-router'

export interface UnsavedChangesOptions {
  message?: string
  /** Return false only when this navigation preserves the current task and draft. */
  shouldConfirm?: (to: RouteLocationNormalized, from: RouteLocationNormalized) => boolean
}

export function useUnsavedChangesGuard(dirty: Readonly<Ref<boolean>>, options: UnsavedChangesOptions = {}) {
  const canLeave = () => !dirty.value || window.confirm(options.message ?? '页面上还有未保存的修改，确认离开？')
  function beforeUnload(event: BeforeUnloadEvent) {
    if (!dirty.value) return
    event.preventDefault()
    event.returnValue = ''
  }
  onMounted(() => window.addEventListener('beforeunload', beforeUnload))
  onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload))
  const guard = (to: RouteLocationNormalized, from: RouteLocationNormalized) => options.shouldConfirm?.(to, from) === false || canLeave()
  onBeforeRouteLeave(guard)
  onBeforeRouteUpdate(guard)
  return { canLeave }
}
