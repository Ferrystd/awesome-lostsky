<script setup lang="ts">
import { lostskyNaiveTheme } from '@lostsky/ui/naive-theme'
import { setLucideProps } from '@lucide/vue'
import { NConfigProvider, NDialogProvider, NMessageProvider, zhCN } from 'naive-ui'
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AdminShell from './components/AdminShell.vue'

setLucideProps({ strokeWidth: 1.8 })
const route = useRoute()
const width = computed(() => String(route.meta.width ?? 'wide'))
</script>

<template>
  <NConfigProvider :theme-overrides="lostskyNaiveTheme" :locale="zhCN">
    <NDialogProvider><NMessageProvider>
      <AdminShell>
        <main id="admin-main" :class="['admin-page', `admin-page--${width}`]"><RouterView /></main>
      </AdminShell>
    </NMessageProvider></NDialogProvider>
  </NConfigProvider>
</template>
