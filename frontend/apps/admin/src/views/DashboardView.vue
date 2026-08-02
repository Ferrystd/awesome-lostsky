<script setup lang="ts">
import { api } from '@lostsky/api/client'
import { useQuery } from '@tanstack/vue-query'
import { ArrowRight, Search, ShieldAlert } from '@lucide/vue'
import { NButton } from 'naive-ui'
import { computed } from 'vue'
import PageHeader from '../components/PageHeader.vue'
import RetryState from '../components/RetryState.vue'
import StatusBadge from '../components/StatusBadge.vue'
import type { AuditEvent, TeamSummary, UserSummary } from '../types'
import { formatTime } from '../utils'

interface Dashboard {
  counts: Record<string, number>
  recent_users: UserSummary[]
  recent_teams: TeamSummary[]
  recent_audit_events: AuditEvent[]
}
const query = useQuery({ queryKey: ['admin-dashboard'], queryFn: () => api.get<Dashboard>('/dashboard') })
const attention = computed(() => Number(query.data.value?.counts.banned_users ?? 0) + Number(query.data.value?.counts.banned_teams ?? 0))
function openSearch() { window.dispatchEvent(new CustomEvent('admin:open-search')) }
</script>

<template>
  <PageHeader title="平台总览" description="先确认平台状态，再进入具体资源处理治理任务。" />
  <NButton autofocus block class="dashboard-search" @click="openSearch">
    <Search :size="19" /><span><strong>搜索平台资源</strong><small>用户、手机号、邮箱、团队或资源 ID</small></span><kbd>Ctrl K</kbd>
  </NButton>
  <div v-if="query.isPending.value" class="panel state">正在读取平台数据…</div>
  <RetryState v-else-if="query.isError.value" class="panel" :error="query.error.value" />
  <template v-else-if="query.data.value">
    <section class="summary-strip" aria-label="平台关键数据">
      <div><span>用户总数</span><strong>{{ query.data.value.counts.users }}</strong><small>近 7 日 +{{ query.data.value.counts.new_users_7d }}</small></div>
      <div><span>团队总数</span><strong>{{ query.data.value.counts.teams }}</strong><small>近 7 日 +{{ query.data.value.counts.new_teams_7d }}</small></div>
      <div><span>活跃会话</span><strong>{{ query.data.value.counts.active_sessions }}</strong><small>当前设备授权</small></div>
      <div><span>平台管理员</span><strong>{{ query.data.value.counts.administrators }}</strong><small>{{ attention }} 项封禁状态</small></div>
    </section>
    <section class="dashboard-grid">
      <div class="dashboard-primary">
        <article class="panel">
          <div class="panel-heading"><div><h2>最近注册用户</h2><p>快速进入用户详情与治理操作</p></div><RouterLink to="/users">查看全部 <ArrowRight :size="16" /></RouterLink></div>
          <div v-if="!query.data.value.recent_users.length" class="state">暂无用户</div>
          <div v-else class="mobile-records">
            <RouterLink v-for="user in query.data.value.recent_users" :key="user.id" class="mobile-record" :to="`/users/${user.id}`"><header><strong>{{ user.nickname || user.username }}</strong><StatusBadge :status="user.is_banned ? 'banned' : 'active'" /></header><small>#{{ user.id }} · {{ formatTime(user.create_time) }}</small></RouterLink>
          </div>
          <table v-if="query.data.value.recent_users.length" class="data-table desktop-table"><thead><tr><th>用户</th><th>联系方式</th><th>状态</th><th>注册时间</th></tr></thead><tbody><tr v-for="user in query.data.value.recent_users" :key="user.id"><td class="cell-primary"><RouterLink :to="`/users/${user.id}`">{{ user.nickname || user.username }}</RouterLink><small>#{{ user.id }}</small></td><td>{{ user.phone_masked || user.email_masked || '—' }}</td><td><StatusBadge :status="user.is_banned ? 'banned' : 'active'" /></td><td>{{ formatTime(user.create_time) }}</td></tr></tbody></table>
        </article>
        <article class="panel">
          <div class="panel-heading"><div><h2>近期团队</h2><p>关注新团队与治理状态</p></div><RouterLink to="/teams">查看全部 <ArrowRight :size="16" /></RouterLink></div>
          <div v-if="!query.data.value.recent_teams.length" class="state">暂无团队</div>
          <div v-else class="simple-dashboard-list">
            <RouterLink v-for="team in query.data.value.recent_teams" :key="team.id" :to="`/teams/${team.id}`">
              <span><strong>{{ team.name || team.slug }}</strong><small>#{{ team.id }} · {{ team.slug }}</small></span>
              <StatusBadge :status="team.is_cancelled ? 'cancelled' : team.is_banned ? 'banned' : 'active'" />
            </RouterLink>
          </div>
        </article>
      </div>
      <aside class="dashboard-side">
        <section class="panel attention-panel">
          <div class="panel-heading"><div><h2>需要关注</h2><p>当前平台治理状态</p></div><ShieldAlert :size="19" /></div>
          <p v-if="!attention" class="attention-clear">当前没有封禁状态需要复核。</p>
          <div v-else class="attention-list">
            <RouterLink to="/users?status=banned"><span>已封禁用户</span><strong>{{ query.data.value.counts.banned_users }}</strong></RouterLink>
            <RouterLink to="/teams?status=banned"><span>已封禁团队</span><strong>{{ query.data.value.counts.banned_teams }}</strong></RouterLink>
          </div>
        </section>
        <section class="panel">
          <div class="panel-heading"><div><h2>最近管理操作</h2><p>平台与业务审计事件</p></div></div>
          <div v-if="!query.data.value.recent_audit_events.length" class="state">暂无审计记录</div>
          <div v-else class="audit-feed">
            <div v-for="event in query.data.value.recent_audit_events" :key="event.id"><strong>{{ event.action }}</strong><span>{{ event.actor_username || 'CLI / 系统' }} · {{ formatTime(event.create_time) }}</span></div>
          </div>
        </section>
      </aside>
    </section>
  </template>
</template>

<style scoped>
.dashboard-search{min-height:64px;justify-content:stretch;padding:10px 16px;color:var(--muted-ink);text-align:left}.dashboard-search :deep(.n-button__content){width:100%;display:grid;grid-template-columns:24px 1fr auto;align-items:center;gap:12px}.dashboard-search strong,.dashboard-search small{display:block}.dashboard-search strong{color:var(--ink)}.dashboard-search small{margin-top:2px}.dashboard-primary,.dashboard-side{display:grid;align-content:start;gap:16px}.summary-strip small{color:var(--muted-ink);font-size:.72rem}.panel-heading a{display:inline-flex;align-items:center;gap:5px;color:var(--sky-lost-strong);font-weight:650}.simple-dashboard-list,.attention-list,.audit-feed{display:grid}.simple-dashboard-list a,.attention-list a{min-height:58px;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 16px;border-bottom:1px solid var(--line)}.simple-dashboard-list a:last-child,.attention-list a:last-child,.audit-feed>div:last-child{border-bottom:0}.simple-dashboard-list strong,.simple-dashboard-list small{display:block}.simple-dashboard-list small,.audit-feed span{color:var(--muted-ink);font-size:.76rem}.attention-list strong{color:var(--danger);font-variant-numeric:tabular-nums}.attention-clear{margin:0;padding:16px;color:var(--success)}.audit-feed>div{display:grid;gap:3px;padding:13px 16px;border-bottom:1px solid var(--line)}
</style>
