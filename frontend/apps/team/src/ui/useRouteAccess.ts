import { computed, ref, toValue, watch, type MaybeRefOrGetter } from 'vue'
import { readAccessReason } from '@lostsky/api/access-result'
import { useRoute } from 'vue-router'
import { feedback } from './feedback'

export function useRouteAccess(localReason?: MaybeRefOrGetter<string>) {
  const route = useRoute()
  const responseReason = ref('')
  const reason = computed(() => responseReason.value || toValue(localReason) || String(route.meta.accessReason ?? ''))
  const restricted = computed(() => Boolean(reason.value))
  const mode = computed<'list' | 'data'>(() => route.meta.accessMode === 'list' ? 'list' : 'data')

  watch(reason, (message) => {
    if (message && message !== responseReason.value) feedback.info(message)
  }, { immediate: true })

  watch(() => route.fullPath, () => { responseReason.value = '' }, { flush: 'sync' })

  async function read<T>(request: () => Promise<T>): Promise<T | null> {
    const path = route.fullPath
    const data = await request()
    const denied = readAccessReason(data)
    if (route.fullPath === path) responseReason.value = denied
    return denied ? null : data
  }

  return { reason, restricted, mode, read }
}
