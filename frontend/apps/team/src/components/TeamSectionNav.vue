<script setup lang="ts">
import { NTab, NTabs } from 'naive-ui'
import { useRoute } from 'vue-router'

defineProps<{ label: string; items: Array<{ to: string; label: string }> }>()
const route = useRoute()
</script>

<template>
  <NTabs :value="route.path" type="line" role="navigation" :aria-label="label">
    <NTab v-for="item in items" :key="item.to" :name="item.to">
      <RouterLink class="section-link" :to="item.to" :aria-current="route.path === item.to ? 'page' : undefined">{{ item.label }}</RouterLink>
    </NTab>
  </NTabs>
</template>

<style scoped>
.section-link { display: flex; align-items: center; min-height: 44px; color: inherit; }
.section-link:focus-visible { outline: 2px solid var(--sky-lost-strong); outline-offset: 2px; }
</style>
