<script setup lang="ts">
import { lostskyNaiveTheme } from '@lostsky/ui/naive-theme'
import { setLucideProps } from '@lucide/vue'
import { NConfigProvider, zhCN } from 'naive-ui'
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import TransactionShell from './components/TransactionShell.vue'

setLucideProps({ strokeWidth: 1.8 })
const route = useRoute()
const width = computed(() => String(route.meta.pageWidth ?? 'wide'))
</script>

<template>
  <NConfigProvider :theme-overrides="lostskyNaiveTheme" :locale="zhCN">
    <TransactionShell>
      <main id="workspace" :class="['page', `page--${width}`]"><RouterView /></main>
    </TransactionShell>
  </NConfigProvider>
</template>
