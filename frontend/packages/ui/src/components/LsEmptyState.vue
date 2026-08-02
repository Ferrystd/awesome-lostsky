<script setup lang="ts">
import { NEmpty } from 'naive-ui'

defineProps<{
  title: string
  description: string
}>()
</script>

<template>
  <section class="ls-empty-state" role="status">
    <NEmpty :description="title">
      <template #extra>
        <p class="ls-empty-state__description">{{ description }}</p>
      </template>
    </NEmpty>
  </section>
</template>

<style scoped>
.ls-empty-state {
  box-sizing: border-box;
  min-width: 0;
  min-height: 12rem;
  display: grid;
  place-items: center;
  padding: 2rem 1.25rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  text-align: center;
}

.ls-empty-state__description {
  max-width: 38rem;
  margin: 0;
  color: var(--text-secondary);
  font-size: .875rem;
  line-height: 1.6;
}
</style>
