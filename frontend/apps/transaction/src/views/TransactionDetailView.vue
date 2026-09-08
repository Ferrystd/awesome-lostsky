<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsSectionHeader from '@lostsky/ui/components/LsSectionHeader.vue'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { Pencil, Trash2 } from '@lucide/vue'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { customerName, dateTime, entityName, money, transactionType } from '../lib'
import type { TransactionRecord } from '../types'

const route = useRoute()
const routeAccess = useRouteAccess()
const router = useRouter()
const client = useQueryClient()
const personal = computed(() => route.meta.personalTransaction === true)
const id = computed(() => Number(personal.value ? route.params.id : route.query.id || 0))
const detailPath = computed(() => personal.value ? `/personal/transactions/${id.value}` : `/transaction/${id.value}`)
const query = useQuery({
  queryKey: computed(() => ['transaction', personal.value ? 'personal' : 'team', id.value]),
  queryFn: () => routeAccess.read(() => api.get<TransactionRecord>(detailPath.value)),
  enabled: computed(() => id.value > 0 && !routeAccess.restricted.value),
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
    <LsPageHeader title="流水详情" description="核对参与方、支付构成与分成结果。" :back-to="personal ? '/personal/transactions' : '/transactions'" :back-label="personal ? '返回我的流水' : '返回流水列表'">
      <template v-if="!personal && (routeAccess.restricted.value || query.data.value?.type === 2)" #actions>
        <RouterLink class="secondary-link" :to="`/edit?id=${id}`"><Pencil :size="17" />编辑</RouterLink>
        <LsButton variant="danger" :disabled="routeAccess.restricted.value" :disabled-reason="routeAccess.reason.value" @click="confirmDelete"><template #icon><Trash2 :size="17" /></template>删除</LsButton>
      </template>
    </LsPageHeader>
    <LsInlineError v-if="!id && !routeAccess.restricted.value" message="缺少流水 ID。" />
    <LsInlineError v-if="remove.isError.value" :message="friendlyError(remove.error.value)" />
    <LsAsyncState v-if="!routeAccess.restricted.value && query.isError.value" state="error" title="暂时无法读取流水详情" :description="friendlyError(query.error.value)" />
    <LsAsyncState v-else-if="!routeAccess.restricted.value && query.isPending.value" state="loading" :rows="5" />
    <template v-else-if="routeAccess.restricted.value">
      <LsPanel><div class="summary"><div><span>流水类型</span><strong class="ls-tabular">-</strong><small>-</small></div><p>-</p></div></LsPanel>
      <LsPanel><div class="facts"><div><span>接单人</span><strong>-</strong></div><div><span>发单人</span><strong>-</strong></div><div><span>客服</span><strong>-</strong></div><div><span>顾客</span><strong>-</strong></div></div></LsPanel>
      <section class="breakdown"><LsPanel><article><LsSectionHeader title="支付构成" description="顾客本次实际支付方式" :heading-level="3" /><dl><div><dt>现款</dt><dd>-</dd></div><div><dt>预存款</dt><dd>-</dd></div><div class="total"><dt>合计</dt><dd>-</dd></div></dl></article></LsPanel><LsPanel><article><LsSectionHeader title="成本与分成" description="本笔流水的归属结果" :heading-level="3" /><dl><div><dt>成本</dt><dd>-</dd></div><div><dt>接单人</dt><dd>-</dd></div><div><dt>发单人</dt><dd>-</dd></div><div><dt>客服</dt><dd>-</dd></div><div><dt>团队</dt><dd>-</dd></div></dl></article></LsPanel></section>
    </template>
    <template v-else-if="query.data.value">
      <LsPanel><div class="summary">
        <div><span>{{ transactionType(query.data.value.type) }}</span><strong class="ls-tabular">{{ money(query.data.value.total_price) }}</strong><small>{{ dateTime(query.data.value.trans_at) }}</small></div>
        <p>{{ query.data.value.memo || '这笔流水没有备注。' }}</p>
      </div></LsPanel>
      <LsPanel><div class="facts">
        <div><span>接单人</span><strong>{{ entityName(query.data.value.handler, query.data.value.handler_entity_id) }}</strong></div>
        <div><span>发单人</span><strong>{{ query.data.value.sender_entity_id ? entityName(query.data.value.sender, query.data.value.sender_entity_id) : '—' }}</strong></div>
        <div><span>客服</span><strong>{{ query.data.value.cs_entity_id ? entityName(query.data.value.cs, query.data.value.cs_entity_id) : '—' }}</strong></div>
        <div><span>顾客</span><strong>{{ customerName(query.data.value.customer, query.data.value.customer_id) }}</strong></div>
      </div></LsPanel>
      <section class="breakdown">
        <LsPanel><article><LsSectionHeader title="支付构成" description="顾客本次实际支付方式" :heading-level="3" /><dl><div><dt>现款</dt><dd>{{ money(query.data.value.cash) }}</dd></div><div><dt>预存款</dt><dd>{{ money(query.data.value.prepaid) }}</dd></div><div class="total"><dt>合计</dt><dd>{{ money(Number(query.data.value.cash) + Number(query.data.value.prepaid)) }}</dd></div></dl></article></LsPanel>
        <LsPanel><article><LsSectionHeader title="成本与分成" description="本笔流水的归属结果" :heading-level="3" /><dl><div><dt>成本</dt><dd>{{ money(query.data.value.cost) }}</dd></div><div><dt>接单人</dt><dd>{{ money(query.data.value.handler_cut) }}</dd></div><div><dt>发单人</dt><dd>{{ money(query.data.value.sender_cut) }}</dd></div><div><dt>客服</dt><dd>{{ money(query.data.value.cs_cut) }}</dd></div><div><dt>团队</dt><dd>{{ money(query.data.value.team_cut) }}</dd></div></dl></article></LsPanel>
      </section>
    </template>
  </div>
</template>

<style scoped>
.detail-view{display:grid;gap:1.25rem}.summary{display:flex;align-items:center;justify-content:space-between;gap:2rem}.summary>div{display:grid}.summary span,.facts span{color:var(--muted-ink);font-size:.78rem}.summary strong{font-size:2rem;line-height:1.2}.summary small{margin-top:.35rem;color:var(--muted-ink)}.summary p{max-width:46ch;margin:0;color:var(--text-secondary);font-size:.875rem}.facts{display:grid;grid-template-columns:repeat(4,1fr)}.facts>div{display:grid;gap:.2rem;padding:1rem;border-right:1px solid var(--line)}.facts>div:last-child{border-right:0}.breakdown{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}.breakdown dl{margin:1rem 0 0}.breakdown dl div{display:flex;justify-content:space-between;gap:1rem;padding:.65rem 0;border-bottom:1px solid var(--line)}.breakdown dl div:last-child{border-bottom:0}.breakdown dt{color:var(--muted-ink)}.breakdown dd{margin:0;font-variant-numeric:tabular-nums;font-weight:700}.breakdown .total{color:var(--ink);font-weight:700}@media(max-width:700px){.summary{align-items:flex-start;flex-direction:column;gap:1rem}.facts{grid-template-columns:repeat(2,1fr)}.facts>div:nth-child(2){border-right:0}.facts>div:nth-child(-n+2){border-bottom:1px solid var(--line)}.breakdown{grid-template-columns:1fr}}
</style>
