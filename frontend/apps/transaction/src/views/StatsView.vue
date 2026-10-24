<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsEntityIdentity from '@lostsky/ui/components/LsEntityIdentity.vue'
import LsMetricGrid from '@lostsky/ui/components/LsMetricGrid.vue'
import LsOverviewPage from '@lostsky/ui/components/LsOverviewPage.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsResponsiveDataTable from '@lostsky/ui/components/LsResponsiveDataTable.vue'
import LsSectionHeader from '@lostsky/ui/components/LsSectionHeader.vue'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useQueries, useQuery } from '@tanstack/vue-query'
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import {
  NDataTable,
  NDatePicker,
  NPagination,
  NRadioButton,
  NRadioGroup,
  NSelect,
} from 'naive-ui'
import type { DataTableColumns, DataTableSortState } from 'naive-ui'
import { computed, h, ref, watch } from 'vue'
import PersonTickRanking from '../components/PersonTickRanking.vue'
import TransactionFlowTrend from '../components/TransactionFlowTrend.vue'
import { integer, money } from '../lib'
import { fillTimeline, periodRange, shiftPeriod } from '../lib/stats-period'
import type { StatsPeriod } from '../lib/stats-period'
import type {
  AssigneeStat,
  CustomerStat,
  EntityStat,
  PersonStat,
  PersonStatsPage,
  StatsSummary,
  TimelineStat,
} from '../types'

type SortKey = 'handler_performance_total' | 'handler_count' | 'sender_count' | 'sender_performance_total' | 'income_total'

const period = ref<StatsPeriod>('month')
const periodAnchor = ref(Date.now())
const page = ref(1)
const limit = 20
const sortBy = ref<SortKey>('handler_performance_total')
const sortOrder = ref<'asc' | 'desc'>('desc')
const routeAccess = useRouteAccess()
const range = computed(() => periodRange(periodAnchor.value, period.value))
const params = computed(() => ({
  start_time: Math.floor(range.value[0] / 1000),
  end_time: Math.floor(range.value[1] / 1000),
}))
const pickerType = computed(() => period.value === 'day' ? 'date' : period.value)
const periodUnit = computed(() => period.value === 'day' ? '日' : period.value === 'week' ? '周' : '月')
const timelineGranularity = computed(() => period.value === 'day' ? 'hour' : 'day')
const periodLabel = computed(() => {
  const start = new Date(range.value[0])
  const end = new Date(range.value[1] - 1)
  if (period.value === 'day') return `${start.getFullYear()}年${start.getMonth() + 1}月${start.getDate()}日`
  if (period.value === 'month') return `${start.getFullYear()}年${start.getMonth() + 1}月`
  return `${start.getMonth() + 1}月${start.getDate()}日—${end.getMonth() + 1}月${end.getDate()}日`
})

watch([period, periodAnchor, sortBy, sortOrder], () => { page.value = 1 })

const queries = useQueries({
  queries: computed(() => [
    {
      queryKey: ['transaction-stats', 'summary', params.value],
      queryFn: () => api.get<StatsSummary>('/transaction/stats', { ...params.value, type: 'summary' }),
      enabled: !routeAccess.restricted.value,
    },
    {
      queryKey: ['transaction-stats', 'timeline', timelineGranularity.value, params.value],
      queryFn: () => api.get<TimelineStat[]>('/transaction/stats', {
        ...params.value,
        type: 'timeline',
        granularity: timelineGranularity.value,
      }),
      enabled: !routeAccess.restricted.value,
    },
    {
      queryKey: ['transaction-stats', 'entities', params.value],
      queryFn: () => api.get<EntityStat[]>('/transaction/stats', { ...params.value, type: 'byEntity', role: 'handler' }),
      enabled: !routeAccess.restricted.value,
    },
    {
      queryKey: ['transaction-stats', 'customers', params.value],
      queryFn: () => api.get<CustomerStat[]>('/transaction/stats', { ...params.value, type: 'byCustomer' }),
      enabled: !routeAccess.restricted.value,
    },
    {
      queryKey: ['transaction-stats', 'assignees', params.value],
      queryFn: () => api.get<AssigneeStat[]>('/transaction/stats', { ...params.value, type: 'byAssignee' }),
      enabled: !routeAccess.restricted.value,
    },
  ]),
})
const personQuery = useQuery({
  queryKey: computed(() => ['transaction-stats', 'people', params.value, page.value, sortBy.value, sortOrder.value]),
  queryFn: () => api.get<PersonStatsPage>('/transaction/stats', {
    ...params.value,
    type: 'byPerson',
    page: page.value,
    limit,
    sort_by: sortBy.value,
    sort_order: sortOrder.value,
  }),
  enabled: computed(() => !routeAccess.restricted.value),
})
const rankingQuery = useQuery({
  queryKey: computed(() => ['transaction-stats', 'people-ranking', params.value, sortBy.value]),
  queryFn: () => api.get<PersonStatsPage>('/transaction/stats', {
    ...params.value,
    type: 'byPerson',
    page: 1,
    limit: 8,
    sort_by: sortBy.value,
    sort_order: 'desc',
  }),
  enabled: computed(() => !routeAccess.restricted.value),
})

