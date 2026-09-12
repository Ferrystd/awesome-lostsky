<script setup lang="ts">
import LsWorkspaceOverview from '@lostsky/ui/components/LsWorkspaceOverview.vue'
import LsMetricGrid from '@lostsky/ui/components/LsMetricGrid.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsSectionHeader from '@lostsky/ui/components/LsSectionHeader.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import { teamNavigation } from '../lib/workspaceNavigation'
import { api, friendlyError } from '@lostsky/api/client'
import { useQuery } from '@tanstack/vue-query'
import { ArrowRight, Bell, BookOpen, Boxes, UserRound, Users } from '@lucide/vue'
import { computed } from 'vue'

type MetricReason = { kind: 'ability'; key: string; label: string } | null
type DashboardMetric = {
  available: boolean
  count: number | null
  error: string | null
  reason: MetricReason
}
type DashboardSummary = {
  entities: DashboardMetric
  members: DashboardMetric
  documents: DashboardMetric
  notices: DashboardMetric
}

const query = useQuery({
  queryKey: ['team-dashboard'],
  queryFn: () => api.get<DashboardSummary>('/dashboard'),
})

const stats = computed(() => [
  {
    key: 'entities',
    label: '人员',
    icon: Boxes,
    to: '/entities',
    metric: query.data.value?.entities,
  },
  {
    key: 'members',
    label: '成员',
    icon: Users,
    to: '/members',
    metric: query.data.value?.members,
  },
  {
    key: 'documents',
    label: '文档',
    icon: BookOpen,
    to: '/docs',
    metric: query.data.value?.documents,
  },
  {
    key: 'notices',
    label: '通知',
    icon: Bell,
    to: '/notices/entity',
    metric: query.data.value?.notices,
  },
])
const metricItems = computed(() => stats.value.map(item => ({ key: item.key, label: item.label, value: !query.isPending.value && !query.isError.value && item.metric?.available && item.metric.count != null ? item.metric.count : '-', hint: item.metric?.error || '当前可见范围' })))
const resourceGroups = teamNavigation
</script>


<template>
  <LsWorkspaceOverview eyebrow="团队运行概览" title="团队工作台" description="管理团队资源，处理成员与人事事务。" :actions="[{ key: 'personal', label: '进入个人工作台', to: '/personal', icon: UserRound, primary: true }, { key: 'manual', label: '使用文档', href: '//doc.lostsky.work', target: '_blank', rel: 'noopener', icon: BookOpen }]" :entries="[]">
    <template #summary>
      <LsMetricGrid :items="metricItems" aria-label="团队资源摘要" />
      <LsAsyncState v-if="query.isPending.value" state="loading" :rows="2" />
      <LsInlineError v-else-if="query.isError.value" :message="friendlyError(query.error.value)" />
    </template>
    <template #workspace>
      <div class="team-resource-map">
        <LsPanel v-for="group in resourceGroups" :key="group.key">
          <template #header><LsSectionHeader :title="group.title" :description="group.description"><template #aside><component :is="group.icon" :size="24" aria-hidden="true" /></template></LsSectionHeader></template>
          <nav class="team-resource-links" :aria-label="group.title">
            <RouterLink v-for="link in group.links" :key="link.to" :to="link.to"><span><strong>{{ link.label }}</strong><small>{{ link.note }}</small></span><ArrowRight :size="18" aria-hidden="true" /></RouterLink>
          </nav>
        </LsPanel>
      </div>
    </template>
  </LsWorkspaceOverview>
</template>
<style scoped>
.team-resource-map { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
.team-resource-links { display: grid; }
.team-resource-links a { display: flex; align-items: center; justify-content: space-between; gap: 1rem; min-height: 68px; padding: .75rem .25rem; border-bottom: 1px solid var(--line); color: var(--ink); }
.team-resource-links a:last-child { border-bottom: 0; }
.team-resource-links strong,.team-resource-links small { display: block; }
.team-resource-links small { margin-top: .3rem; color: var(--muted-ink); font-size: .8rem; }
.team-resource-links svg { flex-shrink: 0; color: var(--sky-lost-strong); }
.team-resource-links a:hover { background: var(--cloud); }
.team-resource-links a:focus-visible { outline: 2px solid var(--sky-lost-strong); outline-offset: 2px; }
@media (max-width: 799px) { .team-resource-map { grid-template-columns: minmax(0, 1fr); } }
</style>
