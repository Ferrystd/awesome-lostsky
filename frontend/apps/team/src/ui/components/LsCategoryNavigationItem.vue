<script setup lang="ts">
import { NButton } from 'naive-ui'
import { RouterLink } from 'vue-router'

defineProps<{ label: string; to?: string; current: boolean; dirty?: boolean; panelId: string }>()
defineEmits<{ select: []; keydown: [event: KeyboardEvent] }>()
</script>

<template>
  <RouterLink v-if="to" class="team-category-item" :to="to" :aria-current="current ? 'page' : undefined" @keydown="$emit('keydown', $event)">
    <span>{{ label }}</span><small v-if="dirty">未保存</small>
  </RouterLink>
  <NButton v-else text class="team-category-item" attr-type="button" :aria-current="current ? 'true' : undefined" :aria-controls="panelId" @click="$emit('select')" @keydown="$emit('keydown', $event)">
    <span>{{ label }}</span><small v-if="dirty">未保存</small>
  </NButton>
</template>

<style scoped>
.team-category-item { width: 100%; min-height: 44px; height: auto; display: flex; align-items: center; justify-content: space-between; gap: .5rem; padding: .75rem; border: 0; border-radius: var(--radius-md); background: transparent; color: var(--text-secondary); font: inherit; font-size: .875rem; text-align: left; cursor: pointer; text-decoration: none; white-space: normal; }
.team-category-item span { min-width: 0; overflow-wrap: anywhere; }
.team-category-item small { flex: none; font-size: .75rem; color: var(--text-secondary); }
.team-category-item:hover { background: var(--surface); color: var(--text); }
.team-category-item[aria-current] { background: color-mix(in srgb, var(--primary) 8%, transparent); color: var(--primary); font-weight: 650; }
.team-category-item:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
.team-category-item.n-button { transition: none; }
.team-category-item.n-button:hover { color: var(--text); }
.team-category-item.n-button[aria-current] { color: var(--primary); }
/* NButton supplies interaction semantics; this primitive owns its label track. */
.team-category-item :deep(.n-button__content) { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: .5rem; white-space: normal; }
</style>
