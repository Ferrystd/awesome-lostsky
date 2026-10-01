<script setup lang="ts">
import { computed } from 'vue'
import { ArrowUpRight, Copy } from '@lucide/vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import { feedback } from '@lostsky/ui/feedback'
import { useTeamAccess } from '../lib/teamAccess'

const access = useTeamAccess()
const links = computed(() => {
  const slug = access.data.value?.team?.slug
  if (!slug) return []
  return [
    { label: '商城页面', description: '浏览团队商品', url: `https://${slug}.shop.lostsky.work/` },
    { label: '展示页面', description: '了解团队与成员', url: `https://${slug}.display.lostsky.work/` },
    { label: '入职表单', description: '提交加入申请', url: `https://${slug}.team.lostsky.work/join` },
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
  <LsPanel v-if="links.length" aria-label="本团队分享链接">
    <div class="team-share-heading">
      <h2>团队链接</h2>
      <span>打开页面，或复制分享</span>
    </div>
    <ul class="team-share-list">
      <li v-for="link in links" :key="link.label" class="team-share-item">
        <a class="team-share-link" :href="link.url" target="_blank" rel="noopener noreferrer">
          <span class="team-share-name">{{ link.label }}<ArrowUpRight :size="16" aria-hidden="true" /></span>
          <span class="team-share-description">{{ link.description }}</span>
        </a>
        <LsButton variant="ghost" :aria-label="`复制${link.label}链接`" @click="copyLink(link.label, link.url)">
          <template #icon><Copy :size="16" aria-hidden="true" /></template>
          复制
        </LsButton>
      </li>
    </ul>
  </LsPanel>
</template>

<style scoped>
.team-share-heading { display: flex; align-items: baseline; flex-wrap: wrap; gap: .25rem 1rem; margin-bottom: 1rem; }
.team-share-heading h2 { margin: 0; font-size: 1rem; font-weight: 650; }
.team-share-heading > span { color: var(--text-secondary); font-size: .8125rem; }
.team-share-list { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); margin: 0; padding: 0; list-style: none; }
.team-share-item { min-width: 0; display: flex; align-items: center; justify-content: space-between; gap: .75rem; padding-inline: 1.25rem; }
.team-share-item:first-child { padding-left: 0; }
.team-share-item:last-child { padding-right: 0; }
.team-share-item + .team-share-item { border-left: 1px solid var(--border); }
.team-share-link { min-width: 0; min-height: var(--touch-target); display: flex; flex-direction: column; justify-content: center; gap: .25rem; border-radius: .25rem; }
.team-share-name { display: flex; align-items: center; gap: .375rem; color: var(--text); font-size: .9375rem; font-weight: 650; transition: color var(--motion-fast) var(--ease-standard); }
.team-share-name svg { flex-shrink: 0; color: var(--text-secondary); }
.team-share-description { color: var(--text-secondary); font-size: .8125rem; }
.team-share-link:hover .team-share-name { color: var(--primary); }
@media (max-width: 799px) {
  .team-share-list { grid-template-columns: minmax(0, 1fr); }
  .team-share-item, .team-share-item:first-child, .team-share-item:last-child { padding: .875rem 0; }
  .team-share-item:first-child { padding-top: 0; }
  .team-share-item:last-child { padding-bottom: 0; }
  .team-share-item + .team-share-item { border-left: 0; border-top: 1px solid var(--border); }
}
@media (prefers-reduced-motion: reduce) {
  .team-share-name { transition: none; }
}
</style>
