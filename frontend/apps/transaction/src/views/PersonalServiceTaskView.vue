<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import { quantityScaleForStep } from '@lostsky/shared/quantity'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsDescriptionList from '@lostsky/ui/components/LsDescriptionList.vue'
import LsEntityIdentity from '@lostsky/ui/components/LsEntityIdentity.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsStatusTag from '@lostsky/ui/components/LsStatusTag.vue'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { NInput, NInputNumber } from 'naive-ui'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ServiceCompletionFields from '../components/ServiceCompletionFields.vue'
import type { ServiceAssignmentOffer, ServiceField, ServiceRedemption, ServiceRedemptionResource } from '../types'
import { serviceStatusCode } from '../lib'

const route = useRoute()
const router = useRouter()
const id = computed(() => Number(route.params.id))
const kind = computed(() => String(route.meta.personalTask ?? 'assigned') as 'offer' | 'available' | 'assigned')
const reason = ref('')
const claimValues = ref<Record<number, Record<number, unknown>>>({})
const claimQuantity = ref<number | null>(null)
const endpoint = computed(() => kind.value === 'offer'
  ? `/personal/service-offers/${id.value}`
  : kind.value === 'available'
    ? `/personal/services/available/${id.value}`
    : `/personal/services/${id.value}`)
const query = useQuery({ queryKey: computed(() => ['personal-service-task', kind.value, id.value]), queryFn: () => api.get<ServiceAssignmentOffer | ServiceRedemption>(endpoint.value) })
const action = useMutation({
  mutationFn: (input: { suffix: string; body?: Record<string, unknown>; opensTask?: boolean }) => {
    const base = kind.value === 'offer' ? `/personal/service-offers/${id.value}` : `/personal/services/${id.value}`
    return api.post<{ id?: number }>(`${base}/${input.suffix}`, input.body ?? {}).then(result => ({ result, opensTask: input.opensTask }))
  },
  onSuccess: ({ result, opensTask }) => opensTask && result?.id
    ? router.push(`/personal/services/${result.id}`)
    : router.push('/personal/services'),
})
const row = computed(() => query.data.value as (ServiceAssignmentOffer & ServiceRedemption) | undefined)
const customerName = computed(() => (row.value?.customer as any)?.profile?.name || (row.value?.customer as any)?.name || '顾客')
const quantityStep = computed(() => Number(row.value?.entitlement?.quantity_step || 1))
const quantityScale = computed(() => quantityScaleForStep(row.value?.entitlement?.quantity_step))
const maxQuantity = computed(() => Number(row.value?.quantity || 0))
const resourceCount = computed(() => Math.round((kind.value === 'available' ? Number(claimQuantity.value || 0) : maxQuantity.value) / quantityStep.value))
const resources = computed<ServiceRedemptionResource[]>(() => {
  const available = row.value?.redemption_resources?.length
    ? row.value.redemption_resources
    : [{ index: 1, quantity: String(row.value?.quantity ?? 1), redemption_fields: row.value?.redemption_fields ?? [] }]
  return available.slice(0, Math.max(0, resourceCount.value))
})
const resourceFields = (resource: ServiceRedemptionResource, stage: 'customer' | 'manager') =>
  resource.redemption_fields.filter(field => field.fill_stage === stage)
const quantityLabel = computed(() => `${maxQuantity.value.toFixed(quantityScale.value)} ${row.value?.entitlement?.unit_name || '单位'}`)
const taskSource = computed(() => kind.value === 'offer' ? '指定邀请' : kind.value === 'available' ? '公开接单' : '已结单任务')
const claimStatus = computed(() => kind.value === 'offer'
  ? { label: '待确认', type: 'warning' as const }
  : kind.value === 'available'
    ? { label: '待接单', type: 'default' as const }
    : { label: '已结单', type: 'info' as const })
const rowStatus = computed(() => serviceStatusCode(row.value?.status_code ?? row.value?.status))
const redemptionStatus = computed(() => rowStatus.value === 3
  ? { label: '已核销', type: 'success' as const }
  : { label: '待核销', type: 'warning' as const })
