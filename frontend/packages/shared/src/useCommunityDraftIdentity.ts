import { ref, watch } from 'vue'

/** Keep the identity that loaded this editor, even when a background query refreshes. */
export function useCommunityDraftIdentity(read: () => number | null | undefined) {
  const entityId = ref<number | null | undefined>(undefined)
  watch(read, value => {
    if (entityId.value === undefined && value !== undefined) entityId.value = value
  }, { immediate: true, flush: 'sync' })
  return entityId
}
