<script setup lang="ts">
import { NConfigProvider } from 'naive-ui'
import { workspaceSceneProviderProps } from '@lostsky/ui/workspace-scene-theme'
import LsWorkspaceScene from '@lostsky/ui/components/LsWorkspaceScene.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import { ArrowLeft } from '@lucide/vue'
defineOptions({ inheritAttrs: false })
defineProps<{ title?: string; intro?: string }>()
</script>
<template>
  <NConfigProvider v-bind="workspaceSceneProviderProps(true)">
    <LsWorkspaceScene>
      <main class="account-flow">
        <nav class="account-flow__navigation" aria-label="通行证导航"><LsPageLink href="//www.lostsky.work" :icon="ArrowLeft" label="LostSky 官网" /></nav>
        <div class="account-flow__body">
          <LsPageHeader v-if="title" :title="title" :description="intro" />
          <LsPanel><div class="account-flow__content"><slot /></div></LsPanel>
        </div>
      </main>
    </LsWorkspaceScene>
  </NConfigProvider>
</template>
<style scoped>
.account-flow { min-height: 100dvh; padding: 1.5rem 1rem 3rem; color: var(--ink); }
.account-flow__navigation { display:flex; align-items:center; justify-content:space-between; gap:1rem; max-width:64rem; margin-inline:auto; }
.account-flow__body { width:100%; max-width:42rem; margin:clamp(1.5rem,6vh,4rem) auto 0; display:grid; gap:1.5rem; min-width:0; overflow-wrap:anywhere; }
.account-flow__content { display:grid; gap:1.25rem; min-width:0; }
</style>
