<script setup lang="ts">
import { ArrowLeft } from '@lucide/vue'
import type { RouteLocationRaw } from 'vue-router'

defineProps<{ title: string; description?: string; backTo?: RouteLocationRaw; backLabel?: string }>()
</script>

<template>
  <div class="page-heading">
    <RouterLink v-if="backTo" class="back-link" :to="backTo"><ArrowLeft :size="18" />{{ backLabel || '返回' }}</RouterLink>
    <header>
      <div><h2>{{ title }}</h2><p v-if="description">{{ description }}</p></div>
      <div v-if="$slots.actions" class="heading-actions"><slot name="actions" /></div>
    </header>
  </div>
</template>
