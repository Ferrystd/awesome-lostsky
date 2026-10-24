<script setup lang="ts">
import LsFormSection from '@lostsky/ui/components/LsFormSection.vue'
import { api, friendlyError } from '@lostsky/api/client'
import { formatPermissionDenied } from '@lostsky/api/error-format'
import { quantityScaleForStep } from '@lostsky/shared/quantity'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsDescriptionList from '@lostsky/ui/components/LsDescriptionList.vue'
import LsEntityIdentity from '@lostsky/ui/components/LsEntityIdentity.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsFormActions from '@lostsky/ui/components/LsFormActions.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsDetailPage from '@lostsky/ui/components/LsDetailPage.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsStatusTag from '@lostsky/ui/components/LsStatusTag.vue'
import { feedback } from '@lostsky/ui/feedback'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { NImage, NInput, NInputNumber, NSelect, useDialog } from 'naive-ui'
import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { customerName, dateTime, entityName, serviceStatusCode, serviceStatusName } from '../lib'
import type { ServiceField, ServiceRedemption, ServiceRedemptionResource } from '../types'
import ServiceCompletionFields from '../components/ServiceCompletionFields.vue'

const route = useRoute()
const routeAccess = useRouteAccess()
const id = computed(() => Number(route.params.id))
const client = useQueryClient()
const dialog = useDialog()
const cancelReason = ref('')
const reassignReason = ref('')
const rejectReason = ref('')
const handlerId = ref<number | null>(null)
const values = ref<Record<number, Record<number, unknown>>>({})
const fee = reactive<{
  name: string
  quantity: number | null
  unit_price: number | null
  cost: number | null
  memo: string
}>({ name: '', quantity: 1, unit_price: 0, cost: 0, memo: '' })
const query = useQuery({
  queryKey: computed(() => ['service-redemption', id.value]),
  queryFn: () => routeAccess.read(() => api.get<ServiceRedemption>(`/service/${id.value}`)),
  enabled: computed(() => !routeAccess.restricted.value),
})
const quantityScale = computed(() => quantityScaleForStep(query.data.value?.entitlement?.quantity_step))
const handlers = useQuery({
  queryKey: computed(() => ['service-redemption-handlers', id.value]),
  queryFn: () => api.get<Array<{ entity_id: number; subject: { id: number; name: string } }>>(`/service/${id.value}/handlers`),
  enabled: computed(() => !routeAccess.restricted.value && (query.data.value?.capabilities ? Boolean(query.data.value.capabilities.manage) : true)),
})
const handlerOptions = computed(() =>
  (handlers.data.value ?? []).map((item) => ({
    label: item.subject.name,
    value: item.entity_id,
  })),
)
const pending = computed(() => query.data.value?.cancel_requests?.find((item) => item.status === 1))
const pendingFee = computed(() => query.data.value?.adjustments?.some((item) => item.status === 1) ?? false)
const acceptedFee = computed(() => query.data.value?.adjustments?.some((item) => item.status === 2) ?? false)
const feeNumber = (value: number | null) => (typeof value === 'number' && Number.isFinite(value) ? value : 0)
const feeTotal = computed(() => Math.round(feeNumber(fee.quantity) * feeNumber(fee.unit_price) * 100) / 100)
const feeNet = computed(() => Math.round((feeTotal.value - feeNumber(fee.cost)) * 100) / 100)
const feeValid = computed(() => Boolean(fee.name.trim() && typeof fee.quantity === 'number' && Number.isFinite(fee.quantity) && fee.quantity > 0 && typeof fee.unit_price === 'number' && Number.isFinite(fee.unit_price) && fee.unit_price > 0 && typeof fee.cost === 'number' && Number.isFinite(fee.cost) && fee.cost >= 0 && fee.cost <= feeTotal.value))
const statusCode = computed(() => serviceStatusCode(query.data.value?.status_code ?? query.data.value?.status))
const resources = computed<ServiceRedemptionResource[]>(() =>
  query.data.value?.redemption_resources?.length
    ? query.data.value.redemption_resources
    : [
        {
          index: 1,
          quantity: String(query.data.value?.quantity ?? 1),
          redemption_fields: query.data.value?.redemption_fields ?? [],
        },
      ],
)
const canManage = computed(() => (query.data.value?.capabilities ? Boolean(query.data.value.capabilities.manage) : true))
const canApprove = computed(() => (query.data.value?.capabilities ? Boolean(query.data.value.capabilities.approve_cancel) : true))
const manageReason = formatPermissionDenied(['service.redemption.manage'])
const action = useMutation({
  mutationFn: (input: { path: string; body?: Record<string, unknown> }) => api.post(`/service/${id.value}/${input.path}`, input.body ?? {}),
  onSuccess: async (_data, input) => {
    feedback.success('核销任务已更新')
    cancelReason.value = ''
    reassignReason.value = ''
    rejectReason.value = ''
    if (input.path === 'adjustments')
      Object.assign(fee, {
        name: '',
        quantity: 1,
        unit_price: 0,
        cost: 0,
        memo: '',
      })
    await Promise.all([client.invalidateQueries({ queryKey: ['service-redemption', id.value] }), client.invalidateQueries({ queryKey: ['service-redemptions'] })])
  },
})
const storedFieldValue = (field: ServiceField) => {
  if (!field.value || typeof field.value !== 'object' || Array.isArray(field.value)) return field.value
  return Object.values(field.value).find((value) => value !== null && value !== '')
}
const fieldValue = (field: ServiceField) => {
  const value = storedFieldValue(field)
  if (value === undefined || value === null || value === '') return '—'
  return Array.isArray(value) ? value.join('、') || '—' : String(value)
}
const resourceFields = (resource: ServiceRedemptionResource, stage: 'customer' | 'manager') => resource.redemption_fields.filter((field) => field.fill_stage === stage)
const hydratedTaskId = ref<number | null>(null)
watch(
  [resources, id],
  ([current, currentId]) => {
    const preserveDraft = hydratedTaskId.value === currentId
    const next: Record<number, Record<number, unknown>> = {}
    current.forEach((resource) => {
      next[resource.index] = preserveDraft ? { ...(values.value[resource.index] ?? {}) } : {}
      resourceFields(resource, 'manager').forEach((field) => {
        const value = storedFieldValue(field)
        if (!(field.id in next[resource.index]) && value !== undefined && value !== null && value !== '') {
          next[resource.index][field.id] = value
        }
      })
    })
    values.value = next
    hydratedTaskId.value = currentId
  },
  { immediate: true },
)
const confirmApprove = () =>
  dialog.warning({
    title: '通过核销',
    content: `确认 ${resources.value.length} 份履约资源均已完成，并通过本次核销？`,
    positiveText: '通过核销',
    negativeText: '返回核对',
    onPositiveClick: () =>
      action.mutate({
        path: 'complete',
        body: {
          field_values: resources.value.map((resource) => values.value[resource.index] ?? {}),
        },
      }),
  })
