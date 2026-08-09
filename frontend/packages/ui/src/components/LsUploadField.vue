<script setup lang="ts">
import { Upload } from '@lucide/vue'
import { NButton, NInput, NProgress } from 'naive-ui'
import { computed, ref } from 'vue'
import { feedback } from '../feedback'

const props = withDefaults(defineProps<{
  modelValue?: string
  id?: string
  placeholder?: string
  buttonLabel?: string
  disabled?: boolean
  disabledReason?: string
  loading?: boolean
  progress?: number | null
  accept?: string
  multiple?: boolean
  showUrl?: boolean
  showReason?: boolean
}>(), { modelValue: '', placeholder: '图片 URL 或选择文件', buttonLabel: '选择文件', disabledReason: '', progress: null, accept: '', multiple: false, showUrl: true, showReason: false })
const emit = defineEmits<{ 'update:modelValue': [value: string]; choose: []; change: [event: Event] }>()
const input = ref<HTMLInputElement | null>(null)
const explainableDisabled = computed(() => props.disabled && Boolean(props.disabledReason.trim()))
function choose() {
  if (props.disabled) {
    if (explainableDisabled.value) feedback.info(props.disabledReason.trim())
    return
  }
  emit('choose')
  input.value?.click()
}
</script>

<template>
  <div class="ls-upload-field">
    <div class="ls-upload-field__controls">
      <NInput v-if="showUrl" :value="modelValue" :placeholder="placeholder" :input-props="id ? { id } : undefined" @update:value="emit('update:modelValue', $event)" />
      <NButton :disabled="disabled && !explainableDisabled" :aria-disabled="disabled || undefined" :class="{ 'ls-upload-field__button--disabled': explainableDisabled }" :loading="loading" :title="disabledReason || undefined" @click="choose"><template #icon><Upload :size="18" /></template>{{ buttonLabel }}</NButton>
      <input ref="input" :id="id ? `${id}-file` : undefined" class="ls-upload-field__input" type="file" :accept="accept" :multiple="multiple" :disabled="disabled" @change="emit('change', $event)">
    </div>
    <NProgress v-if="progress !== null" type="line" :percentage="progress" :show-indicator="true" />
    <small v-if="showReason && disabled && disabledReason" class="ls-upload-field__reason">{{ disabledReason }}</small>
  </div>
</template>

<style scoped>
.ls-upload-field{display:grid;gap:.5rem}.ls-upload-field__controls{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.75rem}.ls-upload-field__reason{color:var(--text-secondary)}.ls-upload-field__button--disabled{opacity:.5}
.ls-upload-field__input{display:none}
.ls-upload-field__controls:has(> .n-button:first-child){grid-template-columns:1fr}
@media(max-width:639px){.ls-upload-field__controls{grid-template-columns:1fr}.ls-upload-field__controls :deep(.n-button){width:100%}}
</style>
