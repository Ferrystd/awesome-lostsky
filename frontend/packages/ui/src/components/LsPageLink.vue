<script setup lang="ts">
import type { Component } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'
type Destination = { to: RouteLocationRaw; href?: never } | { to?: never; href: string }
defineProps<Destination & { icon: Component; label: string; target?: '_self' | '_blank' | '_parent' | '_top'; rel?: string }>()
</script>
<template>
  <RouterLink v-if="to !== undefined" class="team-page-link" :to="to" :target="target" :rel="rel"><component :is="icon" :size="16" aria-hidden="true" />{{ label }}</RouterLink>
  <a v-else class="team-page-link" :href="href" :target="target" :rel="rel"><component :is="icon" :size="16" aria-hidden="true" />{{ label }}</a>
</template>
<style scoped>
.team-page-link { min-height: 44px; display: inline-flex; align-items: center; gap: .5rem; color: var(--text-secondary); font-size: .875rem; text-decoration: none; }
.team-page-link:hover { color: var(--primary); }
.team-page-link:focus-visible { outline: 2px solid var(--focus); outline-offset: 4px; border-radius: 4px; }
</style>
