<script setup lang="ts">
import { computed, ref } from 'vue'
import LsInlineError from './LsInlineError.vue'
import LsUploadField from './LsUploadField.vue'

const value = defineModel<string>({ default: '' })
const props = withDefaults(defineProps<{
  upload: (file: File) => Promise<string>
  id?: string
  accept?: string
  placeholder?: string
  buttonLabel?: string
  disabled?: boolean
  disabledReason?: string
}>(), {
  accept: '',
  placeholder: '文件 URL 或选择文件',
  buttonLabel: '选择文件',
  disabled: false,
  disabledReason: '',
})
const emit = defineEmits<{
  uploading: [value: boolean]
  uploaded: [url: string]
}>()
const loading = ref(false)
const error = ref('')
const effectiveDisabledReason = computed(() => loading.value ? '文件正在上传，请稍候' : props.disabledReason)

async function chooseFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (props.disabled || props.disabledReason) {
    input.value = ''
    return
  }
  loading.value = true
  error.value = ''
  emit('uploading', true)
  try {
    const url = await props.upload(file)
    value.value = url
    emit('uploaded', url)
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '文件上传失败，请稍后重试'
  } finally {
    loading.value = false
    emit('uploading', false)
    input.value = ''
  }
}
</script>

<template>
  <div class="ls-media-upload-field">
    <LsUploadField
      :id="id"
      v-model="value"
      :accept="accept"
      :placeholder="placeholder"
      :button-label="buttonLabel"
      :loading="loading"
      :disabled="disabled || loading || Boolean(disabledReason)"
      :disabled-reason="effectiveDisabledReason"
      @change="chooseFile"
    />
    <LsInlineError v-if="error" :message="error" />
  </div>
</template>

<style scoped>
.ls-media-upload-field { display: grid; gap: .5rem; }
</style>
