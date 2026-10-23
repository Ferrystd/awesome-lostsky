<script setup lang="ts">
import LsPageHeader from './LsPageHeader.vue'

defineOptions({ inheritAttrs: false })
defineProps<{ title: string; description?: string }>()
</script>

<template>
  <div class="ls-collection-page">
    <LsPageHeader :title="title" :description="description">
      <template #actions>
        <slot name="actions" />
      </template>
    </LsPageHeader>
    <div v-if="$slots.toolbar" class="ls-collection-page__toolbar"><slot name="toolbar" /></div>
    <div class="ls-collection-page__content"><slot /></div>
    <footer v-if="$slots.pagination" class="ls-collection-page__pagination"><slot name="pagination" /></footer>
  </div>
</template>

<style scoped>
.ls-collection-page { min-width: 0; display: grid; gap: 1.5rem; }
.ls-collection-page__toolbar,
.ls-collection-page__content { min-width: 0; display: grid; gap: 1.5rem; }
.ls-collection-page__pagination { min-width: 0; display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 1rem; }
</style>
