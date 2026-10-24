<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsOverviewPage from '@lostsky/ui/components/LsOverviewPage.vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import LsMetricGrid from '@lostsky/ui/components/LsMetricGrid.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsSectionHeader from '@lostsky/ui/components/LsSectionHeader.vue'
import LsStatusTag from '@lostsky/ui/components/LsStatusTag.vue'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useQuery } from '@tanstack/vue-query'
import { Search, ShieldAlert, Users, UserRound, Building2 } from '@lucide/vue'
import { NButton, NDataTable } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { computed, h } from 'vue'
import { adminStatusLabel, adminStatusType, type AdminStatus } from '../status'
import type { AuditEvent, TeamSummary, UserSummary } from '../types'
import { formatTime } from '../utils'

interface Dashboard { counts: Record<string, number>; recent_users: UserSummary[]; recent_teams: TeamSummary[]; recent_audit_events: AuditEvent[] }
const routeAccess = useRouteAccess()
const query = useQuery({ queryKey: ['admin-dashboard'], queryFn: () => routeAccess.read(() => api.get<Dashboard>('/dashboard')), enabled: computed(() => !routeAccess.restricted.value) })
const dashboard = computed<Dashboard>(() => query.data.value ?? { counts: {}, recent_users: [], recent_teams: [], recent_audit_events: [] })
const attention = computed(() => Number(query.data.value?.counts.banned_users ?? 0) + Number(query.data.value?.counts.banned_teams ?? 0))
const value = (key: string) => routeAccess.restricted.value || query.isPending.value || query.isError.value ? '-' : dashboard.value.counts[key] ?? '-'
const teamStatus = (team: TeamSummary): AdminStatus => team.is_cancelled ? 'cancelled' : team.is_banned ? 'banned' : 'active'
const userColumns: DataTableColumns<UserSummary> = [
  { title: '用户', key: 'user', render: user => h('div', { class: 'cell-primary' }, [h(LsPageLink, { to: `/users/${user.id}`, icon: UserRound, label: user.nickname || user.username }), h('small', `#${user.id}`)]) },
  { title: '联系方式', key: 'contact', render: user => user.phone_masked || user.email_masked || '—' },
  { title: '状态', key: 'status', render: user => h(LsStatusTag, { label: adminStatusLabel(user.is_banned ? 'banned' : 'active'), type: adminStatusType(user.is_banned ? 'banned' : 'active') }) },
  { title: '注册时间', key: 'create_time', render: user => formatTime(user.create_time) },
]
function openSearch() { window.dispatchEvent(new CustomEvent('admin:open-search')) }
</script>