const money = (value: unknown) => `¥${Number(value || 0).toFixed(2)}`
const dateTime = (value: number | null | undefined) => value ? new Date(value * 1000).toLocaleString() : '—'
const handlerName = computed(() => kind.value === 'assigned' ? row.value?.handler?.name || '当前 Entity' : '—')
const hasValue = (value: unknown) => Array.isArray(value) ? value.length > 0 : typeof value === 'string' ? value.trim() !== '' : value !== null && value !== undefined && value !== ''
const storedValue = (field: ServiceField) => {
  if (!field.value || typeof field.value !== 'object' || Array.isArray(field.value)) return field.value
  return Object.values(field.value as Record<string, unknown>).find(value => value !== null && value !== '')
}
const needsLegacyClaimFields = computed(() => kind.value === 'assigned' && resources.value.some(resource =>
  resourceFields(resource, 'manager').some(field => field.is_required && !hasValue(storedValue(field)))))
const claimReady = computed(() => {
  const fieldsReady = resources.value.every(resource => resourceFields(resource, 'manager').every(field =>
    !field.is_required || hasValue(claimValues.value[resource.index]?.[field.id])))
  if (kind.value !== 'available') return fieldsReady
  return fieldsReady && claimQuantity.value !== null && claimQuantity.value >= quantityStep.value && claimQuantity.value <= maxQuantity.value
})
const fieldValue = (field: ServiceField) => {
  if (field.value === null || field.value === undefined || field.value === '') return '—'
  if (Array.isArray(field.value)) return field.value.join('、') || '—'
  if (typeof field.value === 'object') {
    const item = Object.values(field.value as Record<string, unknown>).find(value => value !== null && value !== '')
    return item === undefined ? '—' : String(item)
  }
  return String(field.value)
}
watch([row, kind], ([current, currentKind]) => {
  if (!current || currentKind !== 'available') return
  claimQuantity.value = Math.min(quantityStep.value, Number(current.quantity))
}, { immediate: true })
watch(resources, current => {
  const next: Record<number, Record<number, unknown>> = {}
  current.forEach(resource => {
    next[resource.index] = { ...(claimValues.value[resource.index] ?? {}) }
    resourceFields(resource, 'manager').forEach(field => {
      const value = storedValue(field)
      if (!hasValue(next[resource.index][field.id]) && hasValue(value)) next[resource.index][field.id] = value
    })
  })
  claimValues.value = next
}, { immediate: true })
const resourcePayload = () => resources.value.map(resource => claimValues.value[resource.index] ?? {})
const acceptOffer = () => action.mutate({ suffix: 'accept', body: { field_values: resourcePayload() }, opensTask: true })
const claimTask = () => action.mutate({ suffix: 'claim', body: { quantity: claimQuantity.value, field_values: resourcePayload() }, opensTask: true })
const completeTask = () => action.mutate({suffix:'complete', body: needsLegacyClaimFields.value ? { field_values: resourcePayload() } : {}})
</script>

