<script setup lang="ts">
import LsOverviewLinks from '@lostsky/ui/components/LsOverviewLinks.vue'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsDescriptionList from '@lostsky/ui/components/LsDescriptionList.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsOverviewPage from '@lostsky/ui/components/LsOverviewPage.vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import LsMetricGrid from '@lostsky/ui/components/LsMetricGrid.vue'
import LsSceneMotionControl from '@lostsky/ui/components/LsSceneMotionControl.vue'
import LsSectionHeader from '@lostsky/ui/components/LsSectionHeader.vue'
import { ClipboardList, Clock3, FileClock, MessageCircleMore, Send, UserRound, Users } from '@lucide/vue'
import { computed } from 'vue'
import AccountHealthSummary from './AccountHealthSummary.vue'
import OperationRecordList from './OperationRecordList.vue'
import TaskStatusSummary from './TaskStatusSummary.vue'
import type { WeiboAccount, WeiboOperation, WeiboTask } from '../types'

const props = withDefaults(
  defineProps<{
    accounts?: WeiboAccount[]
    tasks?: WeiboTask[]
    operations?: WeiboOperation[]
    state?: 'loading' | 'restricted' | 'error' | 'ready'
    errorDescription?: string
  }>(),
  {
    accounts: () => [],
    tasks: () => [],
    operations: () => [],
    state: 'ready',
    errorDescription: '',
  },
)

const entries = [
  {
    key: 'accounts',
    label: '账号',
    description: '绑定账号并检查登录状态',
    to: '/accounts',
    icon: Users,
  },
  {
    key: 'compose',
    label: '发帖',
    description: '准备图片与超话内容',
    to: '/compose',
    icon: Send,
  },
  {
    key: 'interactions',
    label: '互动',
    description: '完成一次点赞或评论',
    to: '/interactions',
    icon: MessageCircleMore,
  },
  {
    key: 'tasks',
    label: '任务',
    description: '编排持续任务与候选账号',
    to: '/tasks',
    icon: ClipboardList,
  },
  {
    key: 'logs',
    label: '日志',
    description: '追踪最近 30 天执行结果',
    to: '/logs',
    icon: FileClock,
  },
]

const nextTask = computed(() => props.tasks.filter((item) => item.next_run_at).sort((a, b) => (a.next_run_at || 0) - (b.next_run_at || 0))[0])
const failures = computed(() => props.operations.filter((item) => ['Failed', 'Unknown'].includes(item.status)))
const validAccounts = computed(() => props.accounts.filter((item) => item.health === 'Valid').length)
const activeTasks = computed(() => props.tasks.filter((item) => item.status === 'Active').length)
const blockedTasks = computed(() => props.tasks.filter((item) => ['BlockedLogin', 'BlockedAbility'].includes(item.status)).length)
const signal = computed(() => {
  if (props.state === 'loading') return { label: '正在同步运行态势', tone: 'loading' }
  if (props.state === 'restricted') return { label: '工作台已就绪', tone: 'ready' }
  if (props.state === 'error') return { label: '运行态势暂不可用', tone: 'danger' }
  if (failures.value.length || blockedTasks.value) return { label: '有事项需要处理', tone: 'warning' }
  return { label: '运行态势平稳', tone: 'success' }
})
const metric = (value: number) => (props.state === 'ready' ? String(value) : '—')
const nextTime = computed(() => (nextTask.value?.next_run_at ? new Date(nextTask.value.next_run_at * 1000).toLocaleString() : ''))
</script>