const confirmReject = () => {
  const reason = rejectReason.value.trim()
  if (!reason) return
  dialog.warning({
    title: '驳回核销',
    content: '驳回后本次预占额度会释放，顾客可以修改各份资料后重新发起。',
    positiveText: '确认驳回',
    negativeText: '返回核对',
    onPositiveClick: () => action.mutate({ path: 'reject', body: { reason } }),
  })
}
function confirmFee() {
  if (!feeValid.value) return
  const amount = feeTotal.value.toFixed(2)
  const cost = feeNumber(fee.cost).toFixed(2)
  dialog.warning({
    title: '提交费用调整',
    content: `顾客需要另行确认并支付 ¥${amount}；内部成本 ¥${cost}，预计可分成 ¥${feeNet.value.toFixed(2)}。`,
    positiveText: '提交顾客确认',
    negativeText: '返回核对',
    onPositiveClick: () =>
      action.mutate({
        path: 'adjustments',
        body: {
          name: fee.name.trim(),
          quantity: feeNumber(fee.quantity),
          unit_price: feeNumber(fee.unit_price).toFixed(2),
          cost,
          memo: fee.memo.trim(),
        },
      }),
  })
}
</script>
<template>
  <LsDetailPage aside-label="核销任务已保存概况" :title="query.data.value?.service.name || '核销详情'" :description="routeAccess.restricted.value ? '#- · -' : query.data.value ? `#${query.data.value.id} · ${serviceStatusName(statusCode)}` : '正在读取'" back-to="/services" back-label="返回核销">
    <div class="service-task">
      <LsAsyncState v-if="!routeAccess.restricted.value && query.isPending.value" state="loading" :rows="5" /><LsAsyncState v-else-if="!routeAccess.restricted.value && query.isError.value" state="error" title="暂时无法读取核销任务" :description="friendlyError(query.error.value)" /><template v-else-if="routeAccess.restricted.value"><LsFormSection title="履约资源"><p>-</p></LsFormSection></template><template v-else-if="query.data.value"
        ><LsFormSection v-if="!resources.some(resource => resource.redemption_fields.length)" title="履约资料"><p>该任务没有配置额外履约字段。</p></LsFormSection
        ><LsPanel v-if="resources.some((resource) => resource.redemption_fields.length)">
          <section class="task-section">
            <div>
              <h2>履约资源</h2>
              <p class="hint">每份资源独立保存字段，互不覆盖。</p>
            </div>
            <div class="resource-list">
              <section v-for="resource in resources" :key="resource.index" class="resource-item">
                <header>
                  <div>
                    <h3>第 {{ resource.index }} 份</h3>
                    <p>
                      {{ resource.quantity }}
                      {{ query.data.value.entitlement?.unit_name || '单位' }}
                    </p>
                  </div>
                </header>
                <div class="resource-columns">
                  <section>
                    <h4>顾客资料</h4>
                    <p v-if="!resourceFields(resource, 'customer').length" class="hint">无顾客填写字段。</p>
                    <dl v-else class="field-summary">
                      <div v-for="field in resourceFields(resource, 'customer')" :key="field.id">
                        <dt>{{ field.name }}</dt>
                        <dd><NImage v-if="field.value_type === 'image' && fieldValue(field) !== '—'" :src="fieldValue(field)" :alt="field.name" width="120" object-fit="cover" /><template v-else>{{ fieldValue(field) }}</template></dd>
                      </div>
                    </dl>
                  </section>
                  <section>
                    <h4>接单资料</h4>
                    <p v-if="!resourceFields(resource, 'manager').length" class="hint">无接单填写字段。</p>
                    <ServiceCompletionFields v-else-if="statusCode === 2 && !pending && canManage" v-model="values[resource.index]" :fields="resourceFields(resource, 'manager')" :id-prefix="`manager-field-${resource.index}`" />
                    <dl v-else class="field-summary">
                      <div v-for="field in resourceFields(resource, 'manager')" :key="field.id">
                        <dt>{{ field.name }}</dt>
                        <dd><NImage v-if="field.value_type === 'image' && fieldValue(field) !== '—'" :src="fieldValue(field)" :alt="field.name" width="120" object-fit="cover" /><template v-else>{{ fieldValue(field) }}</template></dd>
                      </div>
                    </dl>
                  </section>
                </div>
              </section>
            </div>
          </section> </LsPanel
        ><LsPanel v-if="pending"
          ><section class="task-section">
            <h2>取消申请</h2>
            <p>{{ pending.reason || '顾客未填写原因' }}</p>
            <div class="actions">
              <LsButton variant="secondary" :disabled="!canApprove" :disabled-reason="!canApprove ? manageReason : undefined" :loading="action.isPending.value" @click="action.mutate({ path: 'cancel/approve' })">同意取消</LsButton><NInput v-model:value="cancelReason" placeholder="拒绝原因" /><LsButton
                variant="danger"
                :disabled="!canManage || !cancelReason.trim()"
                :disabled-reason="!canManage ? manageReason : undefined"
                :loading="action.isPending.value"
                @click="
                  action.mutate({
                    path: 'cancel/reject',
                    body: { reason: cancelReason },
                  })
                "
                >拒绝</LsButton
              >
            </div>
          </section></LsPanel
        ><LsPanel v-if="statusCode === 2 && !pending"
          ><section class="task-section">
            <h2>费用调整</h2>
            <p class="hint">额外费用由顾客单独确认并支付；履约完成后再形成对应业绩，不与原服务重复收款。</p>
            <div v-if="query.data.value.adjustments?.length" class="fee-list">
              <div v-for="item in query.data.value.adjustments" :key="item.id">
                <div>
                  <strong>{{ item.name }}</strong
                  ><small
                    >{{ item.quantity }} × ¥{{ item.unit_price }} = ¥{{ item.total_price }}
                    ·
                    {{ item.status === 1 ? '待顾客确认' : item.status === 2 ? '顾客已确认' : '已取消' }}</small
                  >
                </div>
                <LsButton v-if="item.status === 1" size="sm" variant="secondary" :disabled="!canManage" :disabled-reason="!canManage ? manageReason : undefined" :loading="action.isPending.value" @click="action.mutate({ path: `adjustments/${item.id}/cancel` })">取消费用</LsButton>
              </div>
            </div>
            <form class="fee-form" @submit.prevent="confirmFee">
              <LsField label="费用名称" for-id="fee-name" required><NInput id="fee-name" v-model:value="fee.name" placeholder="例如：额外时段费用" /></LsField>
              <LsField label="计费数量" for-id="fee-quantity" required><NInputNumber id="fee-quantity" v-model:value="fee.quantity" :min="Number(query.data.value.entitlement?.quantity_step ?? 1)" :step="Number(query.data.value.entitlement?.quantity_step ?? 1)" :precision="quantityScale" /></LsField>
              <LsField label="单位价格" for-id="fee-price" required><NInputNumber id="fee-price" v-model:value="fee.unit_price" :min="0" :precision="2" /></LsField>
              <LsField label="总成本" for-id="fee-cost" required hint="填写本次费用调整的全部内部成本，不按数量再次相乘。"><NInputNumber id="fee-cost" v-model:value="fee.cost" :min="0" :precision="2" /></LsField>
              <LsField label="说明" for-id="fee-memo"><NInput id="fee-memo" v-model:value="fee.memo" type="textarea" /></LsField>
              <dl class="fee-preview" aria-live="polite">
                <div>
                  <dt>顾客需确认并支付</dt>
                  <dd>¥{{ feeTotal.toFixed(2) }}</dd>
                </div>
                <div>
                  <dt>内部成本</dt>
                  <dd>¥{{ feeNumber(fee.cost).toFixed(2) }}</dd>
                </div>
                <div>
                  <dt>预计可分成</dt>
                  <dd :class="{ invalid: feeNet < 0 }">¥{{ feeNet.toFixed(2) }}</dd>
                </div>
              </dl>
              <LsFormActions><LsButton type="submit" variant="secondary" :disabled="!canManage || !feeValid" :disabled-reason="!canManage ? manageReason : undefined" :loading="action.isPending.value">提交顾客确认</LsButton></LsFormActions>
            </form>
          </section></LsPanel
        ><LsPanel v-if="statusCode === 2 && !pending"
          ><section class="task-section">
            <h2>改派接单人</h2>
            <LsAsyncState v-if="handlers.isError.value" state="error" title="暂时无法读取接单人" :description="friendlyError(handlers.error.value)" />
            <div v-else class="actions">
              <LsField label="新接单人" for-id="service-handler"><NSelect id="service-handler" v-model:value="handlerId" :options="handlerOptions" filterable placeholder="选择新接单人" /></LsField><LsField label="改派原因" for-id="service-reassign-reason"><NInput id="service-reassign-reason" v-model:value="reassignReason" placeholder="记录改派原因" /></LsField
              ><LsButton
                variant="secondary"
                :disabled="!canManage || !handlerId"
                :disabled-reason="!canManage ? manageReason : undefined"
                @click="
                  action.mutate({
                    path: 'reassign',
                    body: {
                      handler_entity_id: handlerId,
                      reason: reassignReason,
                    },
                  })
                "
                >确认改派</LsButton
              >
            </div>
          </section></LsPanel
        ><LsPanel v-if="statusCode === 2 && !pending"
          ><section class="task-section">
            <div>
              <h2>审核核销</h2>
              <p class="hint">核对上方每份履约资源后，通过或驳回本次核销。</p>
            </div>
            <div class="review-actions">
              <LsButton :disabled="!canManage || pendingFee" :disabled-reason="!canManage ? manageReason : undefined" :loading="action.isPending.value" @click="confirmApprove">通过核销</LsButton>
              <LsField label="驳回原因" for-id="redemption-reject-reason" required>
                <NInput id="redemption-reject-reason" v-model:value="rejectReason" type="textarea" maxlength="500" show-count placeholder="说明需要顾客修改或重新发起的原因" />
              </LsField>
              <LsButton variant="danger" :disabled="!canManage || !rejectReason.trim() || acceptedFee" :disabled-reason="!canManage ? manageReason : undefined" :loading="action.isPending.value" @click="confirmReject">驳回核销</LsButton>
            </div>
            <p v-if="pendingFee" class="hint">待确认费用会阻止通过核销；驳回时会一并取消这些费用。</p>
            <p v-if="acceptedFee" class="hint">顾客已确认费用，本次核销不能驳回；仍可核对资料后通过。</p>
          </section></LsPanel
        ><LsInlineError v-if="action.isError.value" :message="friendlyError(action.error.value)"
      /></template>
    </div>
    <template #aside>
      <LsFormSection v-if="routeAccess.restricted.value || query.isPending.value || query.isError.value || !query.data.value" title="任务概况">
        <p v-if="routeAccess.restricted.value">暂无可查看的任务资料。</p><p v-else-if="query.isPending.value">正在读取任务…</p><p v-else-if="query.isError.value">任务读取失败。</p><p v-else>暂无任务资料。</p>
      </LsFormSection>
      <template v-else><LsPanel aria-label="已保存的核销任务概况">
          <section class="task-section">
            <div class="overview-heading">
              <LsEntityIdentity type="customer" :name="customerName(query.data.value.customer, query.data.value.customer_id)" />
              <LsStatusTag :label="serviceStatusName(statusCode)" :type="statusCode === 3 ? 'success' : statusCode === 2 ? 'warning' : 'default'" />
            </div>
            <LsDescriptionList class="facts">
              <dt>任务编号</dt>
              <dd>#{{ query.data.value.id }}</dd>
              <dt>当前接单人</dt>
              <dd>
                {{ entityName(query.data.value.handler, query.data.value.handler_entity_id) }}
              </dd>
              <dt>发单人</dt>
              <dd>{{ entityName(query.data.value.sender) }}</dd>
              <dt>客服</dt>
              <dd>{{ entityName(query.data.value.cs) }}</dd>
              <dt>发起时间</dt>
              <dd>{{ dateTime(query.data.value.started_at) }}</dd>
              <dt>完成时间</dt>
              <dd>{{ dateTime(query.data.value.completed_at) }}</dd>
              <template v-if="query.data.value.settlement_kind === 'unused'">
                <dt>结单方式</dt><dd>未使用权益自动结单</dd>
                <dt>接单实结</dt><dd>¥{{ query.data.value.settled_handler_cut ?? '0.00' }}</dd>
                <dt>团队实结</dt><dd>¥{{ query.data.value.settled_team_cut ?? '0.00' }}</dd>
              </template>
              <template v-else-if="query.data.value.completion_requested_at && statusCode === 2">
                <dt>结单请求</dt><dd>等待顾客确认</dd>
                <dt>确认截止</dt><dd>{{ query.data.value.completion_due_at ? dateTime(query.data.value.completion_due_at) : '须由顾客手动确认' }}</dd>
              </template>
              <dt>履约总量</dt>
              <dd>
                {{ Number(query.data.value.quantity).toFixed(quantityScale) }}
                {{ query.data.value.entitlement?.unit_name || '单位' }}
              </dd>
              <dt>独立资源</dt>
              <dd>{{ resources.length }} 份</dd>
              <template v-if="query.data.value.memo"
                ><dt>顾客备注</dt>
                <dd>{{ query.data.value.memo }}</dd></template
              >
            </LsDescriptionList>
          </section> </LsPanel></template>
    </template>
  </LsDetailPage>
