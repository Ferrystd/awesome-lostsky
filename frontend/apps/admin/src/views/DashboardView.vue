<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsWorkspaceOverview from '@lostsky/ui/components/LsWorkspaceOverview.vue'
import LsMetricGrid from '@lostsky/ui/components/LsMetricGrid.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsSectionHeader from '@lostsky/ui/components/LsSectionHeader.vue'
import LsStatusTag from '@lostsky/ui/components/LsStatusTag.vue'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useQuery } from '@tanstack/vue-query'
import { ArrowRight, Search, ShieldAlert, Users, Building2 } from '@lucide/vue'
import { NButton, NDataTable } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { computed, h } from 'vue'
import { RouterLink } from 'vue-router'
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
  { title: '用户', key: 'user', render: user => h('div', { class: 'cell-primary' }, [h(RouterLink, { to: `/users/${user.id}` }, { default: () => user.nickname || user.username }), h('small', `#${user.id}`)]) },
  { title: '联系方式', key: 'contact', render: user => user.phone_masked || user.email_masked || '—' },
  { title: '状态', key: 'status', render: user => h(LsStatusTag, { label: adminStatusLabel(user.is_banned ? 'banned' : 'active'), type: adminStatusType(user.is_banned ? 'banned' : 'active') }) },
  { title: '注册时间', key: 'create_time', render: user => formatTime(user.create_time) },
]
function openSearch() { window.dispatchEvent(new CustomEvent('admin:open-search')) }
</script>

<template>
  <LsWorkspaceOverview eyebrow="平台治理工作台" title="平台总览" description="用户、团队与管理事件汇聚于此，先定位资源，再追踪治理结果。" :entries="[]" :actions="[{ key: 'users', label: '查看用户', to: '/users', icon: Users, primary: true }, { key: 'teams', label: '查看团队', to: '/teams', icon: Building2 }]">
  <template #summary>
    <LsMetricGrid aria-label="平台关键数据" :items="[
      { key: 'users', label: '用户总数', value: value('users'), hint: value('new_users_7d') === '-' ? '-' : '近 7 日新增 ' + value('new_users_7d') },
      { key: 'teams', label: '团队总数', value: value('teams'), hint: value('new_teams_7d') === '-' ? '-' : '近 7 日新增 ' + value('new_teams_7d') },
      { key: 'sessions', label: '活跃会话', value: value('active_sessions'), hint: '当前设备授权' },
      { key: 'administrators', label: '平台管理员', value: value('administrators'), hint: '平台治理成员' },
      { key: 'banned-users', label: '已封禁用户', value: value('banned_users'), hint: '当前封禁状态' },
      { key: 'banned-teams', label: '已封禁团队', value: value('banned_teams'), hint: '当前封禁状态' },
    ]" />
  </template>
  <template #workspace>
  <NButton autofocus block class="dashboard-search" @click="openSearch"><Search :size="19" /><span><strong>搜索平台资源</strong><small>用户、手机号、邮箱、团队或资源 ID</small></span><kbd>Ctrl K</kbd></NButton>
  <LsAsyncState v-if="!routeAccess.restricted.value && query.isPending.value" state="loading" :rows="6" />
  <LsAsyncState v-else-if="!routeAccess.restricted.value && query.isError.value" state="error" title="暂时无法读取平台总览" :description="friendlyError(query.error.value)" />
  <template v-else>
    <section class="dashboard-grid">
      <div class="dashboard-primary">
        <LsPanel><template #header><LsSectionHeader title="最近注册用户" description="快速进入用户详情与治理操作"><template #aside><RouterLink class="section-link" to="/users">查看全部 <ArrowRight :size="16" /></RouterLink></template></LsSectionHeader></template><LsEmptyState :access-reason="routeAccess.reason.value" :source="query.data.value" v-if="!dashboard.recent_users.length" title="暂无可显示用户" description="新注册用户会显示在这里。" /><NDataTable v-else :columns="userColumns" :data="dashboard.recent_users" :row-key="row => row.id" :scroll-x="680" /></LsPanel>
        <LsPanel><template #header><LsSectionHeader title="近期团队" description="关注新团队与治理状态"><template #aside><RouterLink class="section-link" to="/teams">查看全部 <ArrowRight :size="16" /></RouterLink></template></LsSectionHeader></template><LsEmptyState :access-reason="routeAccess.reason.value" :source="query.data.value" v-if="!dashboard.recent_teams.length" title="暂无可显示团队" description="新创建团队会显示在这里。" /><div v-else class="simple-dashboard-list"><RouterLink v-for="team in dashboard.recent_teams" :key="team.id" :to="`/teams/${team.id}`"><span><strong>{{ team.name || team.slug }}</strong><small>#{{ team.id }} · {{ team.slug }}</small></span><LsStatusTag :label="adminStatusLabel(teamStatus(team))" :type="adminStatusType(teamStatus(team))" /></RouterLink></div></LsPanel>
      </div>
      <aside class="dashboard-side">
        <LsPanel><template #header><LsSectionHeader title="需要关注" description="当前平台治理状态"><template #aside><ShieldAlert :size="19" /></template></LsSectionHeader></template><div v-if="routeAccess.restricted.value" class="attention-list"><span>已封禁用户</span><strong>-</strong><span>已封禁团队</span><strong>-</strong></div><p v-else-if="!attention" class="attention-clear">当前没有封禁状态需要复核。</p><div v-else class="attention-list"><RouterLink to="/users?status=banned"><span>已封禁用户</span><strong>{{ dashboard.counts.banned_users }}</strong></RouterLink><RouterLink to="/teams?status=banned"><span>已封禁团队</span><strong>{{ dashboard.counts.banned_teams }}</strong></RouterLink></div></LsPanel>
        <LsPanel><template #header><LsSectionHeader title="最近管理操作" description="平台与业务审计事件" /></template><LsEmptyState :access-reason="routeAccess.reason.value" :source="query.data.value" v-if="!dashboard.recent_audit_events.length" title="暂无可显示审计记录" description="平台治理操作会显示在这里。" /><div v-else class="audit-feed"><div v-for="event in dashboard.recent_audit_events" :key="event.id"><strong>{{ event.action }}</strong><span>{{ event.actor_username || 'CLI / 系统' }} · {{ formatTime(event.create_time) }}</span></div></div></LsPanel>
      </aside>
    </section>
  </template>
  </template>
  </LsWorkspaceOverview>
