<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsEntityIdentity from '@lostsky/ui/components/LsEntityIdentity.vue'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { NInput } from 'naive-ui'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { ServiceAssignmentOffer, ServiceField, ServiceRedemption } from '../types'

const route = useRoute()
const router = useRouter()
const id = computed(() => Number(route.params.id))
const kind = computed(() => String(route.meta.personalTask ?? 'assigned') as 'offer' | 'available' | 'assigned')
const reason = ref('')
const endpoint = computed(() => kind.value === 'offer'
  ? `/personal/service-offers/${id.value}`
  : kind.value === 'available'
    ? `/personal/services/available/${id.value}`
    : `/personal/services/${id.value}`)
const query = useQuery({ queryKey: computed(() => ['personal-service-task', kind.value, id.value]), queryFn: () => api.get<ServiceAssignmentOffer | ServiceRedemption>(endpoint.value) })
const action = useMutation({
  mutationFn: (input: { suffix: string; body?: Record<string, unknown> }) => {
    const base = kind.value === 'offer' ? `/personal/service-offers/${id.value}` : `/personal/services/${id.value}`
    return api.post(`${base}/${input.suffix}`, input.body ?? {})
  },
  onSuccess: () => router.push('/personal/services'),
})
const row = computed(() => query.data.value as (ServiceAssignmentOffer & ServiceRedemption) | undefined)
const customerName = computed(() => (row.value?.customer as any)?.profile?.name || (row.value?.customer as any)?.name || 'Customer')
const quantityLabel = computed(() => `${Number(row.value?.quantity || 0).toFixed(Number(row.value?.entitlement?.quantity_scale ?? 0))} ${row.value?.entitlement?.unit_name || '单位'}`)
const money = (value: unknown) => `¥${Number(value || 0).toFixed(2)}`
const fieldValue = (field: ServiceField) => {
  if (field.value === null || field.value === undefined || field.value === '') return '—'
  if (Array.isArray(field.value)) return field.value.join('、') || '—'
  if (typeof field.value === 'object') {
    const item = Object.values(field.value as Record<string, unknown>).find(value => value !== null && value !== '')
    return item === undefined ? '—' : String(item)
  }
  return String(field.value)
}
</script>

<template>
  <div class="personal-task-page">
    <LsPageHeader :title="row?.service?.name || '接单任务'" :description="kind==='offer'?'Customer 指定邀请':kind==='available'?'公开召唤任务':'我的核销任务'" back-to="/personal/services" back-label="返回接单工作台" />
    <LsAsyncState v-if="query.isPending.value" state="loading" :rows="5" />
    <LsAsyncState v-else-if="query.isError.value" state="error" title="无法读取任务" :description="friendlyError(query.error.value)" />
    <LsPanel v-else-if="row" class="task-panel">
      <div class="task-summary">
        <LsEntityIdentity type="customer" :name="customerName" />
        <dl><div><dt>履约数量</dt><dd>{{ quantityLabel }}</dd></div><div><dt>预计接单分成</dt><dd>{{ money(row.handler_cut) }}</dd></div><div><dt>任务来源</dt><dd>{{ kind==='offer'?'指定邀请':kind==='available'?'公开召唤':'已接取任务' }}</dd></div></dl>
      </div>
      <section><h2>核销字段</h2><p v-if="!row.redemption_fields?.length" class="empty">Customer 未填写额外核销字段。</p><dl v-else class="field-list"><div v-for="field in row.redemption_fields" :key="field.id"><dt>{{ field.name }}</dt><dd>{{ fieldValue(field) }}</dd></div></dl></section>
      <section v-if="row.memo"><h2>Customer 备注</h2><p>{{ row.memo }}</p></section>
      <div v-if="kind==='offer'" class="actions"><LsButton variant="secondary" :loading="action.isPending.value" @click="action.mutate({suffix:'reject',body:{reason}})">拒绝</LsButton><LsButton :loading="action.isPending.value" @click="action.mutate({suffix:'accept'})">接受邀请</LsButton></div>
      <div v-else-if="kind==='available'" class="actions"><LsButton :loading="action.isPending.value" @click="action.mutate({suffix:'claim'})">领取公开任务</LsButton></div>
      <div v-else-if="row.status===2" class="return-form"><NInput v-model:value="reason" type="textarea" maxlength="500" show-count placeholder="填写主动退回原因" /><LsButton variant="secondary" :disabled="!reason.trim()" :loading="action.isPending.value" @click="action.mutate({suffix:'return',body:{reason}})">退回公开接单池</LsButton></div>
      <p v-if="action.isError.value" class="error" role="alert">{{ friendlyError(action.error.value) }}</p>
    </LsPanel>
  </div>
</template>

<style scoped>
.personal-task-page{display:grid;gap:1rem}.task-panel{display:grid;gap:1.25rem}.task-summary{display:grid;grid-template-columns:minmax(12rem,1fr) minmax(20rem,2fr);gap:1rem;align-items:center}.task-summary>dl,.field-list{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.75rem;margin:0}.task-summary dl>div,.field-list>div{padding:.8rem;background:var(--cloud);border-radius:8px}.task-panel section{display:grid;gap:.75rem;padding-top:1rem;border-top:1px solid var(--border)}.task-panel h2,.task-panel p{margin:0}.task-panel h2{font-size:1rem}.task-panel dt{color:var(--muted-ink);font-size:.78rem}.task-panel dd{margin:.2rem 0 0;overflow-wrap:anywhere}.actions{display:flex;justify-content:flex-end;gap:.5rem}.return-form{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:end;gap:.75rem}.empty{color:var(--muted-ink)}.error{color:var(--danger)}
@media(max-width:760px){.task-summary{grid-template-columns:1fr}.task-summary>dl,.field-list{grid-template-columns:1fr}.return-form{grid-template-columns:1fr}.actions>*{flex:1}}
</style>