</template>
<style scoped>
.service-task {
  container: service-task / inline-size;
  min-width: 0;
  display: grid;
  gap: 1.5rem;
}
.field-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin: 0;
}
.field-summary > div {
  padding: 0.8rem;
  background: var(--surface-subtle);
  border-radius: 8px;
}
.field-summary dt {
  color: var(--muted-ink);
  font-size: 0.75rem;
}
.field-summary dd {
  margin: 0.2rem 0 0;
}
.task-section {
  display: grid;
  gap: 1rem;
}
.task-section h2,
.task-section p {
  margin: 0;
}
.overview-heading {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.resource-list {
  display: grid;
  gap: 1rem;
}
.resource-item {
  display: grid;
  gap: 1rem;
  padding-block: 1rem;
  border-top: 1px solid var(--line);
}
.resource-item header,
.resource-item h3,
.resource-item h4,
.resource-item header p {
  margin: 0;
}
.resource-item header p {
  margin-top: 0.2rem;
  color: var(--muted-ink);
  font-size: 0.8rem;
}
.resource-columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}
.resource-columns > section {
  min-width: 0;
  display: grid;
  align-content: start;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--surface-subtle);
  border-radius: 8px;
}
.review-actions {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: end;
  gap: 0.75rem;
}
.actions {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
  align-items: end;
  gap: 0.7rem;
}
.manager-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
}
.fee-list {
  display: grid;
  gap: 0.65rem;
}
.fee-list > div {
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.8rem;
  background: var(--surface-subtle);
  border-radius: 8px;
}
.fee-list strong,
.fee-list small {
  display: block;
}
.fee-list small {
  margin-top: 0.2rem;
  color: var(--muted-ink);
}
.fee-form {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.85rem;
  margin: 0;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
}
.fee-preview {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.65rem;
  margin: 0;
}
.fee-preview div {
  padding: 0.75rem;
  background: var(--surface-subtle);
  border-radius: 8px;
}
.fee-preview dt {
  color: var(--muted-ink);
  font-size: 0.75rem;
}
.fee-preview dd {
  margin: 0.2rem 0 0;
  font-weight: 750;
  font-variant-numeric: tabular-nums;
}
.fee-preview dd.invalid {
  color: var(--danger);
}
.hint {
  color: var(--muted-ink);
  font-size: 0.8rem;
}
@container service-task (max-width: 40rem) {
  .field-summary,
  .manager-fields,
  .actions,
  .resource-columns,
  .review-actions {
    grid-template-columns: 1fr;
  }
  .overview-heading {
    align-items: flex-start;
  }
  .fee-preview {
    grid-template-columns: 1fr;
  }
}
</style>
