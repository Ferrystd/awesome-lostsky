<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { Pencil, Trash2 } from '@lucide/vue'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHeader from '../components/PageHeader.vue'
import { customerName, dateTime, memberName, money, transactionType } from '../lib'
import type { TransactionRecord } from '../types'

const route = useRoute()
const router = useRouter()
const client = useQueryClient()
const id = computed(() => Number(route.query.id || 0))
const query = useQuery({
  queryKey: computed(() => ['transaction', id.value]),
  queryFn: () => api.get<TransactionRecord>(`/transaction/${id.value}`),
  enabled: computed(() => id.value > 0),
})
const remove = useMutation({
  mutationFn: () => api.post(`/transaction/${id.value}/delete`),
  onSuccess: async () => {
    await client.invalidateQueries({ queryKey: ['transactions'] })
    await router.push('/')
  },
})
function confirmDelete() {
  if (confirm('确认删除这笔流水？如使用了预存款，系统会同步退款。')) remove.mutate()
}
</script>

<template>
  <div class="detail-view">
    <PageHeader title="流水详情" description="核对参与方、支付构成与分配结果。" back-to="/" back-label="返回流水列表">
      <template v-if="query.data.value?.type === 2" #actions>
        <RouterLink class="secondary-link" :to="`/edit?id=${id}`"><Pencil :size="17" />编辑</RouterLink>
        <button class="delete-action" type="button" @click="confirmDelete"><Trash2 :size="17" />删除</button>
      </template>
    </PageHeader>
    <p v-if="!id" class="feedback error">缺少流水 ID。</p>
    <p v-else-if="query.isError.value || remove.isError.value" class="feedback error" role="alert">{{ friendlyError(query.error.value || remove.error.value) }}</p>
    <div v-else-if="query.isPending.value" class="loading-list"><span v-for="i in 5" :key="i" /></div>
    <template v-else-if="query.data.value">
      <section class="summary panel">
        <div><span>{{ transactionType(query.data.value.type) }}</span><strong class="ls-tabular">{{ money(query.data.value.total_price) }}</strong><small>{{ dateTime(query.data.value.trans_at) }}</small></div>
        <p>{{ query.data.value.memo || '这笔流水没有备注。' }}</p>
      </section>
      <section class="facts panel">
        <div><span>接单人</span><strong>{{ memberName(query.data.value.handler, query.data.value.handler_id) }}</strong></div>
        <div><span>发单人</span><strong>{{ memberName(query.data.value.sender, query.data.value.sender_id) }}</strong></div>
        <div><span>客服</span><strong>{{ memberName(query.data.value.cs, query.data.value.cs_id) }}</strong></div>
        <div><span>客户</span><strong>{{ customerName(query.data.value.customer, query.data.value.customer_id) }}</strong></div>
      </section>
      <section class="breakdown">
        <article class="panel"><div class="section-title"><div><h3>支付构成</h3><p>客户本次实际支付方式</p></div></div><dl><div><dt>现款</dt><dd>{{ money(query.data.value.cash) }}</dd></div><div><dt>预存款</dt><dd>{{ money(query.data.value.prepaid) }}</dd></div><div class="total"><dt>合计</dt><dd>{{ money(Number(query.data.value.cash) + Number(query.data.value.prepaid)) }}</dd></div></dl></article>
        <article class="panel"><div class="section-title"><div><h3>成本与分配</h3><p>本笔流水的归属结果</p></div></div><dl><div><dt>成本</dt><dd>{{ money(query.data.value.cost) }}</dd></div><div><dt>接单人</dt><dd>{{ money(query.data.value.handler_cut) }}</dd></div><div><dt>发单人</dt><dd>{{ money(query.data.value.sender_cut) }}</dd></div><div><dt>客服</dt><dd>{{ money(query.data.value.cs_cut) }}</dd></div><div><dt>团队</dt><dd>{{ money(query.data.value.team_cut) }}</dd></div></dl></article>
      </section>
    </template>
  </div>
</template>

<style scoped>
.detail-view{display:grid;gap:1.25rem}.delete-action{min-height:42px;display:inline-flex;align-items:center;justify-content:center;gap:.45rem;padding:0 .9rem;border:1px solid color-mix(in oklch,var(--danger),white 65%);border-radius:9px;color:var(--danger);background:white;font-weight:700}.summary{display:flex;align-items:center;justify-content:space-between;gap:2rem;padding:1.5rem}.summary>div{display:grid}.summary span,.facts span{color:var(--muted-ink);font-size:.78rem}.summary strong{font-size:2rem;line-height:1.2}.summary small{margin-top:.35rem;color:var(--muted-ink)}.summary p{max-width:46ch;margin:0;color:var(--text-secondary);font-size:.875rem}.facts{display:grid;grid-template-columns:repeat(4,1fr)}.facts>div{display:grid;gap:.2rem;padding:1rem;border-right:1px solid var(--line)}.facts>div:last-child{border-right:0}.breakdown{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}.breakdown article{padding:1.25rem}.breakdown dl{margin:1rem 0 0}.breakdown dl div{display:flex;justify-content:space-between;gap:1rem;padding:.65rem 0;border-bottom:1px solid var(--line)}.breakdown dl div:last-child{border-bottom:0}.breakdown dt{color:var(--muted-ink)}.breakdown dd{margin:0;font-variant-numeric:tabular-nums;font-weight:700}.breakdown .total{color:var(--ink);font-weight:700}@media(max-width:700px){.summary{align-items:flex-start;flex-direction:column;gap:1rem}.facts{grid-template-columns:repeat(2,1fr)}.facts>div:nth-child(2){border-right:0}.facts>div:nth-child(-n+2){border-bottom:1px solid var(--line)}.breakdown{grid-template-columns:1fr}}
</style>
