import { api, auth } from '@lostsky/api/client'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, onMounted, onUnmounted } from 'vue'

export interface ChatActor { id: number; slug: string; name: string; avatar: string | null; type: 'entity' | 'customer' | 'team' | 'virtual'; team?: { id: number; slug: string; name: string } | null }

/** Capture the page identity; never silently send an old draft as a newly selected Entity. */
export function useChatIdentity(onChange: () => void = () => undefined) {
  const entity = auth.entity()
  const identityKey = `${entity?.type}:${entity?.id ?? 0}`
  const actor = useQuery({ queryKey: ['chat-actor', identityKey], queryFn: async () => {
    const result = await api.get<ChatActor>('/actor')
    if (!checkIdentity()) throw new Error('当前身份已改变')
    return result
  } })
  const expectedEntityId = computed(() => actor.data.value?.id ?? 0)
  const cache = useQueryClient()
  let timer = 0
  let changed = false
  function checkIdentity() {
    if (`${auth.entity()?.type}:${auth.entity()?.id ?? 0}` === identityKey) return true
    if (!changed) {
      changed = true
      onChange()
      cache.clear()
      location.reload()
    }
    return false
  }
  onMounted(() => {
    window.addEventListener('focus', checkIdentity)
    window.addEventListener('storage', checkIdentity)
    timer = window.setInterval(checkIdentity, 1000)
  })
  onUnmounted(() => {
    clearInterval(timer)
    window.removeEventListener('focus', checkIdentity)
    window.removeEventListener('storage', checkIdentity)
  })
  return { expectedEntityId, identityKey, checkIdentity, actor }
}
