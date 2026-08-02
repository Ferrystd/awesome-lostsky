<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsStatusTag from '@lostsky/ui/components/LsStatusTag.vue'
import { useQuery } from '@tanstack/vue-query'
import { ArrowRight, Search, ShieldAlert } from '@lucide/vue'
import { NButton, NDataTable } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { computed, h } from 'vue'
import { RouterLink } from 'vue-router'
import { adminStatusLabel, adminStatusType, type AdminStatus } from '../status'
import type { AuditEvent, TeamSummary, UserSummary } from '../types'
import { formatTime } from '../utils'

interface Dashboard { counts: Record<string, number>; recent_users: UserSummary[]; recent_teams: TeamSummary[]; recent_audit_events: AuditEvent[] }
const query = useQuery({ queryKey: ['admin-dashboard'], queryFn: () => api.get<Dashboard>('/dashboard') })
const attention = computed(() => Number(query.data.value?.counts.banned_users ?? 0) + Number(query.data.value?.counts.banned_teams ?? 0))
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
  <LsPageHeader title="平台总览" description="先确认平台状态，再进入具体资源处理治理任务。" />
  <NButton autofocus block class="dashboard-search" @click="openSearch"><Search :size="19" /><span><strong>搜索平台资源</strong><small>用户、手机号、邮箱、团队或资源 ID</small></span><kbd>Ctrl K</kbd></NButton>
  <LsAsyncState v-if="query.isPending.value" state="loading" :rows="6" />
  <LsAsyncState v-else-if="query.isError.value" state="error" title="暂时无法读取平台总览" :description="friendlyError(query.error.value)" />
  <template v-else-if="query.data.value">
    <section class="summary-strip" aria-label="平台关键数据"><div><span>用户总数</span><strong>{{ query.data.value.counts.users }}</strong><small>近 7 日 +{{ query.data.value.counts.new_users_7d }}</small></div><div><span>团队总数</span><strong>{{ query.data.value.counts.teams }}</strong><small>近 7 日 +{{ query.data.value.counts.new_teams_7d }}</small></div><div><span>活跃会话</span><strong>{{ query.data.value.counts.active_sessions }}</strong><small>当前设备授权</small></div><div><span>平台管理员</span><strong>{{ query.data.value.counts.administrators }}</strong><small>{{ attention }} 项封禁状态</small></div></section>
    <section class="dashboard-grid">
      <div class="dashboard-primary">
        <LsPanel><template #header><div class="panel-heading"><div><h2>最近注册用户</h2><p>快速进入用户详情与治理操作</p></div><RouterLink to="/users">查看全部 <ArrowRight :size="16" /></RouterLink></div></template><LsEmptyState v-if="!query.data.value.recent_users.length" title="暂无用户" description="新注册用户会显示在这里。" /><NDataTable v-else :columns="userColumns" :data="query.data.value.recent_users" :row-key="row => row.id" :scroll-x="680" /></LsPanel>
        <LsPanel><template #header><div class="panel-heading"><div><h2>近期团队</h2><p>关注新团队与治理状态</p></div><RouterLink to="/teams">查看全部 <ArrowRight :size="16" /></RouterLink></div></template><LsEmptyState v-if="!query.data.value.recent_teams.length" title="暂无团队" description="新创建团队会显示在这里。" /><div v-else class="simple-dashboard-list"><RouterLink v-for="team in query.data.value.recent_teams" :key="team.id" :to="`/teams/${team.id}`"><span><strong>{{ team.name || team.slug }}</strong><small>#{{ team.id }} · {{ team.slug }}</small></span><LsStatusTag :label="adminStatusLabel(teamStatus(team))" :type="adminStatusType(teamStatus(team))" /></RouterLink></div></LsPanel>
      </div>
      <aside class="dashboard-side">
        <LsPanel><template #header><div class="panel-heading"><div><h2>需要关注</h2><p>当前平台治理状态</p></div><ShieldAlert :size="19" /></div></template><p v-if="!attention" class="attention-clear">当前没有封禁状态需要复核。</p><div v-else class="attention-list"><RouterLink to="/users?status=banned"><span>已封禁用户</span><strong>{{ query.data.value.counts.banned_users }}</strong></RouterLink><RouterLink to="/teams?status=banned"><span>已封禁团队</span><strong>{{ query.data.value.counts.banned_teams }}</strong></RouterLink></div></LsPanel>
        <LsPanel><template #header><div class="panel-heading"><div><h2>最近管理操作</h2><p>平台与业务审计事件</p></div></div></template><LsEmptyState v-if="!query.data.value.recent_audit_events.length" title="暂无审计记录" description="平台治理操作会显示在这里。" /><div v-else class="audit-feed"><div v-for="event in query.data.value.recent_audit_events" :key="event.id"><strong>{{ event.action }}</strong><span>{{ event.actor_username || 'CLI / 系统' }} · {{ formatTime(event.create_time) }}</span></div></div></LsPanel>
      </aside>
    </section>
  </template>
</template>

<style scoped>.dashboard-search{min-height:64px;justify-content:stretch;padding:10px 16px;color:var(--muted-ink);text-align:left}.dashboard-search :deep(.n-button__content){width:100%;display:grid;grid-template-columns:24px 1fr auto;align-items:center;gap:12px}.dashboard-search strong,.dashboard-search small{display:block}.dashboard-search strong{color:var(--ink)}.dashboard-search small{margin-top:2px}.dashboard-primary,.dashboard-side{display:grid;align-content:start;gap:16px}.summary-strip small{color:var(--muted-ink);font-size:.72rem}.panel-heading{display:flex;align-items:center;justify-content:space-between;gap:16px}.panel-heading h2,.panel-heading p{margin:0}.panel-heading p{color:var(--muted-ink)}.panel-heading a{display:inline-flex;align-items:center;gap:5px;color:var(--sky-lost-strong);font-weight:650}.simple-dashboard-list,.attention-list,.audit-feed{display:grid}.simple-dashboard-list a,.attention-list a{min-height:58px;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid var(--line)}.simple-dashboard-list a:last-child,.attention-list a:last-child,.audit-feed>div:last-child{border-bottom:0}.simple-dashboard-list strong,.simple-dashboard-list small{display:block}.simple-dashboard-list small,.audit-feed span{color:var(--muted-ink);font-size:.76rem}.attention-list strong{color:var(--danger);font-variant-numeric:tabular-nums}.attention-clear{margin:0;color:var(--success)}.audit-feed>div{display:grid;gap:3px;padding:13px 0;border-bottom:1px solid var(--line)}</style>