const summary = computed(() => queries.value[0]?.data as StatsSummary | undefined)
const timeline = computed(() => (queries.value[1]?.data ?? []) as TimelineStat[])
const entities = computed(() => (queries.value[2]?.data ?? []) as EntityStat[])
const customers = computed(() => (queries.value[3]?.data ?? []) as CustomerStat[])
const assignees = computed(() => (queries.value[4]?.data ?? []) as AssigneeStat[])
const summaryPending = computed(() => !routeAccess.restricted.value && (queries.value[0]?.isPending ?? true))
const summaryError = computed(() => routeAccess.restricted.value ? null : queries.value[0]?.error)
const timelinePending = computed(() => !routeAccess.restricted.value && (queries.value[1]?.isPending ?? true))
const timelineError = computed(() => queries.value[1]?.error)
const entitiesPending = computed(() => !routeAccess.restricted.value && (queries.value[2]?.isPending ?? true))
const entitiesError = computed(() => queries.value[2]?.error)
const customersPending = computed(() => !routeAccess.restricted.value && (queries.value[3]?.isPending ?? true))
const customersError = computed(() => queries.value[3]?.error)
const assigneesPending = computed(() => !routeAccess.restricted.value && (queries.value[4]?.isPending ?? true))
const assigneesError = computed(() => queries.value[4]?.error)
const people = computed(() => personQuery.data.value?.list ?? [])
const pageCount = computed(() => Math.max(1, Math.ceil((personQuery.data.value?.total ?? 0) / limit)))

const summaryItems = computed(() => [
  { key: 'performance', label: '履约业绩', value: routeAccess.restricted.value ? '-' : money(summary.value?.performance_total), hint: routeAccess.restricted.value ? '-' : `${integer(summary.value?.service_redemption_count)} 次权益核销` },
  { key: 'receipt', label: '实际流水', value: routeAccess.restricted.value ? '-' : money(summary.value?.receipt_total ?? summary.value?.total_price), hint: routeAccess.restricted.value ? '-' : `${integer(summary.value?.service_receipt_count)} 笔服务包收款` },
  { key: 'recharge', label: '新增预存', value: routeAccess.restricted.value ? '-' : money(summary.value?.recharge_total), hint: '顾客充值' },
  { key: 'cash', label: '现款', value: routeAccess.restricted.value ? '-' : money(summary.value?.cash_total), hint: '实时支付' },
  { key: 'prepaid', label: '预存款', value: routeAccess.restricted.value ? '-' : money(summary.value?.prepaid_total), hint: '余额支付' },
  { key: 'cost', label: '成本', value: routeAccess.restricted.value ? '-' : money(summary.value?.total_cost), hint: '直接成本' },
])
const filledTimeline = computed(() => fillTimeline(timeline.value, range.value[0], range.value[1], period.value))
const flowPoints = computed(() => filledTimeline.value.map(item => ({
  key: item.date,
  label: period.value === 'day'
    ? `${item.date.slice(11, 13)}时`
    : `${Number(item.date.slice(5, 7))}/${Number(item.date.slice(8, 10))}`,
  value: Number(item.receipt_amount),
})))
const sortLabels: Record<SortKey, string> = {
  handler_performance_total: '接单业绩',
  handler_count: '接单数',
  sender_count: '派单数',
  sender_performance_total: '发单业绩',
  income_total: '个人收入',
}
const sortOptions = Object.entries(sortLabels).map(([value, label]) => ({ value, label }))
const moneySort = computed(() => !['handler_count', 'sender_count'].includes(sortBy.value))
const rankingRows = computed(() => (rankingQuery.data.value?.list ?? []).map(row => ({
  key: row.entity_id,
  name: row.name || `主体 #${row.entity_id}`,
  value: Number(row[sortBy.value]),
})))

