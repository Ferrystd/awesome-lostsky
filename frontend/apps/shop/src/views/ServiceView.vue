<script setup lang="ts">
import { friendlyError } from '@lostsky/api/client'
import { quantityScaleForStep } from '@lostsky/shared/quantity'
import LsEntitySelect from '@lostsky/ui/components/LsEntitySelect.vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { ArrowLeft, CalendarClock, CheckCircle2 } from '@lucide/vue'
import { NButton, NCheckbox, NDatePicker, NInput, NInputNumber, NSelect } from 'naive-ui'
import { computed, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { formatDate, serviceStatus, shopApi } from '../lib'
import type { RedemptionField, ServiceInstance } from '../types'

const route = useRoute()
const id = computed(() => Number(route.params.id))
const client = useQueryClient()
const dispatchMode = ref<'direct' | 'open'>('direct')
const handler = ref<number | null>(null)
const quantity = ref<number | null>(null)
const memo = ref('')
const error = ref('')
const values = reactive<Record<number, Record<number, any>>>({})
const cancelReasons = reactive<Record<number, string>>({})
const query = useQuery({ queryKey: computed(() => ['shop-service', id.value]), queryFn: () => shopApi.service(id.value) })
const quantityScale = computed(() => quantityScaleForStep(query.data.value?.quantity_step))
const resourceCount = computed(() => {
  const step = Number(query.data.value?.quantity_step || 1)
  return quantity.value === null || step <= 0 ? 0 : Math.round(quantity.value / step)
})
const resourceIndexes = computed(() => Array.from({ length: resourceCount.value }, (_, index) => index + 1))
const quotaStyle = computed(() => {
  const data = query.data.value
  if (!data) return {}
  const granted = Math.max(Number(data.granted_quantity), 1)
  return {
    '--consumed': `${Math.min(100, Number(data.consumed_quantity) / granted * 100)}%`,
    '--reserved': `${Math.min(100, Number(data.reserved_quantity) / granted * 100)}%`,
  }
})
const handlers = useQuery({
  queryKey: computed(() => ['shop-service-handlers', id.value]),
  queryFn: () => shopApi.serviceHandlers(id.value),
  enabled: computed(() => Boolean(query.data.value && !query.data.value.is_expired)),
})
watch(() => query.data.value, data => {
  if (!data || quantity.value !== null || Number(data.available_quantity) <= 0) return
  quantity.value = Math.min(Number(data.available_quantity), Number(data.quantity_step))
}, { immediate: true })
const handlerEntities = computed(() => (handlers.data.value ?? []).map(item => ({
  entity_id: item.entity_id,
  type: item.subject.type ?? item.subject.entityable_type,
  slug: item.subject.slug,
  name: item.subject.name,
  avatar: item.subject.avatar,
})))
const dispatchOptions = computed(() => [
  { label: '指定接单人（等待对方确认）', value: 'direct' },
  ...(query.data.value?.allow_open_dispatch ? [{ label: '公开召唤（立即进入核销中）', value: 'open' }] : []),
])
const startDisabledReason = computed(() => {
  if (quantity.value === null) return '请先填写履约数量'
  const missingRequired = resourceIndexes.value.some(index => customerFields.value.some(field =>
    field.is_required && !hasValue(values[index]?.[field.id])))
  if (missingRequired) return '请完整填写每份履约资源的必填字段'
  if (dispatchMode.value !== 'direct') return ''
  if (handlers.isError.value) return '可选接单人读取失败，请重试'
  if (handler.value === null) return '请选择接单 Entity'
  return ''
})
const customerFields = computed(() => (query.data.value?.redemption_fields ?? []).filter(field => field.fill_stage === 'customer'))
const hasValue = (value: unknown) => Array.isArray(value) ? value.length > 0 : typeof value === 'string' ? value.trim() !== '' : value !== null && value !== undefined && value !== ''
watch(resourceIndexes, indexes => {
  indexes.forEach(index => { if (!values[index]) values[index] = {} })
  Object.keys(values).forEach(key => { if (!indexes.includes(Number(key))) delete values[Number(key)] })
}, { immediate: true })
const refresh = async () => Promise.all([
  client.invalidateQueries({ queryKey: ['shop-service', id.value] }),
  client.invalidateQueries({ queryKey: ['shop-services'] }),
])
const start = useMutation({
  mutationFn: () => {
    const data = query.data.value
    if (!data || quantity.value === null) throw new Error('请填写履约数量')
    const body = {
      quantity: quantity.value.toFixed(quantityScale.value),
      memo: memo.value,
      field_values: resourceIndexes.value.map(index => values[index] ?? {}),
    }
    return dispatchMode.value === 'direct'
      ? shopApi.createServiceOffer(id.value, { ...body, handler_entity_id: Number(handler.value) })
      : shopApi.startService(id.value, { ...body, handler_entity_id: 0 })
  },
  onSuccess: async () => {
    error.value = ''; quantity.value = null; memo.value = ''; handler.value = null
    Object.keys(values).forEach(key => delete values[Number(key)])
    await refresh()
  },
  onError: reason => error.value = friendlyError(reason),
})
const withdrawOffer = useMutation({
  mutationFn: (offerId: number) => shopApi.withdrawServiceOffer(offerId),
  onSuccess: async () => { error.value = ''; await refresh() },
  onError: reason => error.value = friendlyError(reason),
})
const cancel = useMutation({
  mutationFn: (instanceId: number) => shopApi.cancelService(instanceId, cancelReasons[instanceId] ?? ''),
  onSuccess: async () => { error.value = ''; await refresh() },
  onError: reason => error.value = friendlyError(reason),
})
const adjustment = useMutation({
  mutationFn: (input: { instanceId: number; adjustmentId: number; accept: boolean }) => input.accept
    ? shopApi.acceptServiceAdjustment(input.instanceId, input.adjustmentId)
    : shopApi.rejectServiceAdjustment(input.instanceId, input.adjustmentId),
  onSuccess: async () => { error.value = ''; await refresh() },
  onError: reason => error.value = friendlyError(reason),
})
const choices = (field: RedemptionField) => (field.options ?? []).map(value => ({ label: value, value }))
const pendingCancel = (instance: ServiceInstance) =>
  (instance.cancel_requests ?? []).some(item => item.status === 1)
const offerStatus = (status: number | string) => typeof status === 'string' ? status : ({ 1: '待确认', 2: '已接受', 3: '已拒绝', 4: '已取消', 5: '已失效' }[status] ?? '未知')
const offerPending = (status: number | string) => status === 1 || status === '待确认'
</script>

<template>
  <section class="service-page">
    <RouterLink class="back" to="/services"><ArrowLeft :size="18" aria-hidden="true" />返回服务权益</RouterLink>
    <div v-if="query.isPending.value" class="panel loading-panel" role="status"><span />正在读取服务权益…</div>
    <div v-else-if="query.isError.value" class="panel error-panel" role="alert"><strong>暂时无法读取服务权益</strong><p>{{ friendlyError(query.error.value) }}</p><NButton secondary @click="query.refetch()">重新加载</NButton></div>
    <article v-else-if="query.data.value" class="service-content">
      <header class="service-intro">
        <div>
          <h1 tabindex="-1">{{ query.data.value.service.name }}</h1>
          <p>{{ query.data.value.service.description || '该服务暂无补充说明。' }}</p>
        </div>
        <span class="status" :data-state="query.data.value.is_expired ? 'expired' : query.data.value.is_exhausted ? 'exhausted' : 'active'">
          <CheckCircle2 :size="17" aria-hidden="true" />
          {{ query.data.value.is_expired ? '已过期' : query.data.value.is_exhausted ? '已用完' : '可使用' }}
        </span>
      </header>

      <div class="service-workspace">
        <section class="quota-panel" aria-labelledby="quota-title">
          <div class="quota-heading">
            <h2 id="quota-title">权益额度</h2>
            <p>每次履约只占用本次数量，其余可继续拆分使用。</p>
          </div>
          <dl class="quota-values">
            <div data-quota="available"><dt><span />可用额度</dt><dd>{{ Number(query.data.value.available_quantity).toFixed(quantityScale) }} <small>{{ query.data.value.unit_name }}</small></dd></div>
            <div data-quota="reserved"><dt><span />核销中</dt><dd>{{ Number(query.data.value.reserved_quantity).toFixed(quantityScale) }} <small>{{ query.data.value.unit_name }}</small></dd></div>
            <div data-quota="consumed"><dt><span />已核销</dt><dd>{{ Number(query.data.value.consumed_quantity).toFixed(quantityScale) }} <small>{{ query.data.value.unit_name }}</small></dd></div>
          </dl>
          <div class="quota-track" :style="quotaStyle" aria-hidden="true"><span class="consumed" /><span class="reserved" /><span class="available" /></div>
          <p class="quota-expiry"><CalendarClock :size="17" aria-hidden="true" /><span>有效期</span><strong>{{ query.data.value.expire_time ? formatDate(query.data.value.expire_time) : '长期有效' }}</strong></p>
        </section>

        <section class="action-panel" aria-labelledby="action-title">
          <form v-if="query.data.value.dispatch_available && !query.data.value.is_expired && Number(query.data.value.available_quantity) > 0" @submit.prevent="start.mutate()">
            <div class="form-heading"><h2 id="action-title">发起一次履约</h2><p>仅占用本次填写的额度，其余仍可继续使用。</p></div>
            <label>履约数量（{{ query.data.value.unit_name }}）<NInputNumber v-model:value="quantity" :min="Number(query.data.value.quantity_step)" :max="Number(query.data.value.available_quantity)" :step="Number(query.data.value.quantity_step)" :precision="quantityScale" size="large" /></label>
            <label>接单方式<NSelect v-model:value="dispatchMode" :options="dispatchOptions" size="large" /></label>
            <label v-if="dispatchMode==='direct'">指定接单 Entity<LsEntitySelect v-model="handler" :entities="handlerEntities" :loading="handlers.isPending.value" :disabled="handlers.isError.value" placeholder="选择接单 Entity" size="large" /></label>
            <p v-else class="privacy-note">公开召唤提交后立即进入核销中；配置接单池时向池内 Entity 开放，接单池留空时向团队内全部有效接单 Entity 开放，领取前均可查看本次填写的完整核销字段。</p>
            <p v-if="handlers.isError.value" class="error" role="alert">暂时无法读取可选接单人：{{ friendlyError(handlers.error.value) }} <NButton text @click="handlers.refetch()">重试</NButton></p>
            <div v-if="customerFields.length" class="resource-fields">
              <section v-for="resourceIndex in resourceIndexes" :key="resourceIndex">
                <div class="resource-heading"><strong>第 {{ resourceIndex }} 份履约资源</strong><span>{{ query.data.value.quantity_step }} {{ query.data.value.unit_name }}</span></div>
                <label v-for="field in customerFields" :key="field.id"><span>{{ field.name }} <b v-if="field.is_required">*</b></span><NInput v-if="field.input_type==='textarea'||field.value_type==='text'||field.value_type==='json'" v-model:value="values[resourceIndex][field.id]" type="textarea" size="large" /><NSelect v-else-if="['select','radio'].includes(field.input_type)||field.value_type==='select'" v-model:value="values[resourceIndex][field.id]" :options="choices(field)" clearable size="large" /><NSelect v-else-if="field.value_type==='multi_select'||field.input_type==='checkbox'" v-model:value="values[resourceIndex][field.id]" :options="choices(field)" multiple clearable size="large" /><NCheckbox v-else-if="field.value_type==='bool'" :checked="Boolean(values[resourceIndex][field.id])" @update:checked="value=>values[resourceIndex][field.id]=value?1:0">是</NCheckbox><NInputNumber v-else-if="['int','decimal'].includes(field.value_type)" v-model:value="values[resourceIndex][field.id]" :precision="field.value_type==='int'?0:2" size="large" /><NDatePicker v-else-if="['date','datetime'].includes(field.value_type)" v-model:value="values[resourceIndex][field.id]" :type="field.value_type==='date'?'date':'datetime'" size="large" /><NInput v-else v-model:value="values[resourceIndex][field.id]" size="large" /></label>
              </section>
            </div>
            <label>备注<NInput v-model:value="memo" type="textarea" size="large" /></label>
            <NButton attr-type="submit" type="primary" size="large" :disabled="Boolean(startDisabledReason)" :title="startDisabledReason || undefined" :loading="start.isPending.value">{{ dispatchMode==='direct' ? '发送接单邀请' : '发布公开任务' }}</NButton>
            <p v-if="startDisabledReason" class="action-reason">{{ startDisabledReason }}</p>
          </form>
          <div v-else class="action-unavailable">
            <h2 id="action-title">暂时无法发起履约</h2>
            <p v-if="!query.data.value.dispatch_available">当前团队未开通可用的 Transaction Ability，暂不能发起新的指定邀请或公开任务。</p>
            <p v-else-if="query.data.value.is_expired">该权益已过期，无法再发起新的履约。</p>
            <p v-else>该权益的可用额度已全部使用。</p>
          </div>
        </section>
      </div>

      <section v-if="query.data.value.assignment_offers?.length" class="history offers">
        <div class="history-heading"><h2>指定接单邀请</h2><p>待确认邀请不会自动过期；对方处理前，你可以随时取消。</p></div>
        <section v-for="offer in query.data.value.assignment_offers" :key="offer.id" class="history-row">
          <div class="history-head"><div><strong>{{ Number(offer.quantity).toFixed(quantityScale) }} {{ query.data.value.unit_name }}</strong><span>#{{ offer.id }} · {{ offerStatus(offer.status) }} · {{ offer.target_handler?.name || offer.target_handler?.profile?.name || '指定 Entity' }}</span></div></div>
          <p v-if="offer.decision_reason" class="form-hint">{{ offer.decision_reason }}</p>
          <NButton v-if="offerPending(offer.status)" secondary size="large" :loading="withdrawOffer.isPending.value" @click="withdrawOffer.mutate(offer.id)">取消邀请</NButton>
        </section>
      </section>

      <section class="history">
        <div class="history-heading"><h2>履约记录</h2><p>查看每次履约的接单状态、费用调整和取消进度。</p></div>
        <p v-if="!query.data.value.instances?.length" class="empty">尚未发起履约。</p>
        <section v-for="instance in query.data.value.instances" :key="instance.id" class="history-row">
          <div class="history-head"><div><strong>{{ Number(instance.quantity).toFixed(quantityScale) }} {{ query.data.value.unit_name }}</strong><span>#{{ instance.id }} · {{ serviceStatus(instance.status) }} · {{ instance.handler?.name || instance.handler?.profile?.name || '未分配接单人' }}</span></div><time v-if="instance.create_time">{{ formatDate(instance.create_time) }}</time></div>
          <div v-if="instance.adjustments?.length" class="adjustments"><div v-for="fee in instance.adjustments" :key="fee.id"><span>{{ fee.name }} · ¥{{ fee.total_price }}</span><small>{{ fee.status===1?'待确认':fee.status===2?'已确认':'已取消' }}</small><div v-if="fee.status===1 && instance.status===2" class="fee-actions"><NButton size="large" type="primary" :loading="adjustment.isPending.value" @click="adjustment.mutate({instanceId:instance.id,adjustmentId:fee.id,accept:true})">确认并支付</NButton><NButton size="large" secondary :loading="adjustment.isPending.value" @click="adjustment.mutate({instanceId:instance.id,adjustmentId:fee.id,accept:false})">拒绝</NButton></div></div></div>
          <form v-if="instance.status===2 && !pendingCancel(instance)" class="inline-form" @submit.prevent="cancel.mutate(instance.id)"><label>取消原因<NInput v-model:value="cancelReasons[instance.id]" placeholder="例如：未通过、临时无法履约" size="large" /></label><NButton attr-type="submit" secondary type="warning" size="large" :loading="cancel.isPending.value">申请取消</NButton></form>
          <p v-else-if="instance.status===2" class="notice">取消申请正在等待处理，期间不会改派或完成履约。</p>
          <p v-else-if="instance.status===1" class="notice">该切片额度已释放，可在上方重新发送指定邀请或发布公开任务。</p>
        </section>
      </section>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
    </article>
  </section>
</template>

<style scoped>
.service-page {
  width: min(100% - 2rem, 76rem);
  margin-inline: auto;
  padding-block: clamp(2rem, 5vw, 5rem) 7rem;
}
.back {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: clamp(2rem, 5vw, 4rem);
  color: var(--cyan);
  font-weight: 700;
}
.back svg { transition: transform 180ms ease; }
.back:hover svg { transform: translateX(-3px); }
.panel {
  min-height: 18rem;
  display: grid;
  place-content: center;
  justify-items: center;
  padding: 2rem;
  border: 1px solid var(--line);
  background: rgba(11, 23, 40, 0.72);
  text-align: center;
}
.loading-panel { gap: 1rem; color: var(--muted); }
.loading-panel span {
  width: 2rem;
  height: 2rem;
  border: 2px solid var(--line);
  border-top-color: var(--cyan);
  border-radius: 50%;
  animation: spin 800ms linear infinite;
}
.error-panel strong { font-size: 1.25rem; }
.error-panel p { max-width: 54ch; color: var(--muted); }
.service-content { display: grid; gap: clamp(3rem, 7vw, 5.5rem); }
.service-intro {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: 2rem;
}
.service-intro h1 {
  max-width: 17ch;
  margin: 0;
  font-family: "Barlow Condensed", "PingFang SC", sans-serif;
  font-size: clamp(2.8rem, 6vw, 5.25rem);
  font-weight: 700;
  line-height: 1.02;
  letter-spacing: -0.025em;
  text-wrap: balance;
  overflow-wrap: anywhere;
}
.service-intro p {
  max-width: 64ch;
  margin: 1.25rem 0 0;
  color: var(--muted);
  font-size: clamp(1rem, 1.8vw, 1.12rem);
  line-height: 1.8;
}
.status {
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0 0.8rem;
  border: 1px solid rgba(105, 228, 220, 0.32);
  border-radius: 999px;
  color: var(--cyan-soft);
  background: rgba(105, 228, 220, 0.08);
  font-size: 0.86rem;
  font-weight: 700;
  white-space: nowrap;
}
.status[data-state="expired"], .status[data-state="exhausted"] {
  border-color: var(--line);
  color: var(--muted);
  background: rgba(255, 255, 255, 0.04);
}
.service-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(22rem, 0.92fr);
  align-items: start;
  gap: clamp(1.25rem, 3vw, 2rem);
}
.quota-panel {
  display: grid;
  align-content: start;
  gap: clamp(2.5rem, 6vw, 5rem);
  padding: clamp(1.5rem, 4vw, 2.5rem);
  border: 1px solid rgba(165, 245, 239, 0.16);
  border-radius: 16px;
  background:
    radial-gradient(circle at 88% 12%, rgba(141, 120, 247, 0.18), transparent 18rem),
    linear-gradient(145deg, rgba(15, 38, 53, 0.96), rgba(11, 23, 40, 0.94));
  box-shadow: 0 30px 70px rgba(0, 0, 0, 0.22);
}
.quota-heading h2, .form-heading h2, .action-unavailable h2, .history-heading h2 { margin: 0; }
.quota-heading h2 { font-size: 1.35rem; }
.quota-heading p, .form-heading p, .history-heading p, .action-unavailable p, .empty, .history-row span { color: var(--muted); }
.quota-heading p { max-width: 38ch; margin: 0.55rem 0 0; line-height: 1.65; }
.quota-values {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.5rem;
  margin: 0;
}
.quota-values div { min-width: 0; }
.quota-values dt { display: flex; align-items: center; gap: 0.5rem; color: var(--muted); font-size: 0.8rem; }
.quota-values dt span { width: 8px; height: 8px; border-radius: 50%; background: var(--quota-color); }
.quota-values dd {
  margin: 0.65rem 0 0;
  color: var(--ink);
  font-family: "Barlow Condensed", "PingFang SC", sans-serif;
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 650;
  line-height: 1;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.quota-values dd small { color: var(--muted); font-family: inherit; font-size: 0.42em; letter-spacing: 0; }
.quota-values [data-quota="available"] { --quota-color: var(--cyan); }
.quota-values [data-quota="reserved"] { --quota-color: var(--violet); }
.quota-values [data-quota="consumed"] { --quota-color: #53657a; }
.quota-track {
  position: relative;
  height: 6px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
}
.quota-track span { position: absolute; inset-block: 0; }
.quota-track .consumed { left: 0; width: var(--consumed); background: #53657a; }
.quota-track .reserved { left: var(--consumed); width: var(--reserved); background: var(--violet); }
.quota-track .available { left: calc(var(--consumed) + var(--reserved)); right: 0; background: var(--cyan); }
.quota-expiry {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.55rem;
  margin: 0;
  padding-top: 1.25rem;
  border-top: 1px solid var(--line);
  color: var(--muted);
  font-size: 0.85rem;
}
.quota-expiry strong { color: var(--ink); font-variant-numeric: tabular-nums; text-align: right; }
.action-panel {
  padding: clamp(1.5rem, 3vw, 2rem);
  border: 1px solid var(--line);
  border-radius: 16px;
  background: rgba(11, 23, 40, 0.86);
}
.action-panel form { display: grid; gap: 1.15rem; }
.resource-fields { display: grid; gap: 1rem; }
.resource-fields > section { display: grid; gap: 1rem; padding: 1rem; border: 1px solid var(--line); border-radius: 12px; background: rgba(255,255,255,.025); }
.resource-heading { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.resource-heading span { color: var(--muted); font-size: .8rem; font-variant-numeric: tabular-nums; }
.form-heading { margin-bottom: 0.25rem; }
.form-heading h2, .action-unavailable h2 { font-size: 1.35rem; }
.form-heading p, .history-heading p, .action-unavailable p { margin: 0.55rem 0 0; line-height: 1.65; }
.action-panel form label, .inline-form label { display: grid; gap: 0.5rem; font-size: 0.9rem; font-weight: 650; }
.action-panel form b { color: #ffb27f; }
.action-panel form > button { width: 100%; margin-top: 0.25rem; }
.action-panel :deep(.n-base-selection), .action-panel :deep(.n-input) { min-height: 44px; }
.action-panel :deep(.n-checkbox) { min-height: 44px; align-items: center; }
.action-panel :deep(.n-base-selection:focus-within), .action-panel :deep(.n-input:focus-within) { box-shadow: 0 0 0 2px rgba(105, 228, 220, 0.14); }
.action-panel :deep(.n-base-selection-placeholder), .action-panel :deep(.n-input__placeholder) { color: #9fb0c1; }
.action-panel :deep(.n-button--disabled) { opacity: 0.52; filter: saturate(0.5); }
.action-reason { margin: -0.5rem 0 0; color: #c5d2df; font-size: 0.82rem; text-align: center; }
.privacy-note {
  margin: 0;
  padding: 0.9rem 1rem;
  border: 1px solid rgba(105, 228, 220, 0.16);
  border-radius: 10px;
  background: rgba(105, 228, 220, 0.06);
  color: #c7d8e4;
  font-size: 0.84rem;
  line-height: 1.65;
}
.action-unavailable { min-height: 16rem; display: grid; align-content: center; }
.history { display: grid; gap: 0; }
.offers { margin-top: -1rem; }
.history-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 2rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--line);
}
.history-heading h2 { font-size: clamp(1.65rem, 3vw, 2.25rem); }
.history-heading p { max-width: 34rem; text-align: right; }
.history-row { padding: 1.5rem 0; border-bottom: 1px solid var(--line); }
.history-head { display: flex; justify-content: space-between; gap: 1rem; }
.history-head strong, .history-head span { display: block; }
.history-head strong { font-size: 1.08rem; font-variant-numeric: tabular-nums; }
.history-head span { margin-top: 0.35rem; }
.history-head time { color: var(--muted); font-size: 0.8rem; font-variant-numeric: tabular-nums; }
.adjustments { display: grid; gap: 0.55rem; margin-top: 1rem; }
.adjustments > div {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.045);
}
.adjustments small { color: var(--cyan); }
.fee-actions { display: flex; gap: 0.5rem; }
.inline-form { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: end; gap: 0.75rem; margin-top: 1rem; }
.notice { margin: 1rem 0 0; padding: 0.9rem 1rem; border-radius: 10px; background: rgba(255, 255, 255, 0.055); color: #c7d8e4; }
.error { color: var(--danger); }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 900px) {
  .service-workspace { grid-template-columns: 1fr; }
  .quota-panel { min-height: 26rem; }
}
@media (max-width: 700px) {
  .service-page { width: min(100% - 1.25rem, 76rem); padding-top: 1.25rem; }
  .back { margin-bottom: 2rem; }
  .service-content { gap: 3rem; }
  .service-intro { grid-template-columns: 1fr; gap: 1.25rem; }
  .status { width: fit-content; }
  .quota-panel { min-height: auto; gap: 2.5rem; padding: 1.25rem; }
  .quota-values { gap: 0.8rem; }
  .quota-values dd { font-size: clamp(1.75rem, 9vw, 2.5rem); }
  .quota-values dt { align-items: flex-start; }
  .action-panel { padding: 1.25rem; }
  .history-heading { align-items: start; flex-direction: column; gap: 0.25rem; }
  .history-heading p { text-align: left; }
  .adjustments > div, .inline-form { grid-template-columns: 1fr; }
  .fee-actions { justify-content: flex-start; }
}
@media (max-width: 460px) {
  .history-head { align-items: flex-start; flex-direction: column; }
  .fee-actions { flex-direction: column; }
}
@media (prefers-reduced-motion: reduce) {
  .back svg { transition: none; }
  .loading-panel span { animation-duration: 1.6s; }
}
</style>
