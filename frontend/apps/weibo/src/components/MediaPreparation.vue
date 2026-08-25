<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsUploadField from '@lostsky/ui/components/LsUploadField.vue'
import { feedback } from '@lostsky/ui/feedback'
import { computed, ref } from 'vue'

const props = defineProps<{ prefix: string; personal: boolean; expectedEntityId: number; accountId: number | null; modelValue: number[] }>()
const emit = defineEmits<{ 'update:modelValue': [value: number[]] }>()
const pending = ref(false)
const uploadError = ref('')
const uploadingNames = ref<string[]>([])
const remaining = computed(() => Math.max(0, 9 - props.modelValue.length))
const disabledReason = computed(() => {
  if (pending.value) return '图片正在上传，请稍候'
  if (!props.accountId) return '请先选择微博账号，再添加图片'
  if (!remaining.value) return '已准备 9 张图片，请先移除图片再添加'
  return ''
})
const uploadLabel = computed(() => remaining.value === 9 ? '选择并上传图片' : `继续添加图片（还可添加 ${remaining.value} 张）`)

async function uploadSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const selected = Array.from(input.files ?? [])
  input.value = ''
  if (!selected.length) return
  if (!props.accountId) {
    uploadError.value = '请先选择微博账号，再添加图片'
    return
  }
  if (selected.length > remaining.value) {
    uploadError.value = `本次最多还能添加 ${remaining.value} 张图片`
    feedback.warning(uploadError.value)
    return
  }

  pending.value = true
  uploadError.value = ''
  uploadingNames.value = selected.map(file => file.name)
  const ids = [...props.modelValue]
  try {
    for (const file of selected) {
      const fields: Record<string, number> = { account_id: props.accountId }
      if (props.personal) fields.expected_entity_id = props.expectedEntityId
      const media = await api.uploadTo<{ id: number }>(file, `${props.prefix}/media`, fields)
      ids.push(media.id)
      emit('update:modelValue', [...ids])
    }
    feedback.success(`${selected.length} 张图片已上传`)
  } catch (error) {
    uploadError.value = friendlyError(error)
    feedback.error(uploadError.value)
  } finally {
    pending.value = false
    uploadingNames.value = []
  }
}

function remove(id: number) {
  uploadError.value = ''
  emit('update:modelValue', props.modelValue.filter(value => value !== id))
}
</script>

<template>
  <div class="media-preparation">
    <div class="media-preparation__status">
      <div>
        <strong>添加微博图片</strong>
        <small>选择后立即逐张上传，无需 Weibo Ability。</small>
      </div>
      <span aria-live="polite">{{ modelValue.length }} / 9 已准备</span>
    </div>

    <LsUploadField
      accept="image/*"
      multiple
      :show-url="false"
      :button-label="uploadLabel"
      :loading="pending"
      :disabled="Boolean(disabledReason)"
      :disabled-reason="disabledReason"
      show-reason
      @change="uploadSelected"
    />

    <div v-if="pending && uploadingNames.length" class="media-preparation__progress" role="status">
      正在上传 {{ uploadingNames.length }} 张图片：{{ uploadingNames.join('、') }}
    </div>
    <LsInlineError v-if="uploadError" :message="uploadError" />

    <ul v-if="modelValue.length" class="media-preparation__list" aria-label="已准备图片">
      <li v-for="(id, index) in modelValue" :key="id">
        <img :src="`/api${prefix}/media/${id}/content`" :alt="`已准备图片 ${index + 1}`">
        <div>
          <strong>图片 {{ index + 1 }}</strong>
          <small>已上传，可跨账号复用</small>
        </div>
        <LsButton variant="ghost" size="sm" @click="remove(id)">移除</LsButton>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.media-preparation { display: grid; gap: 1rem; }
.media-preparation__status { display: flex; align-items: start; justify-content: space-between; gap: 1rem; }
.media-preparation__status > div { display: grid; min-width: 0; gap: .25rem; }
.media-preparation__status small, .media-preparation__list small { color: var(--text-secondary); }
.media-preparation__status > span { flex: none; padding: .25rem .6rem; border-radius: 999px; background: var(--surface-muted); color: var(--text-secondary); font-size: .875rem; font-variant-numeric: tabular-nums; }
.media-preparation__progress { overflow-wrap: anywhere; color: var(--text-secondary); font-size: .875rem; }
.media-preparation__list { display: grid; gap: .5rem; margin: 0; padding: 0; list-style: none; }
.media-preparation__list li { display: grid; grid-template-columns: 3rem minmax(0, 1fr) max-content; align-items: center; gap: .75rem; padding-block: .5rem; border-block-start: 1px solid var(--border); }
.media-preparation__list img { inline-size: 3rem; block-size: 3rem; border-radius: .5rem; background: var(--surface-muted); object-fit: cover; }
.media-preparation__list li > div { display: grid; min-width: 0; gap: .15rem; }
.media-preparation__list strong, .media-preparation__list small { overflow-wrap: anywhere; }
@media(max-width: 520px) {
  .media-preparation__status { align-items: stretch; flex-direction: column; }
  .media-preparation__status > span { align-self: start; }
}
</style>
