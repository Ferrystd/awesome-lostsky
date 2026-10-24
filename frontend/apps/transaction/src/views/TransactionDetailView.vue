<script setup lang="ts">
import LsFormSection from '@lostsky/ui/components/LsFormSection.vue'
import LsDescriptionList from '@lostsky/ui/components/LsDescriptionList.vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import { api, friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsDetailPage from '@lostsky/ui/components/LsDetailPage.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsSectionHeader from '@lostsky/ui/components/LsSectionHeader.vue'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { Pencil, Trash2 } from '@lucide/vue'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { customerName, dateTime, entityName, money, transactionType } from '../lib'
import { loadWorkspaceAccess } from '../lib/workspace-access'
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
const accessQuery = useQuery({ queryKey: ['transaction-workspace-access'], queryFn: () => loadWorkspaceAccess() })
const remove = useMutation({
  mutationFn: () => api.post(`/transaction/${id.value}/delete`, { expected_entity_id: accessQuery.data.value?.identity?.entity_id }),
  onSuccess: async () => {
    await client.invalidateQueries({ queryKey: ['transactions'] })
    await router.push('/')
  },
})
function confirmDelete() {
  if (remove.isPending.value || !accessQuery.data.value?.identity?.entity_id) return
  if (confirm('确认删除这笔流水？如使用了预存款，系统会同步退款。')) remove.mutate()
}
</script>

<template>
  <LsDetailPage aside-label="流水已保存概况" title="流水详情" description="核对参与方、支付构成与分成结果。" :back-to="personal ? '/personal/transactions' : '/transactions'" :back-label="personal ? '返回我的流水' : '返回流水列表'">
      <template v-if="!personal && (routeAccess.restricted.value || transactionType(query.data.value?.type) === '记账登记')" #actions>
        <LsPageLink :icon="Pencil" label="编辑" :to="`/edit?id=${id}`" />
        <LsButton variant="danger" :disabled="routeAccess.restricted.value || remove.isPending.value || !accessQuery.data.value?.identity?.entity_id" :disabled-reason="routeAccess.reason.value || (remove.isPending.value ? '正在删除流水' : '正在核对当前人员身份')" @click="confirmDelete"><template #icon><Trash2 :size="17" /></template>删除</LsButton>
      </template>
    <div class="detail-view">
      <LsInlineError v-if="!id && !routeAccess.restricted.value" message="缺少流水 ID。" />
      <LsInlineError v-if="remove.isError.value" :message="friendlyError(remove.error.value)" />
      <LsAsyncState v-if="!routeAccess.restricted.value && query.isError.value" state="error" title="暂时无法读取流水详情" :description="friendlyError(query.error.value)" />
      <LsAsyncState v-else-if="!routeAccess.restricted.value && query.isPending.value" state="loading" :rows="5" />
      <template v-else-if="routeAccess.restricted.value">
        <section class="breakdown"><LsPanel><article><LsSectionHeader title="支付构成" description="顾客本次实际支付方式" :heading-level="3" /><dl><div><dt>现款</dt><dd>-</dd></div><div><dt>预存款</dt><dd>-</dd></div><div class="total"><dt>合计</dt><dd>-</dd></div></dl></article></LsPanel><LsPanel><article><LsSectionHeader title="成本与分成" description="本笔流水的归属结果" :heading-level="3" /><dl><div><dt>成本</dt><dd>-</dd></div><div><dt>接单人</dt><dd>-</dd></div><div><dt>发单人</dt><dd>-</dd></div><div><dt>客服</dt><dd>-</dd></div><div><dt>团队</dt><dd>-</dd></div></dl></article></LsPanel></section>
      </template>
      <template v-else-if="query.data.value">
        <section class="breakdown">
          <LsPanel><article><LsSectionHeader title="支付构成" description="顾客本次实际支付方式" :heading-level="3" /><dl><div><dt>现款</dt><dd>{{ money(query.data.value.cash) }}</dd></div><div><dt>预存款</dt><dd>{{ money(query.data.value.prepaid) }}</dd></div><div class="total"><dt>合计</dt><dd>{{ money(Number(query.data.value.cash) + Number(query.data.value.prepaid)) }}</dd></div></dl></article></LsPanel>
          <LsPanel><article><LsSectionHeader title="成本与分成" description="本笔流水的归属结果" :heading-level="3" /><dl><div><dt>成本</dt><dd>{{ money(query.data.value.cost) }}</dd></div><div><dt>接单人</dt><dd>{{ money(query.data.value.handler_cut) }}</dd></div><div><dt>发单人</dt><dd>{{ money(query.data.value.sender_cut) }}</dd></div><div><dt>客服</dt><dd>{{ money(query.data.value.cs_cut) }}</dd></div><div><dt>团队</dt><dd>{{ money(query.data.value.team_cut) }}</dd></div></dl></article></LsPanel>
        </section>
      </template>
    </div>
    <template #aside>
      <LsFormSection title="流水概况" description="已保存的流水记录。">
        <p v-if="routeAccess.restricted.value">暂无可查看的流水资料。</p>
        <p v-else-if="query.isPending.value">正在读取流水…</p>
        <p v-else-if="query.isError.value">流水读取失败。</p>
        <LsDescriptionList v-else-if="query.data.value">
          <dt>类型</dt><dd>{{ transactionType(query.data.value.type) }}</dd>
          <dt>总价</dt><dd>{{ money(query.data.value.total_price) }}</dd>
          <dt>时间</dt><dd>{{ dateTime(query.data.value.trans_at) }}</dd>
          <dt>接单人</dt><dd>{{ entityName(query.data.value.handler, query.data.value.handler_entity_id) }}</dd>
          <dt>发单人</dt><dd>{{ query.data.value.sender_entity_id ? entityName(query.data.value.sender, query.data.value.sender_entity_id) : '—' }}</dd>
          <dt>客服</dt><dd>{{ query.data.value.cs_entity_id ? entityName(query.data.value.cs, query.data.value.cs_entity_id) : '—' }}</dd>
          <dt>顾客</dt><dd>{{ customerName(query.data.value.customer, query.data.value.customer_id) }}</dd>
          <dt>备注</dt><dd>{{ query.data.value.memo || '无' }}</dd>
        </LsDescriptionList>
        <p v-else>暂无流水资料。</p>
      </LsFormSection>
    </template>
  </LsDetailPage>
</template>

<style scoped>
.detail-view{min-width:0;display:grid;gap:1.5rem}.breakdown{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,16rem),1fr));gap:1rem}.breakdown dl{margin:1rem 0 0}.breakdown dl div{display:flex;justify-content:space-between;gap:1rem;padding:.65rem 0;border-bottom:1px solid var(--line)}.breakdown dl div:last-child{border-bottom:0}.breakdown dt{color:var(--muted-ink)}.breakdown dd{margin:0;font-variant-numeric:tabular-nums;font-weight:700}.breakdown .total{color:var(--ink);font-weight:700}
</style>
