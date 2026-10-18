<script setup lang="ts">
import { NListItem } from 'naive-ui'
import type { Component } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'

defineProps<{ title?: string; description?: string; to?: RouteLocationRaw; icon?: Component; unread?: boolean }>()
</script>

<template>
  <NListItem :class="['ls-resource-row', { 'ls-resource-row--unread': unread }]">
    <div class="ls-resource-row__layout">
      <component :is="to ? RouterLink : 'div'" :to="to" class="ls-resource-row__main">
        <span v-if="icon && !$slots.identity" class="ls-resource-row__icon" aria-hidden="true"><component :is="icon" :size="20" /></span>
        <div class="ls-resource-row__copy">
          <slot name="identity">
            <div class="ls-resource-row__heading"><h2>{{ title }}</h2><slot name="status" /></div>
          </slot>
          <p v-if="description" class="ls-resource-row__description">{{ description }}</p>
          <div v-if="$slots.metadata" class="ls-resource-row__metadata"><slot name="metadata" /></div>
        </div>
      </component>
      <div v-if="$slots.actions" class="ls-resource-row__actions"><slot name="actions" /></div>
    </div>
  </NListItem>
</template>

<style scoped>
.ls-resource-row.n-list-item { container-type: inline-size; padding: 1rem; transition: background-color var(--motion-fast) var(--ease-standard); }
.ls-resource-row :deep(.n-list-item__main) { min-width: 0; width: 100%; }
.ls-resource-row:hover, .ls-resource-row:focus-within { background: var(--surface-subtle); }
.ls-resource-row--unread { background: color-mix(in oklch, var(--primary), var(--surface) 97%); }
.ls-resource-row__layout { width: 100%; min-width: 0; display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: .75rem 1rem; }
.ls-resource-row__main { min-width: 0; min-height: 44px; display: flex; align-items: center; gap: .75rem; color: var(--text); text-decoration: none; }
.ls-resource-row__icon { width: 40px; height: 40px; flex: 0 0 40px; display: grid; place-items: center; border-radius: var(--radius-sm); color: var(--primary); background: var(--surface-subtle); }
.ls-resource-row__copy { min-width: 0; flex: 1; }
.ls-resource-row__heading { display: flex; align-items: center; flex-wrap: wrap; gap: .5rem; }
.ls-resource-row__heading h2 { margin: 0; font-size: 1rem; font-weight: 600; line-height: 1.5; overflow-wrap: anywhere; }
.ls-resource-row__description { margin: .25rem 0 0; color: var(--text-secondary); font-size: .875rem; line-height: 1.6; overflow-wrap: anywhere; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.ls-resource-row__metadata { display: flex; align-items: center; flex-wrap: wrap; gap: .25rem 1rem; margin-top: .5rem; color: var(--text-secondary); font-size: .8125rem; line-height: 1.6; overflow-wrap: anywhere; }
.ls-resource-row__actions { min-width: 0; display: flex; justify-content: flex-end; }
@container (max-width: 40rem) {
  .ls-resource-row__layout { grid-template-columns: minmax(0, 1fr); }
  .ls-resource-row__actions { justify-content: flex-end; }
}
@media (prefers-reduced-motion: reduce) { .ls-resource-row { transition: none; } }
</style>
