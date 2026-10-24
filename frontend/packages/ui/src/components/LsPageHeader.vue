<script setup lang="ts">
import { ArrowLeft } from '@lucide/vue'
import type { RouteLocationRaw } from 'vue-router'

defineProps<{ title: string; description?: string; backTo?: RouteLocationRaw; backLabel?: string }>()
</script>

<template>
  <div class="ls-page-header">
    <RouterLink v-if="backTo" class="ls-page-header__back" :to="backTo"><ArrowLeft :size="18" />{{ backLabel || '返回' }}</RouterLink>
    <header :class="{ 'ls-page-header__content--described': description }">
      <div class="ls-page-header__copy"><h1>{{ title }}</h1><p v-if="description">{{ description }}</p></div>
      <div v-if="$slots.actions || $slots.default" class="ls-page-header__actions"><slot name="actions"><slot /></slot></div>
    </header>
  </div>
</template>

<style scoped>
.ls-page-header { min-width: 0; display: grid; gap: .75rem; container-type: inline-size; }
.ls-page-header__back { width: fit-content; min-height: var(--touch-target); display: inline-flex; align-items: center; gap: .5rem; color: var(--primary); font-size: .875rem; font-weight: 650; }
.ls-page-header > header { min-width: 0; display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.ls-page-header__copy { min-width: 0; }
.ls-page-header h1, .ls-page-header p { margin: 0; overflow-wrap: anywhere; }
.ls-page-header h1 { font-size: 1.35rem; line-height: 1.25; text-wrap: balance; }
.ls-page-header p { max-width: 65ch; margin-top: .375rem; color: var(--text-secondary); font-size: .875rem; line-height: 1.6; text-wrap: pretty; }
.ls-page-header__actions { min-width: 0; display: flex; align-items: center; justify-content: flex-end; flex-wrap: wrap; gap: .5rem .75rem; }
@container (max-width: 40rem) {
  .ls-page-header > header { display: grid; grid-template-columns: minmax(0, 1fr) fit-content(70%); align-items: start; gap: .5rem .75rem; }
  .ls-page-header__copy { display: contents; }
  .ls-page-header h1 { grid-column: 1; grid-row: 1; }
  .ls-page-header p { grid-column: 1 / -1; grid-row: 2; margin-top: 0; }
  .ls-page-header__actions { grid-column: 2; grid-row: 1; flex-wrap: nowrap; }
}
</style>
