<script setup lang="ts">
import { NButton } from 'naive-ui'
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}>(), { variant: 'primary', size: 'md', type: 'button' })

const naiveType = computed(() => props.variant === 'primary' ? 'primary' : props.variant === 'danger' ? 'error' : 'default')
const naiveSize = computed(() => ({ sm: 'small', md: 'medium', lg: 'large' } as const)[props.size])
</script>

<template>
  <NButton
    class="ls-button"
    :attr-type="type"
    :type="naiveType"
    :size="naiveSize"
    :secondary="variant === 'secondary'"
    :quaternary="variant === 'ghost'"
    :loading="loading"
    :disabled="disabled"
  >
    <template v-if="$slots.icon" #icon><slot name="icon" /></template>
    <slot />
  </NButton>
</template>

<style scoped>
.ls-button { font-weight: 650; }
</style>
