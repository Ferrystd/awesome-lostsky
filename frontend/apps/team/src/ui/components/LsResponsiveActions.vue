<script setup lang="ts">
import { MoreHorizontal } from '@lucide/vue'
import { NButton, NDropdown } from 'naive-ui'
import type { DropdownOption } from 'naive-ui'
import { computed } from 'vue'
import type { Component } from 'vue'
import { feedback } from '../feedback'

type LsAction = {
  key: string
  label: string
  disabled?: boolean
  reason?: string
  danger?: boolean
  icon?: Component
}

const props = withDefaults(defineProps<{
  actions: LsAction[]
  primaryKey?: string
  moreLabel?: string
}>(), { primaryKey: '', moreLabel: '更多' })
const emit = defineEmits<{ select: [key: string] }>()
const primary = computed(() => props.actions.find(action => action.key === props.primaryKey))
const secondary = computed(() => props.actions.filter(action => action.key !== props.primaryKey))
const options = computed<DropdownOption[]>(() => secondary.value.map(action => ({
  key: action.key,
  label: action.label,
  disabled: action.disabled && !action.reason,
  props: {
    ...(action.danger ? { style: 'color: var(--danger)' } : {}),
    ...(action.disabled && action.reason ? { style: `${action.danger ? 'color: var(--danger);' : ''} opacity: .5`, 'aria-disabled': 'true' } : {}),
  },
})))

function select(key: string) {
  const action = props.actions.find(item => item.key === key)
  if (action?.disabled) {
    if (action.reason?.trim()) feedback.info(action.reason.trim())
    return
  }
  emit('select', key)
}
</script>

<template>
  <div class="ls-responsive-actions">
    <div class="ls-responsive-actions__desktop">
      <NButton
        v-for="action in actions"
        :key="action.key"
        text
        :type="action.danger ? 'error' : 'default'"
        :class="{ 'ls-responsive-actions__explainable-disabled': action.disabled && action.reason }"
        :disabled="action.disabled && !action.reason"
        :aria-disabled="action.disabled || undefined"
        @click="select(action.key)"
      ><template v-if="action.icon" #icon><component :is="action.icon" :size="18" /></template>{{ action.label }}</NButton>
    </div>
    <div class="ls-responsive-actions__mobile">
      <NButton v-if="primary" text :class="{ 'ls-responsive-actions__explainable-disabled': primary.disabled && primary.reason }" :disabled="primary.disabled && !primary.reason" :aria-disabled="primary.disabled || undefined" @click="select(primary.key)"><template v-if="primary.icon" #icon><component :is="primary.icon" :size="18" /></template>{{ primary.label }}</NButton>
      <NDropdown v-if="options.length" trigger="click" :options="options" @select="select(String($event))">
        <NButton text><template #icon><MoreHorizontal :size="18" /></template>{{ moreLabel }}</NButton>
      </NDropdown>
    </div>
  </div>
</template>

<style scoped>
.ls-responsive-actions__desktop,.ls-responsive-actions__mobile{display:flex;align-items:center;justify-content:flex-end;gap:.25rem}.ls-responsive-actions__desktop :deep(.n-button){min-height:40px;padding-inline:.5rem}.ls-responsive-actions__mobile{display:none}
.ls-responsive-actions__explainable-disabled{opacity:.5}
@media(max-width:639px){.ls-responsive-actions__desktop{display:none}.ls-responsive-actions__mobile{display:flex;justify-content:flex-end}.ls-responsive-actions__mobile :deep(.n-button){min-width:44px;min-height:44px;padding-inline:.5rem}}
</style>