<template>
  <LsOverviewPage title="团队微博，保持在可控节奏" description="在一个页面查看账号健康、任务状态和执行结果；让贵团队能够检查运行状态。">
    <template #actions>
      <LsPageLink to="/compose" :icon="Send" label="单次发帖" />
      <LsPageLink to="/personal" :icon="UserRound" label="进入个人工作台" />
      <LsSceneMotionControl />
    </template>
    <template #summary>
      <div class="weibo-dashboard-summary">
        <LsPanel>
          <template #header><LsSectionHeader title="运行摘要" /></template>
          <p class="weibo-dashboard-signal" :data-tone="signal.tone" aria-live="polite">{{ signal.label }}</p>
          <LsMetricGrid aria-label="运行摘要" :items="[
            { key: 'accounts', label: '有效账号', value: `${metric(validAccounts)} / ${metric(accounts.length)}` },
            { key: 'tasks', label: '运行任务', value: metric(activeTasks) },
            { key: 'attention', label: '待处理', value: metric(failures.length + blockedTasks) },
          ]" />
        </LsPanel>
        <LsPanel>
          <template #header><LsSectionHeader title="下一次执行"><template #aside><Clock3 :size="19" aria-hidden="true" /></template></LsSectionHeader></template>
          <div class="weibo-dashboard-next">
            <template v-if="state === 'loading'"><strong>正在同步计划</strong><p>稍后会在这里显示最先到达的任务。</p></template>
            <template v-else-if="state === 'restricted'"><strong>选择工作入口</strong><p>需要执行具体工作时，从工作入口继续。</p></template>
            <template v-else-if="state === 'error'"><strong>暂时无法确认</strong><p>工作入口仍可使用，可进入任务页继续处理。</p></template>
            <template v-else-if="nextTask">
              <strong>{{ nextTask.topic.display_tag || `#${nextTask.topic.name}#` }}</strong>
              <time class="weibo-numbers" :datetime="new Date((nextTask.next_run_at || 0) * 1000).toISOString()">{{ nextTime }}</time>
              <p>{{ nextTask.operation_type === 'Checkin' ? '每日超话签到' : '自动发布任务' }}</p>
            </template>
            <template v-else><strong>暂无计划执行</strong><p>开启或恢复持续任务后，下一次安排会出现在这里。</p></template>
            <LsPageLink to="/tasks" :icon="ClipboardList" label="查看任务排期" />
          </div>
        </LsPanel>
      </div>
    </template>
    <div class="weibo-dashboard-workspace">
      <div class="weibo-dashboard-main">
        <LsAsyncState v-if="state === 'loading'" state="loading" :rows="3" />
        <LsPanel v-else-if="state === 'restricted'"><LsDescriptionList><dt>微博态势</dt><dd>-</dd></LsDescriptionList></LsPanel>
        <LsAsyncState v-else-if="state === 'error'" state="error" title="无法读取微博态势" :description="errorDescription" />
        <template v-else>
          <LsPanel>
            <template #header><LsSectionHeader title="近期需要关注" description="只收拢失败与结果未确认记录；不显示常规运行日志。"><template #aside><span>{{ failures.length }} 项</span></template></LsSectionHeader></template>
            <LsEmptyState v-if="!failures.length" title="近期运行正常" description="最近的执行记录中没有失败或结果未确认项。" />
            <OperationRecordList v-else :operations="failures" />
          </LsPanel>
          <LsPanel>
            <template #header><LsSectionHeader title="运行健康" description="账号健康和任务状态并列展示，便于优先处理异常。" /></template>
            <div class="weibo-dashboard-health">
              <section aria-labelledby="weibo-account-health-title"><h3 id="weibo-account-health-title">账号健康</h3><AccountHealthSummary :accounts="accounts" /></section>
              <section aria-labelledby="weibo-task-health-title"><h3 id="weibo-task-health-title">任务状态</h3><TaskStatusSummary :tasks="tasks" /></section>
            </div>
          </LsPanel>

        </template>
      </div>
      <LsPanel>
        <template #header><LsSectionHeader title="工作入口" description="继续准备内容、管理账号或处理任务。" /></template>
        <LsOverviewLinks label="微博工作入口" :entries="entries" />
      </LsPanel>
    </div>
  </LsOverviewPage>
</template>

<style scoped>
.weibo-dashboard-summary, .weibo-dashboard-workspace, .weibo-dashboard-main, .weibo-dashboard-health { min-width: 0; display: grid; gap: 1rem; align-content: start; }
.weibo-dashboard-signal { margin: 0 0 1rem; color: var(--text-secondary); font-size: .875rem; }
.weibo-dashboard-signal[data-tone='danger'] { color: var(--danger); }
.weibo-dashboard-signal[data-tone='warning'] { color: var(--warning); }
.weibo-dashboard-signal[data-tone='success'] { color: var(--success); }
.weibo-dashboard-next { display: grid; gap: .75rem; min-width: 0; }
.weibo-dashboard-next p { margin: 0; color: var(--text-secondary); line-height: 1.6; }
.weibo-dashboard-health section { min-width: 0; }
.weibo-dashboard-health h3 { margin: 0 0 .75rem; font-size: .875rem; }
@media (min-width: 720px) { .weibo-dashboard-health { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (min-width: 960px) {
  .weibo-dashboard-summary { grid-template-columns: minmax(0, 1.45fr) minmax(0, 1fr); }
  .weibo-dashboard-workspace { grid-template-columns: minmax(0, 1.65fr) minmax(0, 1fr); }
}
</style>
