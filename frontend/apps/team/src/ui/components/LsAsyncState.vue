<script setup lang="ts">
import { NAlert, NSkeleton } from 'naive-ui'

withDefaults(defineProps<{
  state: 'loading' | 'error'
  title?: string
  description?: string
  rows?: number
}>(), { title: '', description: '', rows: 3 })
</script>

<template>
  <section class="ls-async-state" :aria-busy="state === 'loading' || undefined" :role="state === 'error' ? 'alert' : 'status'">
    <template v-if="state === 'loading'"><NSkeleton v-for="row in rows" :key="row" text :repeat="1" /></template>
    <NAlert v-else type="error" :title="title || '暂时无法读取'">{{ description || '请稍后再试；页面其他功能仍可继续使用。' }}</NAlert>
  </section>
</template>

<style scoped>
.ls-async-state{display:grid;gap:.75rem;padding:1.5rem;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md)}
</style>