</template>

<style scoped>.dashboard-search{min-height:64px;height:auto;white-space:normal;justify-content:stretch;padding:10px 16px;color:var(--muted-ink);text-align:left}.dashboard-search :deep(.n-button__content){width:100%;display:grid;grid-template-columns:24px minmax(0,1fr) auto;align-items:center;gap:12px}.dashboard-search strong,.dashboard-search small{display:block}.dashboard-search strong{color:var(--ink)}.dashboard-search small{margin-top:2px}.dashboard-primary,.dashboard-side{display:grid;align-content:start;gap:16px}.section-link{min-height:44px;display:inline-flex;align-items:center;gap:5px;color:var(--sky-lost-strong);font-weight:650}.simple-dashboard-list,.attention-list,.audit-feed{display:grid}.simple-dashboard-list a,.attention-list a{min-height:58px;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid var(--line)}.simple-dashboard-list a:last-child,.attention-list a:last-child,.audit-feed>div:last-child{border-bottom:0}.simple-dashboard-list strong,.simple-dashboard-list small{display:block}.simple-dashboard-list small,.audit-feed span{color:var(--muted-ink);font-size:.76rem}.attention-list strong{color:var(--danger);font-variant-numeric:tabular-nums}.attention-clear{margin:0;color:var(--success)}.audit-feed>div{display:grid;gap:3px;padding:13px 0;border-bottom:1px solid var(--line)}.dashboard-search span{min-width:0;overflow-wrap:anywhere}@media(max-width:479px){.dashboard-search kbd{display:none}.dashboard-search :deep(.n-button__content){grid-template-columns:24px minmax(0,1fr)}}
</style>
