<script setup lang="ts">
import { lostskyAuroraTheme, lostskyNaiveTheme } from '@lostsky/ui/naive-theme'
import { setLucideProps } from '@lucide/vue'
import { darkTheme, NConfigProvider, NDialogProvider, NMessageProvider, zhCN } from 'naive-ui'
import { RouterView, useRoute } from 'vue-router'
import TeamShell from './components/TeamShell.vue'
import AdminPage from './components/AdminPage.vue'
import { computed } from 'vue'
setLucideProps({ strokeWidth: 1.8 })
const route = useRoute()
const auroraScene = computed(() => route.matched.some(record => ['/settings', '/notices/team', '/notices/sent'].includes(record.path)))
const pageWidth = computed<'wide' | 'content' | 'form'>(() => ['content', 'form'].includes(String(route.meta.pageWidth)) ? route.meta.pageWidth as 'content' | 'form' : 'wide')
</script>
<template>
  <NConfigProvider :class="{ 'ls-theme-aurora': auroraScene }" :theme="auroraScene ? darkTheme : null" :theme-overrides="auroraScene ? lostskyAuroraTheme : lostskyNaiveTheme" :locale="zhCN">
    <NDialogProvider><NMessageProvider>
      <TeamShell v-if="!route.meta.public"><AdminPage :width="pageWidth"><RouterView /></AdminPage></TeamShell>
      <RouterView v-else />
    </NMessageProvider></NDialogProvider>
  </NConfigProvider>
</template>
