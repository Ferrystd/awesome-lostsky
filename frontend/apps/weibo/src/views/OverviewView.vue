<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import { formatPermissionDenied } from '@lostsky/api/error-format'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsDescriptionList from '@lostsky/ui/components/LsDescriptionList.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsWorkspaceOverview from '@lostsky/ui/components/LsWorkspaceOverview.vue'
import { ClipboardList, FileClock, House, MessageCircleMore, Send, Users } from '@lucide/vue'
import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AccountHealthSummary from '../components/AccountHealthSummary.vue'
import OperationRecordList from '../components/OperationRecordList.vue'
import TeamOverviewDashboard from '../components/TeamOverviewDashboard.vue'
import TaskStatusSummary from '../components/TaskStatusSummary.vue'
import { apiPrefix, hasWeiboPermission, loadAccess } from '../lib/workspace'
import type { WeiboAccount, WeiboOperation, WeiboTask } from '../types'

const route = useRoute()
const personal = computed(() => route.meta.workspace === 'personal')
const prefix = computed(() => apiPrefix(personal.value))
const access = useQuery({
  queryKey: ['weibo-access'],
  queryFn: () => loadAccess(),
})
const requiredPermission = computed(() => (personal.value ? ('weibo.personal.use' as const) : ('weibo.team.manage' as const)))
const canRead = computed(() => hasWeiboPermission(access.data.value, requiredPermission.value))
useRouteAccess(computed(() => Array.isArray(access.data.value?.permissions) && !access.isError.value && !canRead.value ? formatPermissionDenied([requiredPermission.value]) : ''))
const query = useQuery({
  queryKey: computed(() => ['weibo-overview', prefix.value]),
  queryFn: async () => {
    const [accounts, tasks, operations] = await Promise.all([
      api.get<WeiboAccount[]>(`${prefix.value}/accounts`),
      api.get<WeiboTask[]>(`${prefix.value}/tasks`),
      api.get<{ list: WeiboOperation[] }>(`${prefix.value}/operations`, {
        limit: 6,
      }),
    ])
    return { accounts, tasks, operations: operations.list }
  },
  enabled: canRead,
})

const next = computed(() => query.data.value?.tasks.filter((item) => item.next_run_at).sort((a, b) => (a.next_run_at || 0) - (b.next_run_at || 0))[0])
const failures = computed(() => (query.data.value?.operations ?? []).filter((item) => ['Failed', 'Unknown'].includes(item.status)))
const identityType = computed(() => ({ team: '团队身份', teamMember: '团队成员', teamVirtual: '虚拟人员' })[access.data.value?.identity.type ?? ''] || '当前人员')
const entries = computed(() => [
  {
    key: 'accounts',
    label: '账号',
    description: '绑定微博账号并检查登录状态。',
    to: `${prefix.value}/accounts`,
    icon: Users,
  },
  {
    key: 'compose',
    label: '发帖',
    description: '准备图片与超话内容，再确认执行一次。',
    to: `${prefix.value}/compose`,
    icon: Send,
  },
  {
    key: 'interactions',
    label: '互动',
    description: '完成单次点赞或评论，不自动重试。',
    to: `${prefix.value}/interactions`,
    icon: MessageCircleMore,
  },
  {
    key: 'tasks',
    label: '任务',
    description: '配置持续随机间隔任务与候选账号。',
    to: `${prefix.value}/tasks`,
    icon: ClipboardList,
  },
  {
    key: 'logs',
    label: '日志',
    description: '查看最近 30 天的最小结构化执行结果。',
    to: `${prefix.value}/logs`,
    icon: FileClock,
  },
])
const actions = computed(() => [
  {
    key: 'team',
    label: '进入团队工作台',
    to: '/overview',
    icon: House,
    primary: true,
  },
  {
    key: 'compose',
    label: '单次发帖',
    to: '/personal/compose',
    icon: Send,
  },
])
const scopeNotes = ['账号、任务和日志固定在当前人员范围，页面不提供跨人员筛选。', '远端写入和任务开启/恢复会在用户提交动作时核对 Weibo Ability。']
</script>

<template>
  <div class="weibo-overview">
    <TeamOverviewDashboard v-if="!personal" :accounts="query.data.value?.accounts" :tasks="query.data.value?.tasks" :operations="query.data.value?.operations" :state="access.isPending.value ? 'loading' : !canRead ? 'restricted' : query.isPending.value ? 'loading' : query.isError.value ? 'error' : 'ready'" :error-description="query.isError.value ? friendlyError(query.error.value) : ''" />

    <template v-else>
      <LsWorkspaceOverview :eyebrow="`${identityType} · 微博个人工作台`" :title="access.data.value?.identity.name || '当前人员调度态势'" description="围绕当前身份准备内容、管理任务并追踪执行结果。" :actions="actions" :entries="entries" :scope-notes="scopeNotes" />

      <LsAsyncState v-if="access.isPending.value || (canRead && query.isPending.value)" state="loading" :rows="3" />
      <LsPanel v-else-if="!canRead">
        <LsDescriptionList
          ><dt>微博态势</dt>
          <dd>-</dd></LsDescriptionList
        >
      </LsPanel>
      <LsAsyncState v-else-if="query.isError.value" state="error" title="无法读取微博态势" :description="`${friendlyError(query.error.value)}；账号、发帖、互动、任务和日志入口仍可使用。`" />
      <section v-else-if="query.data.value" class="weibo-overview-status" aria-label="调度运行状态">
        <LsPanel class="weibo-overview-next">
          <template #header><strong>下一次执行</strong></template>
          <template v-if="next">
            <p>
              <strong>{{ next.topic.display_tag || `#${next.topic.name}#` }}</strong>
            </p>
            <p class="weibo-numbers">
              {{ new Date((next.next_run_at || 0) * 1000).toLocaleString() }}
            </p>
          </template>
          <p v-else class="weibo-empty">暂无已开启的计划执行。</p>
        </LsPanel>
        <LsPanel>
          <template #header><strong>账号健康</strong></template>
          <AccountHealthSummary :accounts="query.data.value.accounts" />
        </LsPanel>
        <LsPanel>
          <template #header><strong>任务状态</strong></template>
          <TaskStatusSummary :tasks="query.data.value.tasks" />
        </LsPanel>
        <LsPanel class="weibo-overview-failures">
          <template #header><strong>近期失败与未确认结果</strong></template>
          <LsEmptyState :source="query.data.value" v-if="!failures.length" title="近期运行正常" description="最近的执行记录中没有失败或结果未确认项。" />
          <OperationRecordList v-else :operations="failures" />
        </LsPanel>
      </section>
    </template>
  </div>
</template>
