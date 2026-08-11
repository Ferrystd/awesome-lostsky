import { onBeforeUnmount, onMounted, type Ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

const DEFAULT_MESSAGE = '页面上还有未保存的修改，确认离开？'

export function useUnsavedChangesGuard(isDirty: Readonly<Ref<boolean>>, message = DEFAULT_MESSAGE) {
  function beforeUnload(event: BeforeUnloadEvent) {
    if (!isDirty.value) return
    event.preventDefault()
    event.returnValue = ''
  }

  onMounted(() => window.addEventListener('beforeunload', beforeUnload))
  onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload))
  onBeforeRouteLeave(() => !isDirty.value || confirm(message))
}