function shift(amount: number) {
  periodAnchor.value = shiftPeriod(periodAnchor.value, period.value, amount)
}
function updateAnchor(value: number | null) {
  if (typeof value === 'number') periodAnchor.value = value
}
function updateSorter(state: DataTableSortState | DataTableSortState[] | null) {
  const selected = Array.isArray(state) ? state[0] : state
  if (!selected?.columnKey || !selected.order) return
  sortBy.value = selected.columnKey as SortKey
  sortOrder.value = selected.order === 'ascend' ? 'asc' : 'desc'
}
const sortState = (key: SortKey) => sortBy.value === key ? (sortOrder.value === 'asc' ? 'ascend' : 'descend') : false
const personColumns = computed<DataTableColumns<PersonStat>>(() => [
  {
    title: '人员',
    key: 'name',
    width: 220,
    render: row => h(LsEntityIdentity, { type: 'unknown', name: row.name || `主体 #${row.entity_id}`, slug: row.slug ?? '', imageUrl: row.avatar }),
  },
  { title: '接单数', key: 'handler_count', sorter: true, sortOrder: sortState('handler_count'), render: row => integer(row.handler_count) },
  { title: '派单数', key: 'sender_count', sorter: true, sortOrder: sortState('sender_count'), render: row => integer(row.sender_count) },
  { title: '接单业绩', key: 'handler_performance_total', sorter: true, sortOrder: sortState('handler_performance_total'), render: row => money(row.handler_performance_total) },
  { title: '发单业绩', key: 'sender_performance_total', sorter: true, sortOrder: sortState('sender_performance_total'), render: row => money(row.sender_performance_total) },
  { title: '个人收入', key: 'income_total', sorter: true, sortOrder: sortState('income_total'), render: row => money(row.income_total) },
])
const assigneeColumns: DataTableColumns<AssigneeStat> = [
  {
    title: '发单人',
    key: 'name',
    render: row => h('span', [h('strong', row.name || `主体 #${row.entity_id}`), row.slug ? h('small', `@${row.slug}`) : null]),
  },
  { title: '成交顾客', key: 'customer_count', render: row => integer(row.customer_count) },
  { title: '流水', key: 'transaction_count', render: row => integer(row.transaction_count) },
  { title: '成交额', key: 'total_price', render: row => money(row.total_price) },
  { title: '成本', key: 'total_cost', render: row => money(row.total_cost) },
  { title: '团队所得', key: 'team_cut', render: row => money(row.team_cut) },
]
</script>

