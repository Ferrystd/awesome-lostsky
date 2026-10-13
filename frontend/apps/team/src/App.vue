<script setup lang="ts">
import { lostskyNaiveTheme } from '@lostsky/ui/naive-theme'
import { setLucideProps } from '@lucide/vue'
import { NConfigProvider, NDialogProvider, NMessageProvider, zhCN } from 'naive-ui'
import { RouterView, useRoute } from 'vue-router'
import TeamScene from '@lostsky/ui/components/LsWorkspaceScene.vue'
import { workspaceSceneProviderProps } from '@lostsky/ui/workspace-scene-theme'
import TeamShell from './components/TeamShell.vue'
import AdminPage from './components/AdminPage.vue'
import { computed } from 'vue'
setLucideProps({ strokeWidth: 1.8 })
const route = useRoute()
const auroraScene = computed(() => route.matched.some(record => ['/settings', '/notices/team', '/notices/sent'].includes(record.path)))
const pageWidth = computed<'wide' | 'content' | 'form'>(() => ['content', 'form'].includes(String(route.meta.pageWidth)) ? route.meta.pageWidth as 'content' | 'form' : 'wide')
</script>
<template>
  <NConfigProvider :theme-overrides="lostskyNaiveTheme" v-bind="workspaceSceneProviderProps(auroraScene)" :locale="zhCN">
    <NDialogProvider><NMessageProvider>
      <TeamShell v-if="!route.meta.public" :contextual-header="auroraScene"><AdminPage :width="pageWidth"><TeamScene v-if="auroraScene"><RouterView /></TeamScene><RouterView v-else /></AdminPage></TeamShell>
      <RouterView v-else />
    </NMessageProvider></NDialogProvider>
  </NConfigProvider>
</template>
