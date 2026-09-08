<script setup lang="ts">
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsDescriptionList from '@lostsky/ui/components/LsDescriptionList.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import { ArrowRight, CheckCircle2, ClipboardList, Clock3, FileClock, MessageCircleMore, RadioTower, Send, ShieldCheck, Users } from '@lucide/vue'
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
  <div class="weibo-dashboard">
    <section class="weibo-dashboard__hero" aria-labelledby="weibo-team-dashboard-title">
      <div class="weibo-dashboard__intro">
        <p class="weibo-dashboard__signal" :data-tone="signal.tone" aria-live="polite"><span aria-hidden="true" />{{ signal.label }}</p>
        <h2 id="weibo-team-dashboard-title">团队微博，保持在可控节奏</h2>
        <p class="weibo-dashboard__lead">把账号健康、持续任务和执行结果放在同一个运行面，先判断状态，再进入具体工作。</p>
        <nav class="weibo-dashboard__hero-actions" aria-label="团队概览主要操作">
          <RouterLink class="weibo-dashboard__action primary" to="/compose"> <Send :size="18" />单次发帖<ArrowRight :size="18" /> </RouterLink>
          <RouterLink class="weibo-dashboard__action secondary" to="/personal"> 进入个人工作台<ArrowRight :size="18" /> </RouterLink>
        </nav>
        <dl class="weibo-dashboard__metrics" aria-label="运行摘要">
          <div>
            <dt>有效账号</dt>
            <dd>{{ metric(validAccounts) }} / {{ metric(accounts.length) }}</dd>
          </div>
          <div>
            <dt>运行任务</dt>
            <dd>{{ metric(activeTasks) }}</dd>
          </div>
          <div>
            <dt>待处理</dt>
            <dd>{{ metric(failures.length + blockedTasks) }}</dd>
          </div>
        </dl>
      </div>

      <section class="weibo-dashboard__next" aria-labelledby="weibo-next-run-title">
        <header>
          <Clock3 :size="19" />
          <h3 id="weibo-next-run-title">下一次执行</h3>
        </header>
        <div v-if="state === 'loading'" class="weibo-dashboard__next-state">
          <strong>正在同步计划</strong>
          <span>稍后会在这里显示最先到达的任务。</span>
        </div>
        <div v-else-if="state === 'restricted'" class="weibo-dashboard__next-state">
          <strong>选择工作入口</strong>
          <span>需要执行具体工作时，从工作入口继续。</span>
        </div>
        <div v-else-if="state === 'error'" class="weibo-dashboard__next-state">
          <strong>暂时无法确认</strong>
          <span>工作入口仍可使用，可进入任务页继续处理。</span>
        </div>
        <div v-else-if="nextTask" class="weibo-dashboard__next-task">
          <strong>{{ nextTask.topic.display_tag || `#${nextTask.topic.name}#` }}</strong>
          <time class="weibo-numbers" :datetime="new Date((nextTask.next_run_at || 0) * 1000).toISOString()">{{ nextTime }}</time>
          <span>{{ nextTask.operation_type === 'Checkin' ? '每日超话签到' : '自动发布任务' }}</span>
        </div>
        <div v-else class="weibo-dashboard__next-state">
          <strong>暂无计划执行</strong>
          <span>开启或恢复持续任务后，下一次安排会出现在这里。</span>
        </div>
        <RouterLink class="weibo-dashboard__next-link" to="/tasks">查看任务排期<ArrowRight :size="17" /></RouterLink>
      </section>
    </section>

    <div :class="['weibo-dashboard__workspace', { restricted: state === 'restricted' }]">
      <div class="weibo-dashboard__main">
        <LsAsyncState v-if="state === 'loading'" state="loading" :rows="3" />
        <LsPanel v-else-if="state === 'restricted'">
          <LsDescriptionList
            ><dt>微博态势</dt>
            <dd>-</dd></LsDescriptionList
          >
        </LsPanel>
        <LsAsyncState v-else-if="state === 'error'" state="error" title="无法读取微博态势" :description="errorDescription" />
        <template v-else>
          <LsPanel class="weibo-dashboard__health">
            <template #header>
              <div class="weibo-dashboard__section-heading">
                <div>
                  <h2>运行健康</h2>
                  <p>账号可用性与任务状态保持并排，异常优先处理。</p>
                </div>
                <RadioTower :size="21" aria-hidden="true" />
              </div>
            </template>
            <div class="weibo-dashboard__health-grid">
              <section aria-labelledby="weibo-account-health-title">
                <h3 id="weibo-account-health-title">账号健康</h3>
                <AccountHealthSummary :accounts="accounts" />
              </section>
              <section aria-labelledby="weibo-task-health-title">
                <h3 id="weibo-task-health-title">任务状态</h3>
                <TaskStatusSummary :tasks="tasks" />
              </section>
            </div>
          </LsPanel>

          <LsPanel class="weibo-dashboard__incidents">
            <template #header>
              <div class="weibo-dashboard__section-heading">
                <div>
                  <h2>近期需要关注</h2>
                  <p>只收拢失败与结果未确认记录，避免正常日志干扰判断。</p>
                </div>
                <span class="weibo-dashboard__count">{{ failures.length }} 项</span>
              </div>
            </template>
            <LsEmptyState v-if="!failures.length" title="近期运行正常" description="最近的执行记录中没有失败或结果未确认项。" />
            <OperationRecordList v-else :operations="failures" />
          </LsPanel>
        </template>
      </div>

      <section class="weibo-dashboard__entries" aria-labelledby="weibo-work-entry-title">
        <header>
          <h2 id="weibo-work-entry-title">工作入口</h2>
          <p>从判断切换到执行。</p>
        </header>
        <nav aria-label="工作入口">
          <RouterLink v-for="entry in entries" :key="entry.key" :to="entry.to">
            <span class="weibo-dashboard__entry-icon"><component :is="entry.icon" :size="19" /></span>
            <span
              ><strong>{{ entry.label }}</strong
              ><small>{{ entry.description }}</small></span
            >
            <ArrowRight :size="18" />
          </RouterLink>
        </nav>
      </section>
    </div>

    <section v-if="state !== 'restricted'" class="weibo-dashboard__scope" aria-labelledby="weibo-team-scope-title">
      <ShieldCheck :size="22" aria-hidden="true" />
      <div>
        <h2 id="weibo-team-scope-title">当前范围</h2>
        <p>基础概览保持可达；账号、任务、日志与业务操作需要 weibo.team.manage Permission。</p>
      </div>
      <p><CheckCircle2 :size="17" />远端写入和任务开启或恢复，会在提交动作时核对 Weibo Ability。</p>
    </section>
  </div>
