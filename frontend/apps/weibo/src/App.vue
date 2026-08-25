<script setup lang="ts">
import { lostskyNaiveTheme } from '@lostsky/ui/naive-theme'
import LsPage from '@lostsky/ui/components/LsPage.vue'
import LsRouteErrorBoundary from '@lostsky/ui/components/LsRouteErrorBoundary.vue'
import { setLucideProps } from '@lucide/vue'
import { NConfigProvider, NDialogProvider, NMessageProvider, zhCN } from 'naive-ui'
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import WeiboShell from './components/WeiboShell.vue'

setLucideProps({ strokeWidth: 1.8 })
const route = useRoute()
const width = computed<'wide' | 'content' | 'form'>(() => ['content', 'form'].includes(String(route.meta.pageWidth)) ? route.meta.pageWidth as 'content' | 'form' : 'wide')
</script>
<template><NConfigProvider :theme-overrides="lostskyNaiveTheme" :locale="zhCN"><NDialogProvider><NMessageProvider><WeiboShell><LsPage id="workspace" as="main" :width="width"><RouterView v-slot="{ Component }"><LsRouteErrorBoundary :reset-key="route.fullPath"><component :is="Component" /></LsRouteErrorBoundary></RouterView></LsPage></WeiboShell></NMessageProvider></NDialogProvider></NConfigProvider></template>
