<script setup lang="ts">
import { Check, House, LayoutGrid, MessageCircleMore, Radio, ReceiptText, Store, X } from '@lucide/vue'
import { NButton, NDrawer } from 'naive-ui'
import { ref, useId } from 'vue'
import { feedback } from '../feedback'

defineProps<{ actions: { key: string; label: string; disabled?: boolean; reason?: string }[]; currentApp: string }>()
const emit = defineEmits<{ select: [key: string] }>()
const panelId = useId()
const appIcons = { display: House, team: House, shop: Store, transaction: ReceiptText, chat: MessageCircleMore, community: Globe, weibo: Radio }
const appOpen = ref(false)
const appPanel = ref<HTMLElement | null>(null)
const appTrigger = ref<InstanceType<typeof NButton> | null>(null)
function focusCurrentApp() {
  const target = appPanel.value?.querySelector<HTMLButtonElement>('button[aria-current="true"]') ?? appPanel.value?.querySelector<HTMLButtonElement>('button')
  target?.focus()
}
function restoreFocus() {
  appTrigger.value?.$el.focus()
}
function selectApp(key: string) {
  appOpen.value = false
  emit('select', key)
}
</script>

<template>
  <NButton ref="appTrigger" class="ls-app-switcher" quaternary aria-label="切换应用" aria-haspopup="dialog" :aria-expanded="appOpen" :aria-controls="panelId" @click="appOpen = true">
    <template #icon><LayoutGrid :size="20" aria-hidden="true" /></template>
  </NButton>
  <NDrawer v-model:show="appOpen" placement="bottom" height="auto" class="ls-app-switcher-drawer" :aria-labelledby="`${panelId}-title`" @after-enter="focusCurrentApp" @after-leave="restoreFocus">
    <section :id="panelId" class="ls-workspace-apps">
      <header class="ls-workspace-apps__header">
        <h2 :id="`${panelId}-title`">切换应用</h2>
        <NButton class="ls-workspace-apps__close" quaternary aria-label="关闭应用切换" @click="appOpen = false"><template #icon><X :size="20" aria-hidden="true" /></template></NButton>
      </header>
      <nav ref="appPanel" class="ls-workspace-apps__grid" aria-label="应用">
        <NButton v-for="action in actions" :key="action.key" class="ls-workspace-apps__item" quaternary :aria-disabled="action.disabled || undefined" :aria-current="action.key === currentApp ? 'true' : undefined" @click="action.disabled ? feedback.info(action.reason || `${action.label}暂不可用`) : selectApp(action.key)">
          <span class="ls-workspace-apps__tile">
            <span class="ls-workspace-apps__icon"><component :is="appIcons[action.key as keyof typeof appIcons] || LayoutGrid" :size="24" aria-hidden="true" /><Check v-if="action.key === currentApp" class="ls-workspace-apps__check" :size="14" aria-label="当前应用" /></span>
            <span>{{ action.label }}</span>
          </span>
        </NButton>
      </nav>
    </section>
  </NDrawer>
</template>

<style scoped>
.ls-app-switcher,.ls-workspace-apps__close{width:44px;height:44px;flex:none;padding:0;color:var(--text)}
.ls-app-switcher{background:var(--surface);border:1px solid var(--border)}
.ls-app-switcher-drawer{border-radius:var(--radius-sm) var(--radius-sm) 0 0}
.ls-workspace-apps{box-sizing:border-box;max-height:80dvh;overflow-y:auto;padding:1rem max(1rem,env(safe-area-inset-right)) max(1.5rem,env(safe-area-inset-bottom)) max(1rem,env(safe-area-inset-left));background:var(--surface);font-family:var(--font-ui)}
.ls-workspace-apps__header{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:1rem}
.ls-workspace-apps__header h2{margin:0;color:var(--text);font-size:1.125rem;line-height:1.5}
.ls-workspace-apps__grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,6rem),1fr));gap:.5rem;max-width:24rem;margin-inline:auto}
.ls-workspace-apps__item{height:auto;min-height:88px;padding:.75rem .5rem;white-space:normal}
.ls-workspace-apps__tile{display:flex;flex-direction:column;align-items:center;gap:.5rem;min-width:0;max-width:100%;font-size:.875rem;line-height:1.5;overflow-wrap:anywhere}
.ls-workspace-apps__icon{position:relative;display:flex;align-items:center;justify-content:center;width:2rem;height:2rem}
.ls-workspace-apps__check{position:absolute;top:-.25rem;right:-.5rem}
.ls-workspace-apps__item[aria-current=true]{color:var(--primary);background:var(--cloud);font-weight:700}
.ls-workspace-apps__item[aria-disabled=true]{opacity:.5}
.ls-workspace-apps__item:focus-visible{outline:2px solid var(--primary);outline-offset:1px}
</style>
