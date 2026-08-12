<script setup lang="ts">
import { NSwitch } from 'naive-ui'
import { computed } from 'vue'
import { feedback } from '../feedback'

const props = withDefaults(defineProps<{
  modelValue: boolean
  disabled?: boolean
  loading?: boolean
  readOnly?: boolean
  disabledReason?: string
}>(), {
  disabled: false,
  loading: false,
  readOnly: false,
  disabledReason: '',
})

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()
const explainableDisabled = computed(() => props.disabled && Boolean(props.disabledReason.trim()))

function update(value: boolean): void {
  if (props.disabled) {
    if (explainableDisabled.value) feedback.info(props.disabledReason.trim())
    return
  }
  emit('update:modelValue', value)
}
</script>

<template>
  <NSwitch
    :class="['ls-switch', { 'ls-switch--explainable-disabled': explainableDisabled }]"
    :value="modelValue"
    :disabled="(disabled && !explainableDisabled) || readOnly"
    :loading="loading"
    :aria-disabled="disabled || readOnly || undefined"
    :aria-readonly="readOnly || undefined"
    :title="(disabled || readOnly) && disabledReason ? disabledReason : undefined"
    @update:value="update"
  />
</template>

<style scoped>
.ls-switch { min-height: 44px; }
.ls-switch[aria-disabled='true'] { cursor: not-allowed; }
.ls-switch[aria-disabled='true'] :deep(.n-switch__rail),
.ls-switch[aria-disabled='true'] :deep(.n-switch__button) { cursor: not-allowed; }
.ls-switch[aria-disabled='true'] :deep(.n-switch__rail) { opacity: .5; }
.ls-switch[aria-disabled='true'] :deep(.n-switch__button) { background-color: var(--line); box-shadow: none; }
</style>
