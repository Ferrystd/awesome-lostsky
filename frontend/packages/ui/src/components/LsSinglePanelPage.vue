<script setup lang="ts">
import LsPageHeader from './LsPageHeader.vue'
import LsPanel from './LsPanel.vue'

defineOptions({ inheritAttrs: false })
defineProps<{ title: string; description?: string }>()
defineSlots<{ actions(): unknown; default(): unknown }>()
</script>

<template>
  <div class="ls-single-panel-page">
    <LsPageHeader :title="title" :description="description">
      <template v-if="$slots.actions" #actions><slot name="actions" /></template>
    </LsPageHeader>
    <LsPanel>
      <div class="ls-single-panel-page__content"><slot /></div>
    </LsPanel>
  </div>
</template>

<style scoped>
.ls-single-panel-page {
  width: 100%;
  max-width: 50rem;
  min-width: 0;
  margin-inline: 0 auto;
  justify-self: start;
  display: grid;
  gap: 1.5rem;
  text-align: start;
  overflow-wrap: anywhere;
}
.ls-single-panel-page__content { min-width: 0; display: grid; gap: 1.5rem; }
</style>
