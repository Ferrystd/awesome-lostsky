<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import { useQueries } from '@tanstack/vue-query'
import { BarChart3 } from '@lucide/vue'
import { NDatePicker } from 'naive-ui'
import { computed, ref } from 'vue'
import PageHeader from '../components/PageHeader.vue'
import { integer, money } from '../lib'
import type { CustomerStat, MemberStat, StatsSummary, TimelineStat } from '../types'

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
    { queryKey: ['transaction-stats', 'members', params.value], queryFn: () => api.get<MemberStat[]>('/transaction/stats', { ...params.value, type: 'byMember', role: 'handler' }) },
    { queryKey: ['transaction-stats', 'customers', params.value], queryFn: () => api.get<CustomerStat[]>('/transaction/stats', { ...params.value, type: 'byCustomer' }) },
  ]),
})
const summary = computed(() => queries.value[0]?.data as StatsSummary | undefined)
const timeline = computed(() => (queries.value[1]?.data ?? []) as TimelineStat[])
const members = computed(() => (queries.value[2]?.data ?? []) as MemberStat[])
const customers = computed(() => (queries.value[3]?.data ?? []) as CustomerStat[])
const pending = computed(() => queries.value.some(item => item.isPending))
const error = computed(() => queries.value.find(item => item.error)?.error)
const maxTimeline = computed(() => Math.max(1, ...timeline.value.map(item => Number(item.amount))))
</script>

<template>
  <div class="stats-view">
    <PageHeader title="经营统计" description="用同一时间范围查看成交、支付构成、接单人分配与客户贡献。">
      <template #actions><NDatePicker v-model:value="range" type="daterange" :clearable="false" /></template>
    </PageHeader>
    <p v-if="error" class="feedback error" role="alert">{{ friendlyError(error) }}</p>
    <div v-else-if="pending" class="loading-list"><span v-for="i in 5" :key="i" /></div>
    <template v-else>
      <section class="metrics panel" aria-label="统计摘要">
        <article><span>成交金额</span><strong class="ls-tabular">{{ money(summary?.total_price) }}</strong><small>{{ integer(summary?.total_count) }} 笔流水</small></article>
        <article><span>平均单价</span><strong class="ls-tabular">{{ money(summary?.avg_price) }}</strong><small>按流水平均</small></article>
        <article><span>现款</span><strong class="ls-tabular">{{ money(summary?.cash_total) }}</strong><small>实时支付</small></article>
        <article><span>预存款</span><strong class="ls-tabular">{{ money(summary?.prepaid_total) }}</strong><small>余额支付</small></article>
        <article><span>成本</span><strong class="ls-tabular">{{ money(summary?.total_cost) }}</strong><small>直接成本</small></article>
      </section>
      <section class="chart panel">
        <div class="section-title"><div><h3>每日成交</h3><p>柱长表示当天成交金额，数字保留精确值。</p></div></div>
        <div v-if="timeline.length" class="bars" role="img" aria-label="每日成交金额条形图">
          <div v-for="item in timeline" :key="item.date">
            <span>{{ item.date }}</span>
            <i><b :style="{ width: `${Math.max(2, Number(item.amount) / maxTimeline * 100)}%` }" /></i>
            <strong>{{ money(item.amount) }}</strong>
          </div>
        </div>
        <div v-else class="mini-empty"><BarChart3 :size="30" /><span>所选时间内没有成交数据</span></div>
      </section>
      <section class="rankings">
        <article class="panel">
          <div class="section-title"><div><h3>接单人分配</h3><p>按分配金额从高到低</p></div></div>
          <ol><li v-for="item in members" :key="String(item.member_id)"><span>{{ item.nickname || '团队主体' }}<small>{{ item.count }} 笔</small></span><strong>{{ money(item.amount) }}</strong></li></ol>
          <p v-if="!members.length" class="hint">暂无接单人统计。</p>
        </article>
        <article class="panel">
          <div class="section-title"><div><h3>客户贡献</h3><p>按成交金额从高到低</p></div></div>
          <ol><li v-for="item in customers" :key="String(item.customer_id)"><span>{{ item.customer_name || '未关联客户' }}<small>{{ item.count }} 笔</small></span><strong>{{ money(item.amount) }}</strong></li></ol>
          <p v-if="!customers.length" class="hint">暂无客户统计。</p>
        </article>
      </section>
    </template>
  </div>
</template>

<style scoped>
.stats-view{display:grid;gap:1.25rem}.metrics{display:grid;grid-template-columns:repeat(5,1fr)}.metrics article{display:grid;gap:.25rem;padding:1.15rem;border-right:1px solid var(--line)}.metrics article:last-child{border-right:0}.metrics span,.metrics small{color:var(--muted-ink);font-size:.76rem}.metrics strong{font-size:1.12rem}.chart{padding:1.25rem}.bars{display:grid;gap:.65rem;margin-top:1rem}.bars>div{display:grid;grid-template-columns:6.5rem minmax(6rem,1fr) 7.5rem;align-items:center;gap:.75rem;font-size:.78rem}.bars i{height:8px;overflow:hidden;border-radius:4px;background:var(--cloud)}.bars b{display:block;height:100%;border-radius:4px;background:var(--sky-lost-strong)}.bars strong{text-align:right;font-variant-numeric:tabular-nums}.mini-empty{display:flex;align-items:center;justify-content:center;gap:.6rem;padding:3rem;color:var(--muted-ink)}.rankings{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}.rankings article{padding:1.25rem}.rankings ol{list-style:none;margin:1rem 0 0;padding:0}.rankings li{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.7rem 0;border-bottom:1px solid var(--line);font-size:.875rem}.rankings li:last-child{border-bottom:0}.rankings li span,.rankings li small{display:block}.rankings li small{color:var(--muted-ink);font-size:.72rem}.rankings li strong{font-variant-numeric:tabular-nums}@media(max-width:800px){.metrics{grid-template-columns:repeat(2,1fr)}.metrics article{border-bottom:1px solid var(--line)}.rankings{grid-template-columns:1fr}}@media(max-width:560px){.bars>div{grid-template-columns:5rem 1fr}.bars strong{grid-column:2}.metrics{grid-template-columns:1fr}.metrics article{border-right:0}}
</style>
