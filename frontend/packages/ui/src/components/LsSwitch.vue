<script setup lang="ts">
import { NSwitch } from 'naive-ui'

withDefaults(defineProps<{
  modelValue: boolean
  disabled?: boolean
  loading?: boolean
  readOnly?: boolean
}>(), {
  disabled: false,
  loading: false,
  readOnly: false,
})

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()
</script>

<template>
  <NSwitch
    class="ls-switch"
    :value="modelValue"
    :disabled="disabled || readOnly"
    :loading="loading"
    :aria-disabled="disabled || readOnly || undefined"
    :aria-readonly="readOnly || undefined"
    @update:value="emit('update:modelValue', $event)"
  />
</template>

<style scoped>
.ls-switch { min-height: 44px; }
</style>
