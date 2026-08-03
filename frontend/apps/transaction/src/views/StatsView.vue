<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import { useQueries } from '@tanstack/vue-query'
import { BarChart3 } from '@lucide/vue'
import { NDataTable, NDatePicker } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { computed, h, ref } from 'vue'
import { integer, money } from '../lib'
import type { AssigneeStat, CustomerStat, EntityStat, StatsSummary, TimelineStat } from '../types'

const now = new Date()
const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).getTime()
const range = ref<[number, number]>([start, end])
const params = computed(() => ({
  start_time: Math.floor(range.value[0] / 1000),
  end_time: Math.floor(range.value[1] / 1000) + 86400,
}))
const queries = useQueries({
  queries: computed(() => [
    { queryKey: ['transaction-stats', 'summary', params.value], queryFn: () => api.get<StatsSummary>('/transaction/stats', { ...params.value, type: 'summary' }) },
    { queryKey: ['transaction-stats', 'timeline', params.value], queryFn: () => api.get<TimelineStat[]>('/transaction/stats', { ...params.value, type: 'timeline', granularity: 'day' }) },
    { queryKey: ['transaction-stats', 'entities', params.value], queryFn: () => api.get<EntityStat[]>('/transaction/stats', { ...params.value, type: 'byEntity', role: 'handler' }) },
    { queryKey: ['transaction-stats', 'customers', params.value], queryFn: () => api.get<CustomerStat[]>('/transaction/stats', { ...params.value, type: 'byCustomer' }) },
    { queryKey: ['transaction-stats', 'assignees', params.value], queryFn: () => api.get<AssigneeStat[]>('/transaction/stats', { ...params.value, type: 'byAssignee' }) },
  ]),
})
const summary = computed(() => queries.value[0]?.data as StatsSummary | undefined)
const timeline = computed(() => (queries.value[1]?.data ?? []) as TimelineStat[])
const entities = computed(() => (queries.value[2]?.data ?? []) as EntityStat[])
const customers = computed(() => (queries.value[3]?.data ?? []) as CustomerStat[])
const assignees = computed(() => (queries.value[4]?.data ?? []) as AssigneeStat[])
const pending = computed(() => queries.value.some(item => item.isPending))
const error = computed(() => queries.value.find(item => item.error)?.error)
const maxTimeline = computed(() => Math.max(1, ...timeline.value.map(item => Number(item.amount))))
const assigneeColumns: DataTableColumns<AssigneeStat> = [
  { title: '归属人', key: 'name', render: row => h('span', [h('strong', row.name || `主体 #${row.entity_id}`), row.slug ? h('small', `@${row.slug}`) : null]) },
  { title: '成交客户', key: 'customer_count', render: row => integer(row.customer_count) },
  { title: '流水', key: 'transaction_count', render: row => integer(row.transaction_count) },
  { title: '成交额', key: 'total_price', render: row => money(row.total_price) },
  { title: '成本', key: 'total_cost', render: row => money(row.total_cost) },
  { title: '团队所得', key: 'team_cut', render: row => money(row.team_cut) },
]
</script>

