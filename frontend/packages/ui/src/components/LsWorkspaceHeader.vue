<script setup lang="ts">
import { Menu, MoreHorizontal } from '@lucide/vue'
import { NButton, NDropdown } from 'naive-ui'
import { computed } from 'vue'

type LsAction = { key: string; label: string; disabled?: boolean; reason?: string }

const props = withDefaults(defineProps<{
  contextLabel: string
  title: string
  actions?: LsAction[]
  showMenu?: boolean
}>(), { actions: () => [], showMenu: true })
const emit = defineEmits<{ menu: []; action: [key: string] }>()
const options = computed(() => props.actions.map(action => ({
  key: action.key,
  label: action.disabled && action.reason ? `${action.label}（${action.reason}）` : action.label,
  disabled: action.disabled,
})))
</script>

<template>
  <header class="ls-workspace-header">
    <NButton v-if="showMenu" class="ls-workspace-header__menu" quaternary aria-label="打开导航" @click="emit('menu')"><template #icon><Menu :size="20" /></template></NButton>
    <div class="ls-workspace-header__identity"><small>{{ contextLabel }}</small><h1>{{ title }}</h1></div>
    <div class="ls-workspace-header__desktop"><slot name="actions" /></div>
    <div v-if="actions.length" class="ls-workspace-header__mobile">
      <NDropdown trigger="click" :options="options" @select="emit('action', String($event))">
        <NButton secondary><template #icon><MoreHorizontal :size="18" /></template>操作</NButton>
      </NDropdown>
    </div>
  </header>
</template>

<style scoped>
.ls-workspace-header{position:sticky;z-index:var(--z-sticky);top:0;min-width:0;min-height:72px;display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:1rem;padding:.75rem 1.5rem;background:var(--surface);border-bottom:1px solid var(--border);font-family:var(--font-ui)}.ls-workspace-header__menu{display:none}.ls-workspace-header__identity{min-width:0}.ls-workspace-header small,.ls-workspace-header h1{margin:0}.ls-workspace-header small{display:block;color:var(--primary);font-size:.72rem;font-weight:750;letter-spacing:.06em}.ls-workspace-header h1{font-size:1.2rem;line-height:1.35}.ls-workspace-header__desktop{display:flex;align-items:center;justify-content:flex-end;gap:.5rem}.ls-workspace-header__desktop :deep(a),.ls-workspace-header__desktop :deep(button){min-height:var(--touch-target);display:inline-flex;align-items:center;gap:.45rem;font-family:var(--font-ui);font-size:.875rem;font-weight:600;line-height:1.2}.ls-workspace-header__mobile{display:none}
@media(max-width:767px){.ls-workspace-header{min-height:72px;padding:.75rem 1rem}.ls-workspace-header__menu{display:inline-flex}.ls-workspace-header__desktop{display:none}.ls-workspace-header__mobile{display:inline-flex}.ls-workspace-header h1{font-size:1.05rem}}
</style>