<template>
  <LsOverviewPage title="平台总览" description="用户、团队与管理事件汇聚于此，先定位资源，再追踪治理结果。">
  <template #actions>
    <LsPageLink to="/users" :icon="Users" label="查看用户" />
    <LsPageLink to="/teams" :icon="Building2" label="查看团队" />

  </template>

  <NButton autofocus block class="dashboard-search" @click="openSearch"><Search :size="19" /><span><strong>搜索平台资源</strong><small>用户、手机号、邮箱、团队或资源 ID</small></span><kbd>Ctrl K</kbd></NButton>
  <LsAsyncState v-if="!routeAccess.restricted.value && query.isPending.value" state="loading" :rows="6" />
  <LsAsyncState v-else-if="!routeAccess.restricted.value && query.isError.value" state="error" title="暂时无法读取平台总览" :description="friendlyError(query.error.value)" />
  <template v-else>
    <section class="dashboard-grid">
      <div class="dashboard-primary">
        <LsPanel>
          <template #header><LsSectionHeader title="最近注册用户" description="快速进入用户详情与治理操作"><template #aside><LsPageLink to="/users" :icon="Users" label="查看全部" /></template></LsSectionHeader></template>
          <LsEmptyState :access-reason="routeAccess.reason.value" :source="query.data.value" v-if="!dashboard.recent_users.length" title="暂无可显示用户" description="新注册用户会显示在这里。" />
          <NDataTable v-else :columns="userColumns" :data="dashboard.recent_users" :row-key="row => row.id" :scroll-x="680" />
        </LsPanel>
        <LsPanel>
          <template #header><LsSectionHeader title="近期团队" description="关注新团队与治理状态"><template #aside><LsPageLink to="/teams" :icon="Building2" label="查看全部" /></template></LsSectionHeader></template>
          <LsEmptyState :access-reason="routeAccess.reason.value" :source="query.data.value" v-if="!dashboard.recent_teams.length" title="暂无可显示团队" description="新创建团队会显示在这里。" />
          <ul v-else class="simple-dashboard-list">
            <li v-for="team in dashboard.recent_teams" :key="team.id">
              <div class="dashboard-team-copy"><LsPageLink :to="`/teams/${team.id}`" :icon="Building2" :label="team.name || team.slug" /><small>#{{ team.id }} · {{ team.slug }}</small></div>
              <LsStatusTag :label="adminStatusLabel(teamStatus(team))" :type="adminStatusType(teamStatus(team))" />
            </li>
          </ul>
        </LsPanel>
      </div>
      <aside class="dashboard-side">
        <LsPanel>
          <template #header><LsSectionHeader title="需要关注" description="当前平台治理状态"><template #aside><ShieldAlert :size="19" /></template></LsSectionHeader></template>
          <dl v-if="routeAccess.restricted.value" class="attention-values"><dt>已封禁用户</dt><dd>-</dd><dt>已封禁团队</dt><dd>-</dd></dl>
          <p v-else-if="!attention" class="attention-clear">当前没有封禁状态需要复核。</p>
          <ul v-else class="attention-list">
            <li><LsPageLink to="/users?status=banned" :icon="Users" label="已封禁用户" /><strong>{{ dashboard.counts.banned_users }}</strong></li>
            <li><LsPageLink to="/teams?status=banned" :icon="Building2" label="已封禁团队" /><strong>{{ dashboard.counts.banned_teams }}</strong></li>
          </ul>
        </LsPanel>
        <LsPanel><template #header><LsSectionHeader title="最近管理操作" description="平台与业务审计事件" /></template><LsEmptyState :access-reason="routeAccess.reason.value" :source="query.data.value" v-if="!dashboard.recent_audit_events.length" title="暂无可显示审计记录" description="平台治理操作会显示在这里。" /><div v-else class="audit-feed"><div v-for="event in dashboard.recent_audit_events" :key="event.id"><strong>{{ event.action }}</strong><span>{{ event.actor_username || 'CLI / 系统' }} · {{ formatTime(event.create_time) }}</span></div></div></LsPanel>
      </aside>
    </section>
  </template>
  <LsPanel>
    <template #header><LsSectionHeader title="平台规模与授权" description="用户、团队、会话及治理成员的当前汇总。" /></template>

    <LsMetricGrid aria-label="平台关键数据" :items="[
      { key: 'users', label: '用户总数', value: value('users'), hint: value('new_users_7d') === '-' ? '-' : '近 7 日新增 ' + value('new_users_7d') },
      { key: 'teams', label: '团队总数', value: value('teams'), hint: value('new_teams_7d') === '-' ? '-' : '近 7 日新增 ' + value('new_teams_7d') },
      { key: 'sessions', label: '活跃会话', value: value('active_sessions'), hint: '当前设备授权' },
      { key: 'administrators', label: '平台管理员', value: value('administrators'), hint: '平台治理成员' },
      { key: 'banned-users', label: '已封禁用户', value: value('banned_users'), hint: '当前封禁状态' },
      { key: 'banned-teams', label: '已封禁团队', value: value('banned_teams'), hint: '当前封禁状态' },
    ]" />
  </LsPanel>
  </LsOverviewPage>
</template>

<style scoped>
.dashboard-search { min-height: 64px; height: auto; white-space: normal; justify-content: stretch; padding: 10px 16px; color: var(--text-secondary); text-align: left; }
.dashboard-search :deep(.n-button__content) { width: 100%; display: grid; grid-template-columns: 24px minmax(0, 1fr) auto; align-items: center; gap: 12px; }
.dashboard-search strong, .dashboard-search small { display: block; }
.dashboard-search strong { color: var(--text); }
.dashboard-search small { margin-top: 2px; }
.dashboard-search span { min-width: 0; overflow-wrap: anywhere; }
.dashboard-primary, .dashboard-side { min-width: 0; display: grid; align-content: start; gap: 1rem; }
.simple-dashboard-list, .attention-list { display: grid; list-style: none; margin: 0; padding: 0; }
.simple-dashboard-list li, .attention-list li { min-width: 0; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: .5rem 1rem; padding: .5rem 0; border-bottom: 1px solid var(--border); }
.simple-dashboard-list li:last-child, .attention-list li:last-child, .audit-feed > div:last-child { border-bottom: 0; }
.dashboard-team-copy { min-width: 0; }
.dashboard-team-copy small, .audit-feed span { display: block; color: var(--text-secondary); font-size: .8125rem; overflow-wrap: anywhere; }
.attention-values { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: .75rem; margin: 0; }
.attention-values dd { margin: 0; }
.attention-list strong { color: var(--danger); font-variant-numeric: tabular-nums; }
.attention-clear { margin: 0; color: var(--success); }
.audit-feed { display: grid; }
.audit-feed > div { display: grid; gap: .25rem; padding: .75rem 0; border-bottom: 1px solid var(--border); }
@media (max-width: 479px) {
  .dashboard-search kbd { display: none; }
  .dashboard-search :deep(.n-button__content) { grid-template-columns: 24px minmax(0, 1fr); }
}
</style>
