<script setup lang="ts">
import { ArrowUpRight } from '@lucide/vue'
import type { Component } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

defineProps<{
  title: string
  description: string
  steps: { key: string; label: string; description: string; to: RouteLocationRaw; icon: Component }[]
}>()
</script>

<template>
  <nav class="ls-dashboard-path" :aria-label="title">
    <header><h3>{{ title }}</h3><p>{{ description }}</p></header>
    <ol>
      <li v-for="(step, index) in steps" :key="step.key">
        <RouterLink :to="step.to">
          <span class="ls-dashboard-path__node"><component :is="step.icon" :size="20" aria-hidden="true" /><span>{{ String(index + 1).padStart(2, '0') }}</span></span>
          <strong>{{ step.label }}<ArrowUpRight :size="16" aria-hidden="true" /></strong>
          <span class="ls-dashboard-path__description">{{ step.description }}</span>
        </RouterLink>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.ls-dashboard-path { min-width: 0; }
header { margin-bottom: 1.5rem; }
h3 { margin: 0; font-size: 1rem; color: var(--ink); }
header p { margin: .4rem 0 0; color: var(--muted-ink); font-size: .85rem; line-height: 1.6; }
ol { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); margin: 0; padding: 0; list-style: none; }
li { min-width: 0; border-top: 1px solid var(--line); }
a { display: grid; gap: .75rem; min-height: 44px; height: 100%; padding: 1rem; color: var(--ink); border-radius: var(--radius-md); transition: background var(--motion-fast) var(--ease-standard); }
a:hover { background: var(--cloud); }
a:focus-visible { outline: 2px solid var(--sky-lost-strong); outline-offset: 2px; }
.ls-dashboard-path__node { display: flex; align-items: center; justify-content: space-between; gap: .5rem; color: var(--sky-lost-strong); font-variant-numeric: tabular-nums; }
.ls-dashboard-path__node > span { font-size: .75rem; }
strong { display: flex; align-items: center; justify-content: space-between; gap: .5rem; font-size: .95rem; }
strong svg { flex-shrink: 0; }
.ls-dashboard-path__description { color: var(--muted-ink); font-size: .8rem; line-height: 1.6; overflow-wrap: anywhere; }
@media (max-width: 799px) {
  ol { grid-auto-flow: row; grid-template-columns: minmax(0, 1fr); }
  li { border-top: 0; border-left: 1px solid var(--line); }
  a { grid-template-columns: 2rem minmax(0, 1fr); column-gap: .75rem; }
  .ls-dashboard-path__node { grid-row: span 2; flex-direction: column; justify-content: start; }
  .ls-dashboard-path__description { grid-column: 2; }
}
@media (prefers-reduced-motion: reduce) { a { transition: none; } }
</style>