<template>
  <div class="personal-task-page">
    <LsPageHeader :title="row?.service?.name || '接单任务'" :description="kind === 'offer' ? '顾客指定邀请' : kind === 'available' ? '公开接单任务' : '我的接单任务'" back-to="/personal/services" back-label="返回接单工作台" />
    <LsAsyncState v-if="query.isPending.value" state="loading" :rows="5" />
    <LsAsyncState v-else-if="query.isError.value" state="error" title="无法读取任务" :description="friendlyError(query.error.value)" />
    <LsPanel v-else-if="row" class="task-panel">
      <div class="task-overview">
        <div class="overview-heading">
          <LsEntityIdentity type="customer" :name="customerName" />
          <div class="state-cluster">
            <div><span>接单</span><LsStatusTag :label="claimStatus.label" :type="claimStatus.type" /></div>
            <div><span>核销</span><LsStatusTag :label="redemptionStatus.label" :type="redemptionStatus.type" /></div>
          </div>
        </div>
        <dl class="summary-strip">
          <div><dt>任务编号</dt><dd>#{{ row.id }}</dd></div>
          <div><dt>履约数量</dt><dd>{{ quantityLabel }}</dd></div>
          <div><dt>预计分成</dt><dd>{{ money(row.handler_cut) }}</dd></div>
          <div><dt>任务来源</dt><dd>{{ taskSource }}</dd></div>
          <div><dt>接单人</dt><dd>{{ handlerName }}</dd></div>
        </dl>
      </div>

      <section v-if="kind === 'available'" class="claim-quantity-section">
        <LsField label="本次接单数量" for-id="claim-quantity" required :hint="`最多可接 ${quantityLabel}；每个最小步长是一份独立履约资源。`">
          <NInputNumber id="claim-quantity" v-model:value="claimQuantity" :min="quantityStep" :max="maxQuantity" :step="quantityStep" :precision="quantityScale" />
        </LsField>
      </section>

      <div class="resource-list">
        <section v-for="resource in resources" :key="resource.index" class="resource-item">
          <div class="resource-heading"><div><h2>第 {{ resource.index }} 份履约资源</h2><p>{{ resource.quantity }} {{ row.entitlement?.unit_name || '单位' }} · 字段独立保存</p></div></div>
          <div class="field-columns">
            <section class="field-pane">
              <div class="detail-heading"><h3>顾客字段</h3><p>发起任务时提交</p></div>
              <p v-if="!resourceFields(resource, 'customer').length" class="empty">顾客未填写额外字段。</p>
              <LsDescriptionList v-else><template v-for="field in resourceFields(resource, 'customer')" :key="field.id"><dt>{{ field.name }}</dt><dd>{{ fieldValue(field) }}</dd></template></LsDescriptionList>
            </section>
            <section class="field-pane">
              <div class="detail-heading"><h3>接单字段</h3><p>{{ kind === 'assigned' && !needsLegacyClaimFields ? '接单时提交' : '登记信息并接单核销' }}</p></div>
              <p v-if="!resourceFields(resource, 'manager').length" class="empty">该服务没有配置接单字段。</p>
              <ServiceCompletionFields
                v-else-if="kind === 'offer' || kind === 'available' || needsLegacyClaimFields"
                v-model="claimValues[resource.index]"
                :fields="resourceFields(resource, 'manager')"
                :id-prefix="`personal-resource-${resource.index}`"
              />
              <LsDescriptionList v-else><template v-for="field in resourceFields(resource, 'manager')" :key="field.id"><dt>{{ field.name }}</dt><dd>{{ fieldValue(field) }}</dd></template></LsDescriptionList>
            </section>
          </div>
        </section>
      </div>
      <div v-if="row.memo" class="memo-block"><strong>顾客备注</strong><p>{{ row.memo }}</p></div>

      <div v-if="kind === 'offer' || kind === 'available'" class="actions task-actions">
        <LsButton v-if="kind === 'offer'" variant="secondary" :loading="action.isPending.value" @click="action.mutate({ suffix: 'reject', body: { reason } })">拒绝邀请</LsButton>
        <LsButton v-if="kind === 'offer'" :disabled="!claimReady" :loading="action.isPending.value" @click="acceptOffer">填写并接受邀请</LsButton>
        <LsButton v-else :disabled="!claimReady" :loading="action.isPending.value" @click="claimTask">填写并进行接单</LsButton>
      </div>

      <template v-if="kind === 'assigned' && rowStatus === 2">
        <section class="completion-section"><div class="detail-heading"><h2>完成核销</h2><p>{{ needsLegacyClaimFields ? '补齐旧任务的接单字段后即可核销。' : '接单字段已保存，确认服务完成即可核销。' }}</p></div><LsButton :disabled="needsLegacyClaimFields && !claimReady" :loading="action.isPending.value" @click="completeTask">确认已核销</LsButton></section>
        <div class="return-form"><LsField label="退回原因" for-id="personal-return-reason" required><NInput id="personal-return-reason" v-model:value="reason" type="textarea" maxlength="500" show-count placeholder="说明无法继续履约的原因" /></LsField><LsButton variant="secondary" :disabled="!reason.trim()" :loading="action.isPending.value" @click="action.mutate({ suffix: 'return', body: { reason } })">退回公开接单池</LsButton></div>
      </template>
      <section v-else-if="kind === 'assigned' && rowStatus === 3" class="completed-section"><div><LsStatusTag label="已核销" type="success" /><strong>任务已经完成核销</strong><p>核销时间：{{ dateTime(row.completed_at) }}</p></div></section>
      <p v-if="action.isError.value" class="error" role="alert">{{ friendlyError(action.error.value) }}</p>
    </LsPanel>
  </div>
