<script setup lang="ts">
import { workspaceSceneProviderProps } from '@lostsky/ui/workspace-scene-theme'
import LsWorkspaceScene from '@lostsky/ui/components/LsWorkspaceScene.vue'

import { lostskyNaiveTheme } from '@lostsky/ui/naive-theme'
import LsPage from '@lostsky/ui/components/LsPage.vue'
import { setLucideProps } from '@lucide/vue'
import { NConfigProvider, NDialogProvider, NMessageProvider, zhCN } from 'naive-ui'
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AdminShell from './components/AdminShell.vue'

setLucideProps({ strokeWidth: 1.8 })
const route = useRoute()
const width = computed<'wide' | 'content' | 'form'>(() => ['content', 'form'].includes(String(route.meta.width)) ? route.meta.width as 'content' | 'form' : 'wide')
</script>

<template>
  <NConfigProvider :theme-overrides="lostskyNaiveTheme" :locale="zhCN" v-bind="workspaceSceneProviderProps(true)">
    <NDialogProvider><NMessageProvider>
      <AdminShell scene>
        <LsPage id="admin-main" as="main" :width="width">
          <LsWorkspaceScene><RouterView /></LsWorkspaceScene>
        </LsPage>
      </AdminShell>
    </NMessageProvider></NDialogProvider>
  </NConfigProvider>
</template>
