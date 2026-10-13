<script setup lang="ts">
import LsWorkspaceScene from '@lostsky/ui/components/LsWorkspaceScene.vue'
import { workspaceSceneProviderProps } from '@lostsky/ui/workspace-scene-theme'
import { lostskyNaiveTheme } from '@lostsky/ui/naive-theme'
import LsPage from '@lostsky/ui/components/LsPage.vue'
import LsRouteErrorBoundary from '@lostsky/ui/components/LsRouteErrorBoundary.vue'
import { setLucideProps } from '@lucide/vue'
import { NConfigProvider, NDialogProvider, NMessageProvider, zhCN } from 'naive-ui'
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import TransactionShell from './components/TransactionShell.vue'

setLucideProps({ strokeWidth: 1.8 })
const route = useRoute()
const auroraScene = computed(() => route.meta.workspaceScene === true)
const width = computed<'wide' | 'content' | 'form'>(() => ['content', 'form'].includes(String(route.meta.pageWidth)) ? route.meta.pageWidth as 'content' | 'form' : 'wide')
</script>

<template>
  <NConfigProvider :theme-overrides="lostskyNaiveTheme" :locale="zhCN" v-bind="workspaceSceneProviderProps(auroraScene)">
    <NDialogProvider><NMessageProvider>
      <TransactionShell :scene="auroraScene">
        <LsPage id="workspace" as="main" :width="width">
          <LsWorkspaceScene v-if="auroraScene"><RouterView v-slot="{ Component }"><LsRouteErrorBoundary :reset-key="route.fullPath"><component :is="Component" /></LsRouteErrorBoundary></RouterView></LsWorkspaceScene><RouterView v-else v-slot="{ Component }"><LsRouteErrorBoundary :reset-key="route.fullPath"><component :is="Component" /></LsRouteErrorBoundary></RouterView>
        </LsPage>
      </TransactionShell>
    </NMessageProvider></NDialogProvider>
  </NConfigProvider>
</template>