<template>
  <LsOverviewPage title="经营统计" description="按自然日、周或月查看团队实际流水、履约业绩与人员贡献。">


    <LsPanel>
    <template #header><LsSectionHeader title="统计周期" description="选择自然日、周或月，图表和明细随周期更新。" /></template>
    <section class="period-toolbar" aria-label="统计周期">
      <NRadioGroup v-model:value="period" name="stats-period" aria-label="周期粒度">
        <NRadioButton value="day">日</NRadioButton>
        <NRadioButton value="week">周</NRadioButton>
        <NRadioButton value="month">月</NRadioButton>
      </NRadioGroup>
      <div class="period-navigator">
        <LsButton variant="ghost" size="sm" :aria-label="`上一${periodUnit}`" @click="shift(-1)">
          <template #icon><ChevronLeft :size="17" /></template>上一{{ periodUnit }}
        </LsButton>
        <NDatePicker :value="periodAnchor" :type="pickerType" :clearable="false" aria-label="选择统计日期" @update:value="updateAnchor" />
        <LsButton variant="ghost" size="sm" :aria-label="`下一${periodUnit}`" @click="shift(1)">
          下一{{ periodUnit }}<template #icon><ChevronRight :size="17" /></template>
        </LsButton>
      </div>
      <strong class="period-label">{{ periodLabel }}</strong>
    </section>
    </LsPanel>

    <LsAsyncState v-if="summaryError" state="error" title="暂时无法读取经营统计" :description="friendlyError(summaryError)" />
    <LsAsyncState v-else-if="summaryPending" state="loading" :rows="5" />
    <template v-else>


      <LsPanel>
        <LsAsyncState v-if="timelinePending" state="loading" :rows="4" />
        <LsAsyncState v-else-if="timelineError" state="error" title="暂时无法读取实际流水趋势" :description="friendlyError(timelineError)" />
        <LsEmptyState v-else-if="routeAccess.restricted.value" title="没有可显示的流水趋势" description="当前没有趋势数据。" />
        <TransactionFlowTrend v-else :points="flowPoints" :period-label="periodLabel" />
      </LsPanel>

      <LsPanel>
        <template #header><LsSectionHeader title="周期收支摘要" description="与上方流水趋势使用同一统计周期。" /></template>
        <LsMetricGrid :items="summaryItems" aria-label="经营统计摘要" />
      </LsPanel>

      <LsPanel>
        <LsAsyncState v-if="!routeAccess.restricted.value && rankingQuery.isPending.value" state="loading" :rows="4" />
        <LsAsyncState v-else-if="!routeAccess.restricted.value && rankingQuery.isError.value" state="error" title="暂时无法读取人员排行" :description="friendlyError(rankingQuery.error.value)" />
        <PersonTickRanking v-else-if="rankingRows.length" :rows="rankingRows" :metric-label="sortLabels[sortBy]" :money-metric="moneySort" />
        <LsEmptyState v-else-if="routeAccess.restricted.value" title="没有可显示的人员排行" description="当前没有排行数据。" />
        <p v-else class="hint">所选时间内暂无人员业绩。</p>
      </LsPanel>

      <LsPanel>
        <section class="person-performance">
          <LsSectionHeader title="人员业绩明细" :description="routeAccess.restricted.value ? '共 0 人 · 可切换排序指标，排行榜同步切换指标' : `共 ${integer(personQuery.data.value?.total)} 人 · 可切换排序指标，排行榜同步切换指标`" :heading-level="3" />
          <div class="mobile-sort" aria-label="人员明细排序">
            <label for="person-sort-metric">排序指标</label>
            <NSelect id="person-sort-metric" v-model:value="sortBy" :options="sortOptions" />
            <NRadioGroup v-model:value="sortOrder" name="person-sort-order" aria-label="排序方向">
              <NRadioButton value="desc">从高到低</NRadioButton>
              <NRadioButton value="asc">从低到高</NRadioButton>
            </NRadioGroup>
          </div>
          <LsAsyncState v-if="!routeAccess.restricted.value && personQuery.isPending.value" state="loading" :rows="5" />
          <LsAsyncState v-else-if="!routeAccess.restricted.value && personQuery.isError.value" state="error" title="暂时无法读取人员明细" :description="friendlyError(personQuery.error.value)" />
          <template v-else-if="people.length">
            <LsResponsiveDataTable :columns="personColumns" :data="people" :row-key="row => row.entity_id" :scroll-x="940" @update:sorter="updateSorter">
              <template #mobile-title="{ row }"><span>{{ row.name || `主体 #${row.entity_id}` }}</span></template>
              <template #mobile="{ row }">
                <dl>
                  <dt>接单数</dt><dd>{{ integer(row.handler_count) }}</dd>
                  <dt>派单数</dt><dd>{{ integer(row.sender_count) }}</dd>
                  <dt>接单业绩</dt><dd>{{ money(row.handler_performance_total) }}</dd>
                  <dt>发单业绩</dt><dd>{{ money(row.sender_performance_total) }}</dd>
                  <dt>个人收入</dt><dd>{{ money(row.income_total) }}</dd>
                </dl>
              </template>
            </LsResponsiveDataTable>
            <footer class="pager">
              <span>第 {{ page }} / {{ pageCount }} 页</span>
              <NPagination v-model:page="page" :page-count="pageCount" />
            </footer>
          </template>
          <LsEmptyState v-else-if="routeAccess.restricted.value" title="没有可显示的人员明细" description="当前没有人员数据。" />
          <p v-else class="hint">所选时间内暂无人员参与流水。</p>
        </section>
      </LsPanel>

      <section class="rankings">
        <LsPanel><article>
          <LsSectionHeader title="接单数量" description="按接单数量从高到低" :heading-level="3" />
          <LsAsyncState v-if="entitiesPending" state="loading" :rows="3" />
          <LsAsyncState v-else-if="entitiesError" state="error" title="暂时无法读取接单数量" :description="friendlyError(entitiesError)" />
          <ol v-else-if="entities.length">
            <li v-for="item in entities" :key="String(item.entity_id)"><span>{{ item.name || '团队主体' }}</span><strong>{{ integer(item.count) }} 笔</strong></li>
          </ol>
          <LsEmptyState v-else-if="routeAccess.restricted.value" title="没有可显示的接单统计" description="当前没有接单数据。" />
          <p v-else class="hint">暂无接单人统计。</p>
        </article></LsPanel>
        <LsPanel><article>
          <LsSectionHeader title="顾客贡献" description="按成交金额从高到低" :heading-level="3" />
          <LsAsyncState v-if="customersPending" state="loading" :rows="3" />
          <LsAsyncState v-else-if="customersError" state="error" title="暂时无法读取顾客贡献" :description="friendlyError(customersError)" />
          <ol v-else-if="customers.length">
            <li v-for="item in customers" :key="String(item.customer_id)"><span>{{ item.customer_name || '未关联顾客' }}<small>{{ item.count }} 笔</small></span><strong>{{ money(item.amount) }}</strong></li>
          </ol>
          <LsEmptyState v-else-if="routeAccess.restricted.value" title="没有可显示的顾客统计" description="当前没有顾客数据。" />
          <p v-else class="hint">暂无顾客统计。</p>
        </article></LsPanel>
      </section>

      <LsPanel><section class="assignee-performance">
        <LsSectionHeader title="发单业绩" description="按流水保存的发单人统计；顾客有归属人时会自动写入该归属人。" :heading-level="3" />
        <LsAsyncState v-if="assigneesPending" state="loading" :rows="3" />
        <LsAsyncState v-else-if="assigneesError" state="error" title="暂时无法读取发单业绩" :description="friendlyError(assigneesError)" />
        <NDataTable v-else-if="assignees.length" :columns="assigneeColumns" :data="assignees" :row-key="row => row.entity_id" :scroll-x="760" />
        <LsEmptyState v-else-if="routeAccess.restricted.value" title="没有可显示的发单业绩" description="当前没有业绩数据。" />
        <p v-else class="hint">所选时间内暂无带发单人的成交。</p>
      </section></LsPanel>
    </template>
  </LsOverviewPage>
