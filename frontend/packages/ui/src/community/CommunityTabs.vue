<script setup lang="ts">
import { NTabs, NTab } from 'naive-ui'
const props = defineProps<{ value: string | number; items: { key: string | number; label: string }[]; label: string }>()
const emit = defineEmits<{ change: [value: string | number] }>()
function keydown(event: KeyboardEvent, index: number) {
  let next = index
  if (event.key === 'ArrowRight') next = (index + 1) % props.items.length
  else if (event.key === 'ArrowLeft') next = (index - 1 + props.items.length) % props.items.length
  else if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = props.items.length - 1
  else if (!['Enter', ' '].includes(event.key)) return
  event.preventDefault()
  const tabs = (event.currentTarget as HTMLElement).closest('[role="tablist"]')?.querySelectorAll<HTMLElement>('[role="tab"]')
  tabs?.[next]?.focus()
  emit('change', props.items[next].key)
}
</script>
<template><NTabs :value="value" type="line" size="large" role="tablist" :aria-label="label" @update:value="emit('change', $event)"><NTab v-for="(item, index) in items" :key="item.key" :name="item.key" role="tab" :tabindex="item.key === value ? 0 : -1" :aria-selected="item.key === value" class="community-tabs__item" @keydown="keydown($event, index)">{{ item.label }}</NTab></NTabs></template>
<style scoped>.community-tabs__item{min-height:44px}</style>
