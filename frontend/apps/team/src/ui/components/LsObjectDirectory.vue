<script setup lang="ts">
import LsCollectionPage from './LsCollectionPage.vue'

defineOptions({ inheritAttrs: false })
defineProps<{ title: string; description?: string }>()
</script>

<template>
  <div class="ls-object-directory">
    <LsCollectionPage :title="title" :description="description">
      <template v-if="$slots.actions" #actions><slot name="actions" /></template>
      <div class="ls-object-directory__body">
        <slot name="toolbar" />
        <slot />
      </div>
      <template v-if="$slots.pagination" #pagination><slot name="pagination" /></template>
    </LsCollectionPage>
  </div>
</template>

<style scoped>
.ls-object-directory { width: 100%; max-width: 64rem; min-width: 0; margin-inline: auto; }
.ls-object-directory__body { min-width: 0; display: grid; gap: 1rem; }
</style>