</template>

<style scoped>
.period-toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 1rem;
}
.period-toolbar > :first-child { justify-self: start; }
.period-navigator { display: flex; align-items: center; justify-content: center; gap: .5rem; }
.period-navigator :deep(.n-date-picker) { width: 12rem; }
.period-label { justify-self: end; color: var(--text-secondary); font-size: .82rem; font-variant-numeric: tabular-nums; }
.person-performance,
.assignee-performance { min-width: 0; }
.person-performance > :first-child,
.assignee-performance > :first-child { margin-bottom: 1rem; }
.mobile-sort { display: none; }
.pager { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-top: 1rem; color: var(--text-secondary); font-size: .8rem; }
.rankings { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
.rankings ol { list-style: none; margin: 1rem 0 0; padding: 0; }
.rankings li { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: .7rem 0; border-bottom: 1px solid var(--border); font-size: .875rem; }
.rankings li:last-child { border-bottom: 0; }
.rankings li span,
.rankings li small,
.assignee-performance strong,
.assignee-performance small { display: block; }
.rankings li small,
.assignee-performance small { margin-top: .15rem; color: var(--text-secondary); font-size: .72rem; }
.rankings li strong { font-variant-numeric: tabular-nums; }
.hint { margin: 1rem 0 0; color: var(--text-secondary); }
@media (max-width: 900px) {
  .period-toolbar { grid-template-columns: 1fr; align-items: stretch; }
  .period-toolbar > :first-child,
  .period-label { justify-self: auto; }
  .period-navigator { justify-content: space-between; }
  .period-label { text-align: center; }
}
@media (max-width: 719px) {
  .rankings { grid-template-columns: 1fr; }
  .pager { align-items: flex-start; flex-direction: column; }
  .mobile-sort { display: grid; gap: .6rem; margin-bottom: 1rem; padding: .85rem; background: var(--surface-subtle); border: 1px solid var(--border); border-radius: var(--radius-md); }
  .mobile-sort label { color: var(--text-secondary); font-size: .78rem; font-weight: 700; }
  .mobile-sort :deep(.n-radio-group) { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .mobile-sort :deep(.n-radio-button) { width: 100%; text-align: center; }
}
@media (max-width: 479px) {
  .period-navigator { display: grid; grid-template-columns: 1fr 1fr; }
  .period-navigator :deep(.n-date-picker) { grid-column: 1 / -1; grid-row: 1; width: 100%; }
}
</style>
