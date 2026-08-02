import { api, friendlyError } from '@lostsky/api/client'
import { ref } from 'vue'
import type { ComputedRef } from 'vue'
import type { MemberProfile } from '../components/MemberProfileFields.vue'

export type MemberProfileMediaKey = 'avatar' | 'intro_image' | 'intro_video'

export function useMemberProfileUpload(profile: MemberProfile, disabledReason: ComputedRef<string>) {
  const uploading = ref<MemberProfileMediaKey | ''>('')
  const uploadError = ref('')

  async function upload(key: MemberProfileMediaKey, event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    if (disabledReason.value) {
      uploadError.value = disabledReason.value
      return
    }
    uploading.value = key
    uploadError.value = ''
    try {
      const result = await api.upload<Record<string, unknown>>(file)
      profile[key] = String(result.url ?? result.path ?? result.id ?? '')
    } catch (error) {
      uploadError.value = friendlyError(error)
    } finally {
      uploading.value = ''
      input.value = ''
    }
  }

  return { uploading, uploadError, upload }
}
