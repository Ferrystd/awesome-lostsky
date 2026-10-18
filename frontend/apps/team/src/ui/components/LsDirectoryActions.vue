<script setup lang="ts">
import { MoreHorizontal } from '@lucide/vue'
import { NButton, NDropdown, type DropdownOption } from 'naive-ui'
import { computed, type Component } from 'vue'
import { feedback } from '../feedback'

defineOptions({ inheritAttrs: false })
const props = defineProps<{
  label: string
  actions: { key: string; label: string; disabled?: boolean; reason?: string; danger?: boolean; icon?: Component }[]
}>()
const emit = defineEmits<{ select: [key: string] }>()
const options = computed<DropdownOption[]>(() => props.actions.map(action => ({
  key: action.key,
  label: action.label,
  disabled: action.disabled && !action.reason,
  props: {
    style: [action.danger ? 'color: var(--danger)' : '', action.disabled && action.reason ? 'opacity: .5' : ''].filter(Boolean).join(';'),
    'aria-disabled': action.disabled || undefined,
  },
})))
function select(key: string) {
  const action = props.actions.find(item => item.key === key)
  if (!action) return
  if (action.disabled) {
    if (action.reason?.trim()) feedback.info(action.reason.trim())
    return
  }
  emit('select', key)
}
</script>

<template>
  <NDropdown v-if="options.length" trigger="click" :options="options" @select="select(String($event))">
    <NButton class="ls-directory-actions" text :aria-label="label">
      <template #icon><MoreHorizontal :size="18" aria-hidden="true" /></template>更多
    </NButton>
  </NDropdown>
</template>

<style scoped>
.ls-directory-actions { min-width: 44px; min-height: 44px; color: var(--text-secondary); }
</style>
