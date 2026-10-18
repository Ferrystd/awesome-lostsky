<script setup lang="ts">
import { NEmpty } from 'naive-ui'
import { computed, inject } from 'vue'
import { routeLocationKey } from 'vue-router'
import { readAccessReason } from '@lostsky/api/access-result'

const props = defineProps<{
  title: string
  description: string
  source?: unknown
  accessReason?: string
}>()
const route = inject(routeLocationKey, undefined)
const reason = computed(() => props.accessReason || readAccessReason(props.source) || String(route?.meta.accessReason ?? ''))
</script>

<template>
  <section class="ls-empty-state" role="status">
    <NEmpty :description="reason ? '无法读取数据' : title" :theme-overrides="{ textColor: 'var(--text-secondary)' }">
      <template #extra>
        <p class="ls-empty-state__description">{{ reason || description }}</p>
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
