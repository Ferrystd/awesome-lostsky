<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import PersonalServiceLists from '../components/PersonalServiceLists.vue'

const route = useRoute()
const client = useQueryClient()
const section = computed(() => String(route.meta.personalSection ?? 'transactions'))
const endpoint = computed(() => ({ transactions: '/personal/transactions', stats: '/personal/stats', services: '/personal/services', bindings: '/personal/bindings' })[section.value] || '/personal/transactions')
const title = computed(() => ({ transactions: '与我相关的流水', stats: '我的业绩', services: '我的核销', bindings: '我的客户协作 / 发单绑定' })[section.value] || '个人记账')
const query = useQuery({ queryKey: computed(() => ['transaction-personal', section.value]), queryFn: () => api.get<any>(endpoint.value) })
const rows = computed(() => Array.isArray(query.data.value) ? query.data.value : query.data.value?.list ?? [])
const available = computed(() => section.value === 'services' ? query.data.value?.available ?? [] : [])
const offers = computed(() => section.value === 'services' ? query.data.value?.offers ?? [] : [])
const actionError = ref('')
const action = useMutation({
  mutationFn: (input: { path: string; body?: Record<string, unknown> }) => api.post(input.path, input.body ?? {}),
  onSuccess: async () => {
    actionError.value = ''
    await client.invalidateQueries({ queryKey: ['transaction-personal', 'services'] })
  },
  onError: error => actionError.value = friendlyError(error),
})
const money = (value: unknown) => `¥${Number(value || 0).toFixed(2)}`
</script>

<template><div class="personal-workspace"><LsPageHeader :title="title" :description="section==='services'?'确认指定邀请、领取公开任务，并管理当前 Entity 已接取的核销。':'范围只依据当前 acting_entity 的参与、归属、绑定或处理关系，由服务端固定。'"/><LsAsyncState v-if="query.isPending.value" state="loading" :rows="5"/><LsAsyncState v-else-if="query.isError.value" state="error" title="暂时无法读取" :description="friendlyError(query.error.value)"/><LsPanel v-else-if="section==='stats'"><dl class="stats"><div><dt>相关流水</dt><dd>{{ query.data.value?.total_count ?? 0 }}</dd></div><div><dt>个人业绩</dt><dd>{{ money(query.data.value?.performance_total) }}</dd></div><div><dt>接单分配</dt><dd>{{ money(query.data.value?.handler_cut) }}</dd></div><div><dt>发单分配</dt><dd>{{ money(query.data.value?.sender_cut) }}</dd></div><div><dt>客服分配</dt><dd>{{ money(query.data.value?.cs_cut) }}</dd></div><div><dt>核销次数</dt><dd>{{ query.data.value?.redemption_count ?? 0 }}</dd></div></dl></LsPanel><template v-else-if="section==='services'"><PersonalServiceLists :offers="offers" :available="available" :assigned="rows" :acting="action.isPending.value" @accept-offer="id=>action.mutate({path:`/personal/service-offers/${id}/accept`})" @reject-offer="id=>action.mutate({path:`/personal/service-offers/${id}/reject`})" @claim="id=>action.mutate({path:`/personal/services/${id}/claim`})" @return-task="(id,reason)=>action.mutate({path:`/personal/services/${id}/return`,body:{reason}})"/><p v-if="actionError" class="action-error" role="alert">{{ actionError }}</p></template><template v-else><LsEmptyState v-if="!rows.length" title="暂无相关记录" description="当前 Entity 参与业务后，记录会显示在这里。"/><div v-else class="record-list"><article v-for="(row,index) in rows" :key="row.id ?? index"><strong>{{ row.product_name || row.customer?.profile?.name || row.customer?.nickname || `记录 #${row.id ?? index + 1}` }}</strong><span v-if="section==='transactions'">{{ money(row.total_price) }}</span><span v-else>{{ row.customer?.profile?.name || row.customer?.nickname || '客户绑定' }}</span></article></div></template></div></template>
<style scoped>.personal-workspace{display:grid;gap:1rem}.record-list{overflow:hidden;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md)}.record-list article{min-height:64px;display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.8rem 1rem;border-bottom:1px solid var(--border)}.record-list article:last-child{border-bottom:0}.record-list span{color:var(--muted-ink)}.stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem;margin:0}.stats div{display:grid;gap:.25rem;padding:1rem;background:var(--cloud);border-radius:8px}.stats dt{color:var(--muted-ink);font-size:.78rem}.stats dd{margin:0;font-size:1.2rem;font-weight:750}.action-error{margin:0;color:var(--danger)}@media(max-width:640px){.stats{grid-template-columns:repeat(2,minmax(0,1fr))}.record-list article{align-items:flex-start;flex-direction:column}}</style>
