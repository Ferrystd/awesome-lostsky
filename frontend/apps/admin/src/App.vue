<script setup lang="ts">
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
  <NConfigProvider :theme-overrides="lostskyNaiveTheme" :locale="zhCN">
    <NDialogProvider><NMessageProvider>
      <AdminShell>
        <LsPage id="admin-main" as="main" :width="width">
          <RouterView />
        </LsPage>
      </AdminShell>
    </NMessageProvider></NDialogProvider>
  </NConfigProvider>
</template>
