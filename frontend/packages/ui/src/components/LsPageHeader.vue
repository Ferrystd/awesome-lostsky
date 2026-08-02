<script setup lang="ts">
import { ArrowLeft } from '@lucide/vue'
import type { RouteLocationRaw } from 'vue-router'

defineProps<{ title: string; description?: string; backTo?: RouteLocationRaw; backLabel?: string }>()
</script>

<template>
  <div class="ls-page-header">
    <RouterLink v-if="backTo" class="ls-page-header__back" :to="backTo"><ArrowLeft :size="18" />{{ backLabel || '返回' }}</RouterLink>
    <header>
      <div><h1>{{ title }}</h1><p v-if="description">{{ description }}</p></div>
      <div v-if="$slots.actions || $slots.default" class="ls-page-header__actions"><slot name="actions"><slot /></slot></div>
    </header>
  </div>
</template>

<style scoped>
.ls-page-header{min-width:0;display:grid;gap:.75rem}.ls-page-header__back{width:fit-content;min-height:var(--touch-target);display:inline-flex;align-items:center;gap:.5rem;color:var(--primary);font-size:.875rem;font-weight:650}.ls-page-header>header{min-width:0;display:flex;align-items:center;justify-content:space-between;gap:1rem}.ls-page-header h1,.ls-page-header p{margin:0}.ls-page-header h1{font-size:1.35rem;line-height:1.25;text-wrap:balance}.ls-page-header p{max-width:65ch;margin-top:.375rem;color:var(--text-secondary);font-size:.875rem;line-height:1.6;text-wrap:pretty}.ls-page-header__actions{display:flex;align-items:center;justify-content:flex-end;flex-wrap:wrap;gap:.75rem}
@media(max-width:639px){.ls-page-header>header{align-items:stretch;flex-direction:column}.ls-page-header__actions{display:grid;grid-template-columns:1fr}.ls-page-header__actions :deep(.n-button),.ls-page-header__actions :deep(.ls-button){width:100%}}
</style>
