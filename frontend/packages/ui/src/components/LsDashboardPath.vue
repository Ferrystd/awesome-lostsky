<script setup lang="ts">
import LsPageLink from './LsPageLink.vue'
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
      <li v-for="step in steps" :key="step.key">
        <LsPageLink :to="step.to" :icon="step.icon" :label="step.label" />
        <p class="ls-dashboard-path__description">{{ step.description }}</p>
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
li { min-width: 0; padding: 1rem; border-top: 1px solid var(--line); }
.ls-dashboard-path__description { margin: .25rem 0 0; color: var(--muted-ink); font-size: .8rem; line-height: 1.6; overflow-wrap: anywhere; }
@media (max-width: 799px) { ol { grid-auto-flow: row; grid-template-columns: minmax(0, 1fr); } }
</style>
