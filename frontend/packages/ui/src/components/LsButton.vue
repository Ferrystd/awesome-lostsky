<script setup lang="ts">
import { NButton } from 'naive-ui'
import { computed } from 'vue'
import { feedback } from '../feedback'

const props = withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  disabledReason?: string
  type?: 'button' | 'submit' | 'reset'
}>(), { variant: 'primary', size: 'md', disabledReason: '', type: 'button' })

const emit = defineEmits<{ click: [event: MouseEvent] }>()

const naiveType = computed(() => props.variant === 'primary' ? 'primary' : props.variant === 'danger' || props.variant === 'danger-ghost' ? 'error' : 'default')
const naiveSize = computed(() => ({ sm: 'small', md: 'medium', lg: 'large' } as const)[props.size])
const explainableDisabled = computed(() => props.disabled && Boolean(props.disabledReason.trim()))

function click(event: MouseEvent) {
  if (props.disabled) {
    event.preventDefault()
    if (explainableDisabled.value) feedback.info(props.disabledReason.trim())
    return
  }
  emit('click', event)
}
</script>

<template>
  <NButton
    :class="['ls-button', { 'ls-button--explainable-disabled': explainableDisabled }]"
    :attr-type="type"
    :type="naiveType"
    :size="naiveSize"
    :secondary="variant === 'secondary'"
    :quaternary="variant === 'ghost' || variant === 'danger-ghost'"
    :loading="loading"
    :disabled="disabled && !explainableDisabled"
    :aria-disabled="disabled || undefined"
    @click="click"
  >
    <template v-if="$slots.icon" #icon><slot name="icon" /></template>
    <slot />
  </NButton>
</template>

<style scoped>
.ls-button { font-weight: 650; }
.ls-button--explainable-disabled { opacity: .5; }
</style>
