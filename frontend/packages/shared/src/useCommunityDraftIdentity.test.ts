import { effectScope, ref } from 'vue'
import { expect, it } from 'vitest'
import { useCommunityDraftIdentity } from './useCommunityDraftIdentity'
it('keeps draft identity across query refresh and gives new editors current identity', () => {
  const scope = effectScope()
  scope.run(() => {
    const current = ref<number | null | undefined>(undefined)
    const snapshot = useCommunityDraftIdentity(() => current.value)
    current.value = 11
    current.value = 22
    expect(snapshot.value).toBe(11)
    const fresh = useCommunityDraftIdentity(() => current.value)
    expect(fresh.value).toBe(22)
    current.value = null
    expect(snapshot.value).toBe(11)
    const visitor = useCommunityDraftIdentity(() => current.value)
    current.value = 33
    expect(visitor.value).toBeNull()
  })
  scope.stop()
})