</template>

<style scoped>
.weibo-dashboard {
  min-width: 0;
  display: grid;
  gap: 1rem;
}
.weibo-dashboard__hero {
  min-width: 0;
  display: grid;
  gap: 1.25rem;
  padding: 1.25rem;
  color: white;
  background: var(--sky-night);
  border-radius: var(--radius-lg);
}
.weibo-dashboard__intro {
  min-width: 0;
  display: grid;
  align-content: start;
}
.weibo-dashboard__signal {
  width: max-content;
  max-width: 100%;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.85rem;
  color: oklch(0.8 0.014 210);
  font-size: 0.78rem;
  font-weight: 700;
}
.weibo-dashboard__signal span {
  width: 0.55rem;
  height: 0.55rem;
  flex: 0 0 auto;
  border-radius: 50%;
  background: var(--warning);
}
.weibo-dashboard__signal[data-tone='success'] span {
  background: var(--sky-lost);
}
.weibo-dashboard__signal[data-tone='danger'] span {
  background: var(--danger);
}
.weibo-dashboard__signal[data-tone='loading'] span {
  background: var(--afterglow);
}
.weibo-dashboard__intro h2 {
  max-width: 14ch;
  margin: 0;
  font-size: clamp(1.8rem, 4vw, 2.75rem);
  font-weight: 760;
  letter-spacing: -0.025em;
  line-height: 1.08;
  text-wrap: balance;
}
.weibo-dashboard__lead {
  max-width: 60ch;
  margin: 0.85rem 0 0;
  color: oklch(0.8 0.014 210);
  font-size: 0.92rem;
  line-height: 1.7;
}
.weibo-dashboard__hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 1.35rem;
}
.weibo-dashboard__action {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0 0.9rem;
  border-radius: 8px;
  font-size: 0.88rem;
  font-weight: 750;
}
.weibo-dashboard__action.primary {
  color: var(--sky-void);
  background: var(--afterglow);
}
.weibo-dashboard__action.secondary {
  color: white;
  background: color-mix(in oklch, var(--sky-night), white 7%);
  box-shadow: inset 0 0 0 1px color-mix(in oklch, var(--sky-lost), transparent 50%);
}
.weibo-dashboard__action:hover {
  transform: translateY(-1px);
  transition: transform var(--motion-fast) var(--ease-out);
}
.weibo-dashboard__metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 1.5rem 0 0;
  border-top: 1px solid color-mix(in oklch, var(--sky-lost), transparent 64%);
}
.weibo-dashboard__metrics div {
  min-width: 0;
  padding: 0.85rem 0.65rem 0 0;
}
.weibo-dashboard__metrics div + div {
  padding-left: 0.65rem;
  border-left: 1px solid color-mix(in oklch, var(--sky-lost), transparent 70%);
}
.weibo-dashboard__metrics dt {
  color: oklch(0.72 0.014 210);
  font-size: 0.7rem;
}
.weibo-dashboard__metrics dd {
  margin: 0.15rem 0 0;
  font-size: 1rem;
  font-weight: 760;
  font-variant-numeric: tabular-nums;
}
.weibo-dashboard__next {
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  background: color-mix(in oklch, var(--sky-night), white 6%);
  border: 1px solid color-mix(in oklch, var(--sky-lost), transparent 54%);
  border-radius: 12px;
}
.weibo-dashboard__next header {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding-bottom: 0.8rem;
  border-bottom: 1px solid color-mix(in oklch, var(--sky-lost), transparent 68%);
}
.weibo-dashboard__next h3 {
  margin: 0;
  font-size: 0.84rem;
}
.weibo-dashboard__next-task,
.weibo-dashboard__next-state {
  display: grid;
  align-content: center;
  gap: 0.35rem;
  flex: 1;
  min-height: 8rem;
  padding: 1rem 0;
}
.weibo-dashboard__next-task strong,
.weibo-dashboard__next-state strong {
  font-size: 1.2rem;
  line-height: 1.35;
}
.weibo-dashboard__next-task time {
  font-size: 0.9rem;
  font-weight: 700;
}
.weibo-dashboard__next-task span,
.weibo-dashboard__next-state span {
  color: oklch(0.75 0.014 210);
  font-size: 0.8rem;
  line-height: 1.55;
}
.weibo-dashboard__next-link {
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding-top: 0.75rem;
  color: var(--afterglow);
  border-top: 1px solid color-mix(in oklch, var(--sky-lost), transparent 68%);
  font-size: 0.82rem;
  font-weight: 750;
}
.weibo-dashboard__workspace {
  min-width: 0;
  display: grid;
  gap: 1rem;
}
.weibo-dashboard__main {
  min-width: 0;
  display: grid;
  align-content: start;
  gap: 1rem;
}
.weibo-dashboard__section-heading {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 1rem;
}
.weibo-dashboard__section-heading h2,
.weibo-dashboard__entries h2,
.weibo-dashboard__scope h2 {
  margin: 0;
  font-size: 1rem;
}
.weibo-dashboard__section-heading p,
.weibo-dashboard__entries header p,
.weibo-dashboard__scope p {
  margin: 0.25rem 0 0;
  color: var(--muted-ink);
  font-size: 0.8rem;
  line-height: 1.55;
}
.weibo-dashboard__section-heading > svg {
  flex: 0 0 auto;
  color: var(--sky-lost-strong);
}
.weibo-dashboard__health-grid {
  display: grid;
  gap: 1.25rem;
}
.weibo-dashboard__health-grid section {
  min-width: 0;
}
.weibo-dashboard__health-grid h3 {
  margin: 0 0 0.65rem;
  font-size: 0.82rem;
}
.weibo-dashboard__count {
  flex: 0 0 auto;
  padding: 0.2rem 0.5rem;
  color: var(--muted-ink);
  background: var(--cloud);
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 750;
}
.weibo-dashboard__entries {
  min-width: 0;
  overflow: hidden;
  background: white;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
}
.weibo-dashboard__entries > header {
  padding: 1.15rem 1.2rem;
  border-bottom: 1px solid var(--line);
}
.weibo-dashboard__entries nav {
  display: grid;
}
.weibo-dashboard__entries nav a {
  min-width: 0;
  min-height: 72px;
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
}
.weibo-dashboard__entries nav a + a {
  border-top: 1px solid var(--line);
}
.weibo-dashboard__entries nav a:hover {
  background: var(--cloud);
}
.weibo-dashboard__entries nav a > svg {
  color: var(--muted-ink);
}
.weibo-dashboard__entry-icon {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  color: var(--sky-lost-strong);
  background: var(--cloud);
  border-radius: 10px;
}
.weibo-dashboard__entries strong,
.weibo-dashboard__entries small {
  display: block;
}
.weibo-dashboard__entries strong {
  font-size: 0.88rem;
}
.weibo-dashboard__entries small {
  margin-top: 0.1rem;
  overflow-wrap: anywhere;
  color: var(--muted-ink);
  font-size: 0.72rem;
  line-height: 1.45;
}
.weibo-dashboard__scope {
  min-width: 0;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;
  gap: 0.75rem;
  padding: 1rem 1.1rem;
  background: color-mix(in oklch, var(--cloud), white 35%);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
}
.weibo-dashboard__scope > svg {
  margin-top: 0.1rem;
  color: var(--sky-lost-strong);
}
.weibo-dashboard__scope > p {
  grid-column: 2;
  display: flex;
  align-items: start;
  gap: 0.45rem;
  margin: 0;
}
.weibo-dashboard__scope > p svg {
  flex: 0 0 auto;
  margin-top: 0.12rem;
  color: var(--success);
}
@media (min-width: 720px) {
  .weibo-dashboard__health-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .weibo-dashboard__scope {
    grid-template-columns: auto minmax(0, 1fr) minmax(17rem, 0.75fr);
    align-items: center;
  }
  .weibo-dashboard__scope > p {
    grid-column: 3;
  }
}
@media (min-width: 960px) {
  .weibo-dashboard__hero {
    grid-template-columns: minmax(0, 1.45fr) minmax(18rem, 0.72fr);
    align-items: stretch;
    padding: 1.75rem;
  }
  .weibo-dashboard__workspace {
    grid-template-columns: minmax(0, 1.65fr) minmax(18rem, 0.72fr);
    align-items: start;
  }
  .weibo-dashboard__entries {
    position: sticky;
    top: 1rem;
  }
  .weibo-dashboard__next {
    padding: 1.2rem;
  }
  .weibo-dashboard__workspace.restricted {
    grid-template-columns: 1fr;
  }
  .weibo-dashboard__workspace.restricted .weibo-dashboard__entries {
    position: static;
  }
}
@media (max-width: 639px) {
  .weibo-dashboard__hero-actions {
    display: grid;
  }
  .weibo-dashboard__action {
    width: 100%;
  }
  .weibo-dashboard__intro h2 {
    max-width: 18ch;
  }
  .weibo-dashboard__metrics div {
    padding-right: 0.45rem;
  }
  .weibo-dashboard__metrics div + div {
    padding-left: 0.45rem;
  }
  .weibo-dashboard__metrics dt {
    font-size: 0.66rem;
  }
  .weibo-dashboard__health-grid {
    gap: 1rem;
  }
  .weibo-dashboard__scope {
    padding: 1rem;
  }
}
@media (prefers-reduced-motion: reduce) {
  .weibo-dashboard__action:hover {
    transform: none;
  }
}
.weibo-dashboard .weibo-dashboard__action.n-button {
  border: 0;
}
.weibo-dashboard .weibo-dashboard__next-link.n-button {
  width: 100%;
  background: transparent;
  border-right: 0;
  border-bottom: 0;
  border-left: 0;
}
.weibo-dashboard__entries nav .weibo-dashboard__entry-button.n-button {
  width: 100%;
  min-width: 0;
  max-width: 100%;
  min-height: 72px;
  overflow: hidden;
  padding: 0.75rem 1rem;
  color: inherit;
  background: transparent;
  border: 0;
  text-align: left;
}
.weibo-dashboard__entry-content {
  width: 100%;
  min-width: 0;
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.75rem;
  white-space: normal;
}
.weibo-dashboard__entries nav .weibo-dashboard__entry-button + .weibo-dashboard__entry-button {
  border-top: 1px solid var(--line);
}
.weibo-dashboard__entry-content > svg {
  color: var(--muted-ink);
}
</style>
