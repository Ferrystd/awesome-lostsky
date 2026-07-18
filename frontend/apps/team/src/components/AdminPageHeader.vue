<script setup lang="ts">
import { ArrowLeft } from '@lucide/vue'
import type { RouteLocationRaw } from 'vue-router'

defineProps<{
  title: string
  description?: string
  backTo?: RouteLocationRaw
  backLabel?: string
}>()
</script>

<template>
  <div class="admin-page-heading">
    <RouterLink v-if="backTo" class="back" :to="backTo"><ArrowLeft :size="18" />{{ backLabel || '返回' }}</RouterLink>
    <header>
      <div>
        <h2>{{ title }}</h2>
        <p v-if="description">{{ description }}</p>
      </div>
      <div v-if="$slots.actions" class="actions"><slot name="actions" /></div>
    </header>
  </div>
</template>

<style scoped>
.admin-page-heading{min-width:0;display:grid;gap:.75rem}.back{width:fit-content;min-height:44px;display:inline-flex;align-items:center;gap:.5rem;color:var(--sky-lost-strong);font-size:.875rem;font-weight:650}.admin-page-heading>header{min-width:0;display:flex;align-items:center;justify-content:space-between;gap:1rem}.admin-page-heading h2,.admin-page-heading p{margin:0}.admin-page-heading h2{font-size:1.35rem;line-height:1.25;text-wrap:balance}.admin-page-heading p{max-width:65ch;margin-top:.375rem;color:var(--muted-ink);font-size:.875rem;line-height:1.6;text-wrap:pretty}.actions{display:flex;align-items:center;justify-content:flex-end;flex-wrap:wrap;gap:.75rem}
@media(max-width:639px){.admin-page-heading>header{align-items:stretch;flex-direction:column}.actions{display:grid;grid-template-columns:repeat(auto-fit,minmax(8rem,1fr));justify-content:stretch}.actions :deep(.n-button),.actions :deep(.ls-button){width:100%}}
</style>
