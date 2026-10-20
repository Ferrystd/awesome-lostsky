<script setup lang="ts">
import LsOverviewLinks from '@lostsky/ui/components/LsOverviewLinks.vue'
import LsOverviewPage from '@lostsky/ui/components/LsOverviewPage.vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import LsMetricGrid from '@lostsky/ui/components/LsMetricGrid.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsSectionHeader from '@lostsky/ui/components/LsSectionHeader.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import { teamNavigation } from '../lib/workspaceNavigation'
import { api, friendlyError } from '@lostsky/api/client'
import { useQuery } from '@tanstack/vue-query'
import { Bell, BookOpen, Boxes, UserRound, Users } from '@lucide/vue'
import { computed } from 'vue'
import TeamShareLinks from '../components/TeamShareLinks.vue'

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
    label: '已发送通知',
    icon: Bell,
    to: '/notices/sent',
    metric: query.data.value?.notices,
  },
])
const metricItems = computed(() => stats.value.map(item => ({ key: item.key, label: item.label, value: !query.isPending.value && !query.isError.value && item.metric?.available && item.metric.count != null ? item.metric.count : '-', hint: item.metric?.error || '当前可见范围' })))
const resourceGroups = teamNavigation.map(group => ({ ...group, entries: group.links.map(link => ({ key: link.to, label: link.label, description: link.note, to: link.to, icon: link.icon })) }))
</script>


<template>
  <LsOverviewPage title="团队工作台" description="管理团队资源，处理成员与人事事务。">
    <template #actions>
      <LsPageLink to="/personal" :icon="UserRound" label="进入个人工作台" />
      <LsPageLink href="//doc.lostsky.work" target="_blank" rel="noopener" :icon="BookOpen" label="使用文档" />

    </template>
    <LsPanel>
      <template #header><LsSectionHeader title="处理团队事务" description="管理团队资源，继续人事与协作工作。" /></template>
      <div class="team-resource-map">
        <section v-for="group in resourceGroups" :key="group.key" class="team-resource-group">
          <LsSectionHeader :title="group.title" :description="group.description" :heading-level="3" />
          <LsOverviewLinks :label="group.title" :entries="group.entries" />
        </section>
      </div>
    </LsPanel>
    <LsPanel>
      <template #header><LsSectionHeader title="团队资源摘要" description="当前可见范围内的人员、成员、文档与通知。" /></template>
      <LsMetricGrid :items="metricItems" aria-label="团队资源摘要" />
      <LsAsyncState v-if="query.isPending.value" state="loading" :rows="2" />
      <LsInlineError v-else-if="query.isError.value" :message="friendlyError(query.error.value)" />
    </LsPanel>
    <TeamShareLinks />
  </LsOverviewPage>
</template>
<style scoped>
.team-resource-map { min-width: 0; display: grid; gap: 2rem; }
.team-resource-group { min-width: 0; display: grid; gap: .75rem; }
</style>