</template>

<style scoped>
.personal-task-page{display:grid;gap:1rem}.task-panel{display:grid;gap:0}.task-overview{display:grid;gap:1.25rem;padding-bottom:1.5rem}.overview-heading{display:flex;align-items:center;justify-content:space-between;gap:1.5rem}.state-cluster{display:flex;align-items:center;gap:1.25rem;flex-wrap:wrap}.state-cluster>div{display:flex;align-items:center;gap:.5rem}.state-cluster span{color:var(--muted-ink);font-size:.78rem}.summary-strip{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));margin:0;overflow:hidden;background:var(--cloud);border-radius:var(--radius-sm)}.summary-strip>div{min-width:0;padding:1rem}.summary-strip>div+div{border-left:1px solid var(--line)}.summary-strip dt{color:var(--muted-ink);font-size:.75rem}.summary-strip dd{margin:.3rem 0 0;font-size:.92rem;font-weight:650;line-height:1.4;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}.claim-quantity-section{padding:1.25rem 0;border-top:1px solid var(--line)}.resource-list{display:grid}.resource-item{display:grid;gap:1rem;padding:1.25rem 0;border-top:1px solid var(--line)}.resource-heading h2,.resource-heading p{margin:0}.resource-heading h2{font-size:1rem}.resource-heading p{margin-top:.25rem;color:var(--muted-ink);font-size:.8rem}.field-columns{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));overflow:hidden;border:1px solid var(--line);border-radius:var(--radius-sm)}.field-pane{min-width:0;display:grid;align-content:start;gap:1rem;padding:1.5rem}.field-pane+ .field-pane{border-left:1px solid var(--line)}.detail-heading{display:grid;gap:.25rem}.detail-heading h3,.detail-heading p,.task-panel p{margin:0}.detail-heading h3{font-size:.95rem}.detail-heading p,.empty{color:var(--muted-ink);font-size:.8rem;line-height:1.5}.memo-block{display:grid;gap:.35rem;padding:1rem 0;border-top:1px solid var(--line)}.memo-block strong{font-size:.82rem}.memo-block p{line-height:1.65;overflow-wrap:anywhere}.actions{display:flex;justify-content:flex-end;gap:.5rem;margin-top:.25rem}.task-actions{padding:1.25rem 0;border-top:1px solid var(--line)}.completion-section{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:end;gap:1rem;padding:1.25rem 0;border-bottom:1px solid var(--line)}.return-form{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:end;gap:1rem;padding:1.25rem 0}.completed-section{padding:1.25rem 0}.completed-section>div{display:flex;align-items:center;gap:.75rem;flex-wrap:wrap;padding:1rem;background:var(--cloud);border-radius:var(--radius-sm)}.completed-section strong{font-size:.95rem}.completed-section p{width:100%;color:var(--muted-ink);font-size:.84rem}.error{margin:1rem 0 0;color:var(--danger)}
@media(max-width:960px){.summary-strip{grid-template-columns:repeat(3,minmax(0,1fr))}.summary-strip>div:nth-child(4){border-left:0}.summary-strip>div:nth-child(n+4){border-top:1px solid var(--line)}}
@media(max-width:760px){.overview-heading{align-items:flex-start;flex-direction:column;gap:1rem}.summary-strip{grid-template-columns:1fr}.summary-strip>div+div,.summary-strip>div:nth-child(4){border-top:1px solid var(--line);border-left:0}.field-columns{grid-template-columns:1fr}.field-pane+ .field-pane{border-top:1px solid var(--line);border-left:0}.field-pane{padding:1.25rem 0}.completion-section,.return-form{grid-template-columns:1fr}.actions{display:grid;grid-template-columns:1fr}.actions>*{width:100%}.completion-section>:last-child,.return-form>:last-child{width:100%}}
@media(max-width:420px){.state-cluster{align-items:flex-start;flex-direction:column;gap:.65rem}}
</style>
