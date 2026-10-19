<script setup lang="ts">
import { computed, type Component } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import { feedback } from '../feedback'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  icon: Component
  label: string
  to?: RouteLocationRaw
  href?: string
  loading?: boolean
  disabled?: boolean
  disabledReason?: string
  type?: 'button' | 'submit' | 'reset'
}>(), { href: '', disabledReason: '', type: 'button' })

const emit = defineEmits<{ click: [event: MouseEvent] }>()

const explainableDisabled = computed(() => props.disabled && Boolean(props.disabledReason.trim()))

function click(event: MouseEvent) {
  if (props.loading) {
    event.preventDefault()
    return
  }
  if (props.disabled) {
    event.preventDefault()
    if (explainableDisabled.value) feedback.info(props.disabledReason.trim())
    return
  }
  emit('click', event)
}
</script>

<template>
  <RouterLink v-if="to && !disabled && !loading" v-slot="{ href: routeHref, navigate }" :to="to" custom>
    <a v-bind="$attrs" class="ls-page-primary-action ls-page-primary-action--link" :href="routeHref" @click="navigate">
      <component :is="icon" class="ls-page-primary-action__icon" :size="18" aria-hidden="true" />
      <span>{{ label }}</span>
    </a>
  </RouterLink>
  <a v-else-if="href && !disabled && !loading" v-bind="$attrs" class="ls-page-primary-action ls-page-primary-action--link" :href="href">
    <component :is="icon" class="ls-page-primary-action__icon" :size="18" aria-hidden="true" />
    <span>{{ label }}</span>
  </a>
  <button
    v-else
    v-bind="$attrs"
    :class="['ls-page-primary-action', 'ls-page-primary-action--button', { 'ls-page-primary-action--disabled': disabled, 'ls-page-primary-action--loading': loading }]"
    :type="type"
    :disabled="loading || (disabled && !explainableDisabled)"
    :aria-disabled="disabled || loading || undefined"
    :aria-busy="loading || undefined"
    @click="click"
  >
    <span v-if="loading" class="ls-page-primary-action__spinner" aria-hidden="true" />
    <component v-else :is="icon" class="ls-page-primary-action__icon" :size="18" aria-hidden="true" />
    <span>{{ label }}</span>
  </button>
</template>

<style scoped>
.ls-page-primary-action {
  width: 8.5rem;
  max-width: 100%;
  min-width: 0;
  height: var(--touch-target);
  min-height: var(--touch-target);
  margin-inline-start: auto;
  box-sizing: border-box;
  font-weight: 700;
}
.ls-page-primary-action--link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .375rem;
  padding: 0 .75rem;
  color: var(--on-primary);
  background: var(--sky-lost-strong);
  border: 1px solid var(--sky-lost-strong);
  border-radius: var(--radius-sm);
  font-size: .875rem;
  line-height: 1;
  text-decoration: none;
  transition: background-color var(--motion-fast) var(--ease-standard), border-color var(--motion-fast) var(--ease-standard);
}
.ls-page-primary-action--button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .375rem;
  padding: 0 .75rem;
  color: var(--on-primary);
  background: var(--sky-lost-strong);
  border: 1px solid var(--sky-lost-strong);
  border-radius: var(--radius-sm);
  font: inherit;
  font-size: .875rem;
  line-height: 1;
  cursor: pointer;
  transition: background-color var(--motion-fast) var(--ease-standard), border-color var(--motion-fast) var(--ease-standard), opacity var(--motion-fast) var(--ease-standard);
}
.ls-page-primary-action--button:hover:not(.ls-page-primary-action--disabled),
.ls-page-primary-action--button:focus-visible:not(.ls-page-primary-action--disabled) {
  background: color-mix(in oklch, var(--sky-lost-strong), black 10%);
  border-color: color-mix(in oklch, var(--sky-lost-strong), black 10%);
}
.ls-page-primary-action--button:active:not(.ls-page-primary-action--disabled) {
  background: color-mix(in oklch, var(--sky-lost-strong), black 16%);
  border-color: color-mix(in oklch, var(--sky-lost-strong), black 16%);
}
.ls-page-primary-action--button:focus-visible {
  outline: 2px solid var(--sky-lost-strong);
  outline-offset: 3px;
}
.ls-page-primary-action--button:disabled { cursor: not-allowed; }
.ls-page-primary-action--link:hover {
  background: color-mix(in oklch, var(--sky-lost-strong), black 10%);
  border-color: color-mix(in oklch, var(--sky-lost-strong), black 10%);
}
.ls-page-primary-action--link:active {
  background: color-mix(in oklch, var(--sky-lost-strong), black 16%);
  border-color: color-mix(in oklch, var(--sky-lost-strong), black 16%);
}
.ls-page-primary-action--link:focus-visible {
  outline: 2px solid var(--sky-lost-strong);
  outline-offset: 3px;
}
.ls-page-primary-action__icon { flex: none; }
.ls-page-primary-action--disabled { opacity: .5; cursor: pointer; }
.ls-page-primary-action__spinner { width: 1rem; height: 1rem; flex: none; border: 2px solid color-mix(in oklch, var(--on-primary), transparent 55%); border-top-color: var(--on-primary); border-radius: 50%; animation: ls-page-primary-action-spin .8s linear infinite; }
@keyframes ls-page-primary-action-spin { to { transform: rotate(360deg); } }
@media(prefers-reduced-motion:reduce) {
  .ls-page-primary-action--link,.ls-page-primary-action--button { transition: none; }
  .ls-page-primary-action__spinner { animation: none; }
}
</style>
