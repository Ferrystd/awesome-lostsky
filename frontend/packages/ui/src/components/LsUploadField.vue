<script setup lang="ts">
import { Upload } from '@lucide/vue'
import { NInput, NProgress } from 'naive-ui'
import { ref } from 'vue'
import LsButton from './LsButton.vue'

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
function choose() {
  if (props.disabled) return
  emit('choose')
  input.value?.click()
}
</script>

<template>
  <div class="ls-upload-field">
    <div :class="['ls-upload-field__controls', { 'ls-upload-field__controls--custom-trigger': $slots.trigger, 'ls-upload-field__controls--without-url': !showUrl }]">
      <NInput v-if="showUrl" :value="modelValue" :placeholder="placeholder" :input-props="id ? { id } : undefined" @update:value="emit('update:modelValue', $event)" />
      <slot name="trigger" :choose="choose" :disabled="disabled" :disabled-reason="disabledReason" :loading="loading">
        <LsButton variant="secondary" :disabled="disabled" :disabled-reason="disabledReason" :loading="loading" @click="choose"><template #icon><Upload :size="18" /></template>{{ buttonLabel }}</LsButton>
      </slot>
      <input ref="input" :id="id ? `${id}-file` : undefined" class="ls-upload-field__input" type="file" :accept="accept" :multiple="multiple" :disabled="disabled" @change="emit('change', $event)">
    </div>
    <NProgress v-if="progress !== null" type="line" :percentage="progress" :show-indicator="true" />
    <small v-if="showReason && disabled && disabledReason" class="ls-upload-field__reason">{{ disabledReason }}</small>
  </div>
</template>

<style scoped>
.ls-upload-field{display:grid;gap:.5rem}.ls-upload-field__controls{display:grid;grid-template-columns:minmax(0,1fr) 8.5rem;gap:.75rem}.ls-upload-field__controls :deep(.ls-button){width:100%}.ls-upload-field__reason{color:var(--text-secondary)}
.ls-upload-field__input{display:none}
.ls-upload-field__controls--without-url{grid-template-columns:8.5rem}
.ls-upload-field__controls--custom-trigger{grid-template-columns:minmax(0,1fr) max-content}
.ls-upload-field__controls--custom-trigger.ls-upload-field__controls--without-url{grid-template-columns:max-content}
@media(max-width:639px){.ls-upload-field__controls,.ls-upload-field__controls--without-url,.ls-upload-field__controls--custom-trigger,.ls-upload-field__controls--custom-trigger.ls-upload-field__controls--without-url{grid-template-columns:1fr}.ls-upload-field__controls :deep(.ls-button){width:100%}}
</style>
