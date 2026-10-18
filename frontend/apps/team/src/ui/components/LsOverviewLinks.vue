<script setup lang="ts">
import type { Component } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import LsPageLink from './LsPageLink.vue'

defineProps<{
  label: string
  entries: readonly { key: string; label: string; description: string; to: RouteLocationRaw; icon: Component }[]
}>()
</script>

<template>
  <nav class="ls-overview-links" :aria-label="label">
    <ul>
      <li v-for="entry in entries" :key="entry.key">
        <LsPageLink :to="entry.to" :icon="entry.icon" :label="entry.label" />
        <p>{{ entry.description }}</p>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.ls-overview-links { min-width: 0; container-type: inline-size; }
ul { list-style: none; padding: 0; margin: 0; }
li { min-width: 0; display: grid; grid-template-columns: minmax(0, 1fr); gap: 0 .75rem; align-items: center; padding: .75rem 0; }
li + li { border-top: 1px solid var(--border); }
li:first-child { padding-top: 0; }
li:last-child { padding-bottom: 0; }
p { margin: 0; color: var(--text-secondary); font-size: .875rem; line-height: 1.6; overflow-wrap: anywhere; }
@container (min-width: 36rem) { li { grid-template-columns: minmax(10rem, 1fr) minmax(0, 2fr); gap: 1.5rem; } }
</style>
