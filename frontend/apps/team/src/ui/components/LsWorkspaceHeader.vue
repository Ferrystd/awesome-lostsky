<script setup lang="ts">
import { Menu, MoreHorizontal } from '@lucide/vue'
import { NButton, NDropdown } from 'naive-ui'
import { computed } from 'vue'
import LsAppSwitcher from './LsAppSwitcher.vue'

type LsAction = { key: string; label: string; disabled?: boolean; reason?: string }

const props = withDefaults(defineProps<{
  contextLabel: string
  title: string
  actions?: LsAction[]
  showMenu?: boolean
  appNavigation?: boolean
  currentApp?: string
  contextual?: boolean
  scene?: boolean
}>(), { actions: () => [], showMenu: true, appNavigation: false, currentApp: '' })
const emit = defineEmits<{ menu: []; action: [key: string] }>()
const options = computed(() => props.actions.map(action => ({
  key: action.key,
  label: action.disabled && action.reason ? `${action.label}（${action.reason}）` : action.label,
  disabled: action.disabled,
})))
</script>

<template>
  <header :class="['ls-workspace-header', { 'ls-workspace-header--app-nav': appNavigation, 'ls-workspace-header--contextual': contextual, 'ls-workspace-header--scene': scene }]">
    <NButton v-if="showMenu" class="ls-workspace-header__menu" quaternary aria-label="打开导航" @click="emit('menu')"><template #icon><Menu :size="20" /></template></NButton>
    <div class="ls-workspace-header__identity">
      <small>{{ contextLabel }}</small>
      <p v-if="contextual" class="ls-workspace-header__context">{{ title }}</p><h1 v-else>{{ title }}</h1>
    </div>
    <div class="ls-workspace-header__desktop"><slot name="actions" /></div>
    <div v-if="actions.length" class="ls-workspace-header__mobile">
      <LsAppSwitcher v-if="appNavigation" :actions="actions" :current-app="currentApp" @select="emit('action', $event)" />
      <NDropdown v-else trigger="click" :options="options" @select="emit('action', String($event))">
        <NButton secondary><template #icon><MoreHorizontal :size="18" /></template>操作</NButton>
      </NDropdown>
    </div>
  </header>
</template>

<style scoped>
.ls-workspace-header--scene { position: relative; z-index: 1; }
.ls-workspace-header{min-width:0;min-height:72px;display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:1rem;padding:.75rem 1.5rem;background:var(--surface);border-bottom:1px solid var(--border);font-family:var(--font-ui)}.ls-workspace-header__menu{display:none}.ls-workspace-header__identity{min-width:0}.ls-workspace-header small,.ls-workspace-header h1{margin:0}.ls-workspace-header small{color:var(--primary);font-size:.72rem;font-weight:750;letter-spacing:.06em}.ls-workspace-header h1{font-size:1.2rem;line-height:1.35}.ls-workspace-header__desktop{grid-column:3;display:flex;align-items:center;justify-content:flex-end;gap:.5rem}.ls-workspace-header__desktop :deep(a),.ls-workspace-header__desktop :deep(button){min-height:var(--touch-target);display:inline-flex;align-items:center;gap:.45rem;font-family:var(--font-ui);font-size:.875rem;font-weight:600;line-height:1.2}.ls-workspace-header__mobile{display:none}
@media(max-width:767px){.ls-workspace-header{min-height:72px;padding:.75rem 1rem}.ls-workspace-header__menu{display:inline-flex}.ls-workspace-header__desktop{display:none}.ls-workspace-header__mobile{display:inline-flex}.ls-workspace-header h1{font-size:1.05rem}}
@media(min-width:768px){.ls-workspace-header--app-nav .ls-workspace-header__desktop{width:568px;display:grid;grid-template-columns:repeat(6,88px);justify-self:end}.ls-workspace-header--app-nav .ls-workspace-header__desktop :deep(a),.ls-workspace-header--app-nav .ls-workspace-header__desktop :deep(button){width:100%;justify-content:center;padding:0;color:var(--ink);font-size:.82rem;font-weight:650}}
.ls-workspace-header--contextual{background:var(--cloud);border-bottom-color:var(--line)}.ls-workspace-header--contextual small{color:var(--text-tertiary);font-weight:500;letter-spacing:0}.ls-workspace-header__context{margin:0;color:var(--text-secondary);font-size:.875rem;font-weight:500;line-height:1.5}
</style>
