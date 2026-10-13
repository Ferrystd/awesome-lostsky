<script setup lang="ts">
import LsPageHeader from './LsPageHeader.vue'

defineOptions({ inheritAttrs: false })
defineProps<{ title: string; description?: string }>()
defineSlots<{ actions(): unknown; summary(): unknown; default(): unknown }>()
</script>

<template>
  <div class="ls-overview-page">
    <LsPageHeader :title="title" :description="description">
      <template v-if="$slots.actions" #actions><slot name="actions" /></template>
    </LsPageHeader>
    <div v-if="$slots.summary" class="ls-overview-page__summary"><slot name="summary" /></div>
    <div v-if="$slots.default" class="ls-overview-page__body"><slot /></div>
  </div>
</template>

<style scoped>
.ls-overview-page { min-width: 0; display: grid; gap: 1.5rem; overflow-wrap: anywhere; }
.ls-overview-page__summary, .ls-overview-page__body { min-width: 0; display: grid; gap: 1rem; }
</style>
