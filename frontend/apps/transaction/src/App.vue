<script setup lang="ts">
import { lostskyNaiveTheme } from '@lostsky/ui/naive-theme'
import { setLucideProps } from '@lucide/vue'
import { NConfigProvider, zhCN } from 'naive-ui'
import { computed, onMounted, onUnmounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import TransactionShell from './components/TransactionShell.vue'

setLucideProps({ strokeWidth: 1.8 })
const route = useRoute()
const width = computed(() => String(route.meta.pageWidth ?? 'wide'))
const expired = () => {
  location.href = `//account.lostsky.work/login?redirect=${encodeURIComponent(location.href)}`
}
onMounted(() => addEventListener('lostsky:auth-expired', expired))
onUnmounted(() => removeEventListener('lostsky:auth-expired', expired))
</script>

<template>
  <NConfigProvider :theme-overrides="lostskyNaiveTheme" :locale="zhCN">
    <TransactionShell>
      <main id="workspace" :class="['page', `page--${width}`]"><RouterView /></main>
    </TransactionShell>
  </NConfigProvider>
</template>
