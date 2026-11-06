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

<style scoped src="../../../../../packages/ui/src/components/workspace-header.css"></style>
