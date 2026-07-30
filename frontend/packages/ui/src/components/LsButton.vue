<script setup lang="ts">
import { LoaderCircle } from '@lucide/vue'
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}>(), { variant: 'primary', size: 'md', type: 'button' })

const classes = computed(() => [
  'ls-button', `ls-button--${props.variant}`, `ls-button--${props.size}`,
])
</script>

<template>
  <button :type="type" :class="classes" :disabled="disabled || loading" :aria-busy="loading || undefined">
    <LoaderCircle v-if="loading" :size="18" class="ls-button__spinner" aria-hidden="true" />
    <slot />
  </button>
</template>

<style scoped>
.ls-button { min-height: 44px; display: inline-flex; align-items: center; justify-content: center; gap: .5rem; padding: .65rem 1rem; border: 0; border-radius: var(--radius-sm); font-weight: 650; cursor: pointer; transition: background-color var(--motion-fast) var(--ease-standard), color var(--motion-fast) var(--ease-standard), transform var(--motion-instant) var(--ease-out); }
.ls-button:active:not(:disabled) { transform: translateY(1px); }
.ls-button:disabled { opacity: .48; cursor: not-allowed; }
.ls-button--primary { background: var(--sky-lost-strong); color: white; }
.ls-button--primary:hover:not(:disabled) { background: color-mix(in oklch, var(--sky-lost-strong), black 12%); }
.ls-button--secondary { background: white; color: var(--ink); border: 1px solid var(--line); }
.ls-button--secondary:hover:not(:disabled), .ls-button--ghost:hover:not(:disabled) { background: var(--cloud); }
.ls-button--ghost { background: transparent; color: var(--muted-ink); }
.ls-button--danger { background: var(--danger); color: white; }
.ls-button--sm { min-height: 40px; padding: .45rem .75rem; font-size: .875rem; }
.ls-button--lg { min-height: 50px; padding: .8rem 1.25rem; }
.ls-button__spinner { animation: ls-spin .8s linear infinite; }
@keyframes ls-spin { to { transform: rotate(360deg); } }
</style>
