<script setup lang="ts">
import { NButton } from 'naive-ui'
import { computed } from 'vue'
import { CircleArrowRight, LoaderCircle } from '@lucide/vue'
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
    :class="['ls-button', `ls-button--${variant}`, { 'ls-button--explainable-disabled': explainableDisabled }]"
    :attr-type="type"
    :type="naiveType"
    :size="naiveSize"
    :secondary="variant === 'secondary'"
    :quaternary="variant === 'ghost' || variant === 'danger-ghost'"
    :loading="loading"
    :disabled="disabled && !explainableDisabled"
    :aria-disabled="disabled || undefined"
    :aria-busy="loading || undefined"
    @click="click"
  >
    <template v-if="$slots.icon" #icon><slot name="icon" /></template>
    <slot />
    <component
      :is="loading ? LoaderCircle : CircleArrowRight"
      v-if="variant === 'primary'"
      :class="['ls-button__forward', { 'ls-button__forward--loading': loading }]"
      :size="24"
      :stroke-width="1.5"
      aria-hidden="true"
    />
  </NButton>
</template>

<style scoped>
.ls-button { font-weight: 650; }
.ls-button:is(.ls-button--ghost, .ls-button--danger-ghost) { min-height: 44px; font-size: .875rem; font-weight: 500; }
.ls-button--explainable-disabled { opacity: .5; }
.ls-button__forward { display: none; }

/* The scene owns the palette; the button owns its surface and inset stroke. */
.ls-theme-aurora .ls-button:is(.ls-button--primary, .ls-button--secondary, .ls-button--danger) {
  --button-ink: var(--text);
  color: var(--button-ink) !important;
  background-color: var(--button-surface, var(--command-surface)) !important;
}
.ls-theme-aurora .ls-button--primary { --button-ink: var(--primary) !important; }
.ls-theme-aurora .ls-button--danger { --button-ink: var(--danger) !important; }
.ls-theme-aurora .ls-button:is(.ls-button--secondary, .ls-button--danger)::after {
  content: '';
  position: absolute;
  inset: 4px;
  border: 2px dashed var(--button-ink);
  border-radius: var(--n-border-radius);
  pointer-events: none;
  transition: border-color var(--motion-fast) var(--ease-standard);
}
.ls-theme-aurora .ls-button:is(.ls-button--secondary, .ls-button--danger)::before {
  content: '';
  position: absolute;
  inset: 0;
  border: 1px solid var(--command-border);
  border-radius: inherit;
  pointer-events: none;
}
.ls-theme-aurora .ls-button:is(.ls-button--primary, .ls-button--secondary, .ls-button--danger) :deep(.n-button__border),
.ls-theme-aurora .ls-button:is(.ls-button--primary, .ls-button--secondary, .ls-button--danger) :deep(.n-button__state-border) {
  display: none;
}
@media (hover: hover) {
  .ls-theme-aurora .ls-button:is(.ls-button--secondary, .ls-button--danger):not([aria-disabled='true']):not(.n-button--loading):hover {
    background-color: var(--button-surface, var(--command-surface-hover)) !important;
  }
  .ls-theme-aurora .ls-button:is(.ls-button--secondary, .ls-button--danger):not([aria-disabled='true']):not(.n-button--loading):hover::after {
    border-color: color-mix(in srgb, var(--button-ink), white 20%);
  }
}
.ls-theme-aurora .ls-button:is(.ls-button--secondary, .ls-button--danger):not([aria-disabled='true']):not(.n-button--loading):active {
  background-color: var(--button-surface, var(--command-surface-pressed)) !important;
}
.ls-theme-aurora .ls-button--primary {
  --button-surface: transparent;
}
.ls-theme-aurora .ls-button--primary :deep(.n-button__icon) { display: none; }
.ls-theme-aurora .ls-button--primary .ls-button__forward {
  display: block;
  flex: none;
  margin-inline-start: .5rem;
}
.ls-theme-aurora .ls-button--primary:not([aria-disabled='true']):not(.n-button--loading):hover {
  color: var(--primary-hover) !important;
}
.ls-button__forward--loading { animation: ls-button-spin 1s linear infinite; }
@keyframes ls-button-spin { to { transform: rotate(360deg); } }
.ls-theme-aurora .ls-button:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}
@media (prefers-reduced-motion: reduce) {
  .ls-theme-aurora .ls-button::after { transition: none; }
  .ls-button__forward--loading { animation: none; }
}
</style>