<template>
  <div class="stats-view">
    <LsPageHeader title="经营统计" description="用同一时间范围查看成交、支付构成、接单人分配与客户贡献。">
      <template #actions>
        <NDatePicker v-model:value="range" type="daterange" :clearable="false" />
      </template>
    </LsPageHeader>
    <LsAsyncState v-if="error" state="error" title="暂时无法读取经营统计" :description="friendlyError(error)" />
    <LsAsyncState v-else-if="pending" state="loading" :rows="5" />
    <template v-else>
      <LsPanel><section class="metrics" aria-label="统计摘要">
        <article><span>成交金额</span><strong class="ls-tabular">{{ money(summary?.total_price) }}</strong><small>{{ integer(summary?.total_count) }} 笔流水</small></article>
        <article><span>平均单价</span><strong class="ls-tabular">{{ money(summary?.avg_price) }}</strong><small>按流水平均</small></article>
        <article><span>现款</span><strong class="ls-tabular">{{ money(summary?.cash_total) }}</strong><small>实时支付</small></article>
        <article><span>预存款</span><strong class="ls-tabular">{{ money(summary?.prepaid_total) }}</strong><small>余额支付</small></article>
        <article><span>成本</span><strong class="ls-tabular">{{ money(summary?.total_cost) }}</strong><small>直接成本</small></article>
      </section></LsPanel>
      <LsPanel><section class="chart">
        <div class="section-title"><div><h3>每日成交</h3><p>柱长表示当天成交金额，数字保留精确值。</p></div></div>
        <div v-if="timeline.length" class="bars" role="img" aria-label="每日成交金额条形图">
          <div v-for="item in timeline" :key="item.date">
            <span>{{ item.date }}</span>
            <i><b :style="{ width: `${Math.max(2, Number(item.amount) / maxTimeline * 100)}%` }" /></i>
            <strong>{{ money(item.amount) }}</strong>
          </div>
        </div>
        <div v-else class="mini-empty"><BarChart3 :size="30" /><span>所选时间内没有成交数据</span></div>
      </section></LsPanel>
      <section class="rankings">
        <LsPanel><article>
          <div class="section-title"><div><h3>接单人分配</h3><p>按分配金额从高到低</p></div></div>
          <ol v-if="entities.length"><li v-for="item in entities" :key="String(item.entity_id)"><span>{{ item.name || '团队主体' }}<small>{{ item.count }} 笔</small></span><strong>{{ money(item.amount) }}</strong></li></ol>
          <p v-else class="hint">暂无接单人统计。</p>
        </article></LsPanel>
        <LsPanel><article>
          <div class="section-title"><div><h3>客户贡献</h3><p>按成交金额从高到低</p></div></div>
          <ol v-if="customers.length"><li v-for="item in customers" :key="String(item.customer_id)"><span>{{ item.customer_name || '未关联客户' }}<small>{{ item.count }} 笔</small></span><strong>{{ money(item.amount) }}</strong></li></ol>
          <p v-else class="hint">暂无客户统计。</p>
        </article></LsPanel>
      </section>
      <LsPanel><section class="assignee-performance">
        <div class="section-title"><div><h3>归属业绩</h3><p>按交易发生时写入的发单归属统计，之后改归属不会改变历史。</p></div></div>
        <NDataTable v-if="assignees.length" :columns="assigneeColumns" :data="assignees" :row-key="row => row.entity_id" :scroll-x="760" />
        <p v-else class="hint">所选时间内暂无带客户归属的成交。</p>
      </section></LsPanel>
    </template>
  </div>
</template>

<style scoped>
.stats-view{display:grid;gap:1.25rem}.metrics{display:grid;grid-template-columns:repeat(5,1fr)}.metrics article{display:grid;gap:.25rem;padding:1.15rem;border-right:1px solid var(--line)}.metrics article:last-child{border-right:0}.metrics span,.metrics small{color:var(--muted-ink);font-size:.76rem}.metrics strong{font-size:1.12rem}.bars{display:grid;gap:.65rem;margin-top:1rem}.bars>div{display:grid;grid-template-columns:6.5rem minmax(6rem,1fr) 7.5rem;align-items:center;gap:.75rem;font-size:.78rem}.bars i{height:8px;overflow:hidden;border-radius:4px;background:var(--cloud)}.bars b{display:block;height:100%;border-radius:4px;background:var(--sky-lost-strong)}.bars strong{text-align:right;font-variant-numeric:tabular-nums}.mini-empty{display:flex;align-items:center;justify-content:center;gap:.6rem;padding:3rem;color:var(--muted-ink)}.rankings{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}.rankings ol{list-style:none;margin:1rem 0 0;padding:0}.rankings li{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.7rem 0;border-bottom:1px solid var(--line);font-size:.875rem}.rankings li:last-child{border-bottom:0}.rankings li span,.rankings li small{display:block}.rankings li small{color:var(--muted-ink);font-size:.72rem}.rankings li strong{font-variant-numeric:tabular-nums}@media(max-width:800px){.metrics{grid-template-columns:repeat(2,1fr)}.metrics article{border-bottom:1px solid var(--line)}.rankings{grid-template-columns:1fr}}@media(max-width:560px){.bars>div{grid-template-columns:5rem 1fr}.bars strong{grid-column:2}.metrics{grid-template-columns:1fr}.metrics article{border-right:0}}
.assignee-performance{min-width:0}.assignee-performance strong,.assignee-performance small{display:block}.assignee-performance small{margin-top:.15rem;color:var(--muted-ink);font-size:.72rem}
</style>
