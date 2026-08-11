<script setup lang="ts">
import { friendlyError } from '@lostsky/api/client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { ArrowLeft } from '@lucide/vue'
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
const values = reactive<Record<number, any>>({})
const cancelReasons = reactive<Record<number, string>>({})
const query = useQuery({ queryKey: computed(() => ['shop-service', id.value]), queryFn: () => shopApi.service(id.value) })
const handlers = useQuery({
  queryKey: computed(() => ['shop-service-handlers', id.value]),
  queryFn: () => shopApi.serviceHandlers(id.value),
  enabled: computed(() => Boolean(query.data.value && !query.data.value.is_expired)),
})
watch(() => query.data.value, data => {
  if (!data || quantity.value !== null || Number(data.available_quantity) <= 0) return
  quantity.value = Math.min(Number(data.available_quantity), Number(data.quantity_step))
}, { immediate: true })
const handlerOptions = computed(() => (handlers.data.value ?? []).map(item => ({ label: item.subject.name, value: item.entity_id })))
const dispatchOptions = computed(() => [
  { label: '指定接单人（等待对方确认）', value: 'direct' },
  ...(query.data.value?.allow_open_dispatch ? [{ label: '公开召唤（立即进入核销中）', value: 'open' }] : []),
])
const customerFields = computed(() => (query.data.value?.redemption_fields ?? []).filter(field => field.fill_stage === 'customer'))
const refresh = async () => Promise.all([
  client.invalidateQueries({ queryKey: ['shop-service', id.value] }),
  client.invalidateQueries({ queryKey: ['shop-services'] }),
])
const start = useMutation({
  mutationFn: () => {
    const data = query.data.value
    if (!data || quantity.value === null) throw new Error('请填写履约数量')
    const body = { quantity: quantity.value.toFixed(data.quantity_scale), memo: memo.value, field_values: values }
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
const offerStatus = (status: number | string) => typeof status === 'string' ? status : ({ 1: '待确认', 2: '已接受', 3: '已拒绝', 4: '已撤回', 5: '已过期' }[status] ?? '未知')
const offerPending = (status: number | string) => status === 1 || status === '待确认'
</script>

<template>
  <section class="service-page">
    <RouterLink class="back" to="/services"><ArrowLeft :size="18" />返回服务权益</RouterLink>
    <div v-if="query.isPending.value" class="panel">正在读取…</div>
    <div v-else-if="query.isError.value" class="panel error" role="alert"><strong>暂时无法读取服务权益</strong><p>{{ friendlyError(query.error.value) }}</p><NButton secondary @click="query.refetch()">重新加载</NButton></div>
    <article v-else-if="query.data.value">
      <header><div><h1 tabindex="-1">{{ query.data.value.service.name }}</h1><p>{{ query.data.value.service.description || '该服务暂无补充说明。' }}</p></div><strong>{{ query.data.value.is_expired ? '已过期' : query.data.value.is_exhausted ? '已用完' : '可使用' }}</strong></header>
      <dl class="quota">
        <div><dt>可用额度</dt><dd>{{ Number(query.data.value.available_quantity).toFixed(query.data.value.quantity_scale) }} {{ query.data.value.unit_name }}</dd></div>
        <div><dt>已核销</dt><dd>{{ Number(query.data.value.consumed_quantity).toFixed(query.data.value.quantity_scale) }} {{ query.data.value.unit_name }}</dd></div>
        <div><dt>核销中</dt><dd>{{ Number(query.data.value.reserved_quantity).toFixed(query.data.value.quantity_scale) }} {{ query.data.value.unit_name }}</dd></div>
        <div><dt>有效期</dt><dd>{{ query.data.value.expire_time ? formatDate(query.data.value.expire_time) : '长期有效' }}</dd></div>
      </dl>

      <form v-if="query.data.value.dispatch_available && !query.data.value.is_expired && Number(query.data.value.available_quantity) > 0" @submit.prevent="start.mutate()">
        <h2>发起一次履约</h2>
        <p class="form-hint">本次只占用填写的额度；其余额度可同时分给其他接单人。</p>
        <label>履约数量（{{ query.data.value.unit_name }}）<NInputNumber v-model:value="quantity" :min="Number(query.data.value.quantity_step)" :max="Number(query.data.value.available_quantity)" :step="Number(query.data.value.quantity_step)" :precision="query.data.value.quantity_scale" /></label>
        <label>接单方式<NSelect v-model:value="dispatchMode" :options="dispatchOptions" /></label>
        <label v-if="dispatchMode==='direct'">指定接单 Entity<NSelect v-model:value="handler" :options="handlerOptions" filterable :disabled="handlers.isError.value" placeholder="选择接单 Entity" /></label>
        <p v-else class="privacy-note">公开召唤提交后立即进入核销中；接单池内所有可接单 Entity 都能在领取前查看本次填写的完整核销字段。</p>
        <p v-if="handlers.isError.value" class="error" role="alert">暂时无法读取可选接单人：{{ friendlyError(handlers.error.value) }} <NButton text @click="handlers.refetch()">重试</NButton></p>
        <label v-for="field in customerFields" :key="field.id">{{ field.name }} <b v-if="field.is_required">*</b><NInput v-if="field.input_type==='textarea'||field.value_type==='text'||field.value_type==='json'" v-model:value="values[field.id]" type="textarea" /><NSelect v-else-if="['select','radio'].includes(field.input_type)||field.value_type==='select'" v-model:value="values[field.id]" :options="choices(field)" clearable /><NSelect v-else-if="field.value_type==='multi_select'||field.input_type==='checkbox'" v-model:value="values[field.id]" :options="choices(field)" multiple clearable /><NCheckbox v-else-if="field.value_type==='bool'" :checked="Boolean(values[field.id])" @update:checked="value=>values[field.id]=value?1:0">是</NCheckbox><NInputNumber v-else-if="['int','decimal'].includes(field.value_type)" v-model:value="values[field.id]" :precision="field.value_type==='int'?0:2" /><NDatePicker v-else-if="['date','datetime'].includes(field.value_type)" v-model:value="values[field.id]" :type="field.value_type==='date'?'date':'datetime'" /><NInput v-else v-model:value="values[field.id]" /></label>
        <label>备注<NInput v-model:value="memo" type="textarea" /></label>
        <NButton attr-type="submit" type="primary" size="large" :disabled="quantity===null || (dispatchMode==='direct' && (handler===null || handlers.isError.value))" :loading="start.isPending.value">{{ dispatchMode==='direct' ? '发送接单邀请' : '发布公开任务' }}</NButton>
      </form>
      <p v-else-if="!query.data.value.dispatch_available" class="notice">当前团队未开通可用的 Transaction Ability，暂不能发起新的指定邀请或公开任务。</p>

      <section v-if="query.data.value.assignment_offers?.length" class="history offers">
        <h2>指定接单邀请</h2>
        <section v-for="offer in query.data.value.assignment_offers" :key="offer.id" class="history-row">
          <div class="history-head"><div><strong>{{ Number(offer.quantity).toFixed(query.data.value.quantity_scale) }} {{ query.data.value.unit_name }}</strong><span>#{{ offer.id }} · {{ offerStatus(offer.status) }} · {{ offer.target_handler?.name || offer.target_handler?.profile?.name || '指定 Entity' }}</span></div><time v-if="offerPending(offer.status)">有效至 {{ formatDate(offer.expire_time) }}</time></div>
          <p v-if="offer.decision_reason" class="form-hint">{{ offer.decision_reason }}</p>
          <NButton v-if="offerPending(offer.status)" secondary :loading="withdrawOffer.isPending.value" @click="withdrawOffer.mutate(offer.id)">撤回邀请</NButton>
        </section>
      </section>

      <section class="history">
        <h2>履约记录</h2>
        <p v-if="!query.data.value.instances?.length" class="empty">尚未发起履约。</p>
        <section v-for="instance in query.data.value.instances" :key="instance.id" class="history-row">
          <div class="history-head"><div><strong>{{ Number(instance.quantity).toFixed(query.data.value.quantity_scale) }} {{ query.data.value.unit_name }}</strong><span>#{{ instance.id }} · {{ serviceStatus(instance.status) }} · {{ instance.handler?.name || instance.handler?.profile?.name || '未分配接单人' }}</span></div><time v-if="instance.create_time">{{ formatDate(instance.create_time) }}</time></div>
          <div v-if="instance.adjustments?.length" class="adjustments"><div v-for="fee in instance.adjustments" :key="fee.id"><span>{{ fee.name }} · ¥{{ fee.total_price }}</span><small>{{ fee.status===1?'待确认':fee.status===2?'已确认':'已取消' }}</small><div v-if="fee.status===1 && instance.status===2" class="fee-actions"><NButton size="small" type="primary" :loading="adjustment.isPending.value" @click="adjustment.mutate({instanceId:instance.id,adjustmentId:fee.id,accept:true})">确认并支付</NButton><NButton size="small" secondary :loading="adjustment.isPending.value" @click="adjustment.mutate({instanceId:instance.id,adjustmentId:fee.id,accept:false})">拒绝</NButton></div></div></div>
          <form v-if="instance.status===2 && !pendingCancel(instance)" class="inline-form" @submit.prevent="cancel.mutate(instance.id)"><label>取消原因<NInput v-model:value="cancelReasons[instance.id]" placeholder="例如：未通过、临时无法履约" /></label><NButton attr-type="submit" secondary type="warning" :loading="cancel.isPending.value">申请取消</NButton></form>
          <p v-else-if="instance.status===2" class="notice">取消申请正在等待处理，期间不会改派或完成履约。</p>
          <p v-else-if="instance.status===1" class="notice">该切片额度已释放，可在上方重新发送指定邀请或发布公开任务。</p>
        </section>
      </section>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
    </article>
  </section>
</template>

<style scoped>
.service-page{width:min(860px,calc(100% - 32px));margin:auto;padding:48px 0 96px}.back{display:inline-flex;gap:7px;align-items:center;color:#9fb0c5;margin-bottom:24px}.service-page>article,.panel{padding:28px;background:#101d30;border:1px solid #263951;border-radius:16px}.service-page header{display:flex;justify-content:space-between;gap:20px}.service-page h1{margin:0;font-size:clamp(2rem,6vw,3.5rem)}.service-page header p,.form-hint,.empty,.history-row span{color:#9fb0c5}.service-page header>strong{color:#69e4dc}.quota{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:28px 0}.quota div{padding:14px;background:#0b1525;border-radius:10px}.quota dt{color:#8093aa;font-size:.78rem}.quota dd{margin:5px 0 0;font-weight:700}form{display:grid;gap:16px;margin-top:28px;padding-top:24px;border-top:1px solid #263951}form h2,.history h2{margin:0}form label{display:grid;gap:7px}form b{color:#ff9f68}.privacy-note{margin:0;padding:12px 14px;border-left:3px solid #69e4dc;background:#0b1525;color:#b9c7d7}.history{margin-top:34px;padding-top:28px;border-top:1px solid #263951}.offers{margin-top:28px}.history-row{padding:20px 0;border-bottom:1px solid #263951}.history-head{display:flex;justify-content:space-between;gap:16px}.history-head strong,.history-head span{display:block}.history-head span{margin-top:5px}.history-head time{color:#8093aa;font-size:.8rem}.adjustments{display:grid;gap:8px;margin-top:14px}.adjustments>div{display:grid;grid-template-columns:1fr auto auto;align-items:center;gap:10px;padding:12px;background:#0b1525;border-radius:10px}.adjustments small{color:#69e4dc}.fee-actions{display:flex;gap:8px}.inline-form{grid-template-columns:1fr auto;align-items:end;margin-top:16px;padding-top:16px}.notice{margin-top:16px;padding:14px;background:#162741;border-radius:10px;color:#b9c7d7}.error{color:#ff8d93}@media(max-width:700px){.service-page>article{padding:20px}.quota{grid-template-columns:repeat(2,1fr)}.adjustments>div,.inline-form{grid-template-columns:1fr}.fee-actions{justify-content:flex-start}}@media(max-width:460px){.quota{grid-template-columns:1fr}.history-head{align-items:flex-start;flex-direction:column}}
</style>
