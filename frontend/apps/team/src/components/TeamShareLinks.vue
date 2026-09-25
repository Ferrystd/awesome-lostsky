<script setup lang="ts">
import { computed } from 'vue'
import { NA, NAlert, NFlex } from 'naive-ui'
import { Copy } from '@lucide/vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import { feedback } from '@lostsky/ui/feedback'
import { useTeamAccess } from '../lib/teamAccess'

const access = useTeamAccess()
const links = computed(() => {
  const slug = access.data.value?.team?.slug
  if (!slug) return []
  return [
    { label: '商城页面', url: `https://${slug}.shop.lostsky.work/` },
    { label: '展示页面', url: `https://${slug}.display.lostsky.work/` },
    { label: '入职表单', url: `https://${slug}.team.lostsky.work/join` },
  ]
})

async function copyLink(label: string, url: string) {
  try {
    await navigator.clipboard.writeText(url)
    feedback.success(`${label}链接已复制`)
  } catch {
    feedback.error('复制失败，请通过链接菜单复制地址')
  }
}
</script>

<template>
  <NAlert v-if="links.length" title="团队链接" type="info">
    <NFlex :size="[24, 8]" align="center" aria-label="本团队分享链接">
      <NFlex v-for="link in links" :key="link.label" align="center" :size="8">
        <NA class="team-share-link" :href="link.url" target="_blank" rel="noopener noreferrer">{{ link.label }}</NA>
        <LsButton variant="ghost" :aria-label="`复制${link.label}链接`" @click="copyLink(link.label, link.url)">
          <template #icon><Copy :size="16" aria-hidden="true" /></template>
          复制
        </LsButton>
      </NFlex>
    </NFlex>
  </NAlert>
</template>

<style scoped>
.team-share-link { min-height: 44px; display: inline-flex; align-items: center; }
</style>
