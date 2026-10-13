<script setup lang="ts">
import type { Component } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'
defineProps<{ to: RouteLocationRaw; icon: Component; label: string }>()
</script>
<template>
  <RouterLink class="team-page-link" :to="to"><component :is="icon" :size="16" aria-hidden="true" />{{ label }}</RouterLink>
</template>
<style scoped>
.team-page-link { min-height: 44px; display: inline-flex; align-items: center; gap: .5rem; color: var(--text-secondary); font-size: .875rem; text-decoration: none; }
.team-page-link:hover { color: var(--primary); }
.team-page-link:focus-visible { outline: 2px solid var(--focus); outline-offset: 4px; border-radius: 4px; }
</style>
