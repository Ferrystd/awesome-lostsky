<script setup lang="ts">
import { Check, ChevronDown, Globe, House, LayoutGrid, MessageCircleMore, Radio, ReceiptText, Store } from '@lucide/vue'
import { NButton, NPopover } from 'naive-ui'
import { nextTick, ref, useId } from 'vue'
import { feedback } from '../feedback'

defineProps<{ actions: { key: string; label: string; disabled?: boolean; reason?: string }[]; currentApp: string }>()
const emit = defineEmits<{ select: [key: string] }>()
const panelId = useId()
const appIcons = { display: House, team: House, shop: Store, transaction: ReceiptText, chat: MessageCircleMore, weibo: Radio }
const appOpen = ref(false)
const appPanel = ref<HTMLElement | null>(null)
const appTrigger = ref<InstanceType<typeof NButton> | null>(null)
async function toggleApps(show: boolean) {
  appOpen.value = show
  if (show) {
    await nextTick()
    const target = (appPanel.value?.querySelector<HTMLButtonElement>('button[aria-current="true"]') ?? appPanel.value?.querySelector<HTMLButtonElement>('button'))
    target?.focus()
  }
}
function closeApps() {
  appOpen.value = false
  appTrigger.value?.$el.focus()
}
function selectApp(key: string) {
  closeApps()
  emit('select', key)
}
</script>

<template>
  <NPopover :show="appOpen" trigger="click" placement="bottom-end" :show-arrow="false" raw @update:show="toggleApps">
    <template #trigger>
      <NButton ref="appTrigger" class="ls-app-switcher" quaternary aria-label="切换应用" :aria-expanded="appOpen" :aria-controls="panelId"><template #icon><LayoutGrid :size="18" /></template>应用<ChevronDown :size="14" aria-hidden="true" /></NButton>
    </template>
    <nav :id="panelId" ref="appPanel" class="ls-workspace-apps" aria-label="切换应用" @keydown.esc.stop.prevent="closeApps">
      <p>切换应用</p>
      <div class="ls-workspace-apps__grid">
        <NButton v-for="action in actions" :key="action.key" quaternary :aria-disabled="action.disabled || undefined" :aria-current="action.key === currentApp ? 'true' : undefined" @click="action.disabled ? feedback.info(action.reason || `${action.label}暂不可用`) : selectApp(action.key)">
          <component :is="appIcons[action.key as keyof typeof appIcons] || LayoutGrid" :size="20" aria-hidden="true" />
          <span>{{ action.label }}</span><Check v-if="action.key === currentApp" :size="16" aria-label="当前应用" />
        </NButton>
      </div>
    </nav>
  </NPopover>
</template>

<style scoped>
.ls-app-switcher{color:var(--text);background:var(--surface);border:1px solid var(--border)}
.ls-workspace-apps{box-sizing:border-box;width:min(18rem,calc(100vw - 2rem));padding:.75rem;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);font-family:var(--font-ui)}
.ls-workspace-apps p{margin:0 0 .5rem;color:var(--text-secondary);font-size:.8125rem}
.ls-workspace-apps__grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.375rem}
.ls-workspace-apps__grid :deep(.n-button){height:auto;min-height:48px;padding:.625rem;justify-content:flex-start;white-space:normal}
.ls-workspace-apps__grid :deep(.n-button__content){min-width:0;gap:.5rem;white-space:normal;text-align:left}
.ls-workspace-apps__grid :deep(svg){flex:none}
.ls-workspace-apps__grid :deep([aria-current=true]){color:var(--primary);background:var(--cloud);font-weight:700}
.ls-workspace-apps__grid :deep([aria-disabled=true]){opacity:.5}
.ls-workspace-apps__grid :deep(button:focus-visible){outline:2px solid var(--primary);outline-offset:1px}
</style>
