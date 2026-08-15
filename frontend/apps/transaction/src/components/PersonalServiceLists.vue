<script setup lang="ts">
import LsButton from '@lostsky/ui/components/LsButton.vue'
import { quantityScaleForStep } from '@lostsky/shared/quantity'
import LsEntityIdentity from '@lostsky/ui/components/LsEntityIdentity.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsSectionHeader from '@lostsky/ui/components/LsSectionHeader.vue'
import { NInput } from 'naive-ui'
import { reactive } from 'vue'
import { RouterLink } from 'vue-router'
import type { ServiceAssignmentOffer, ServiceField, ServiceRedemption } from '../types'

defineProps<{
  offers: ServiceAssignmentOffer[]
  available: ServiceRedemption[]
  assigned: ServiceRedemption[]
  acting?: boolean
}>()

const emit = defineEmits<{
  acceptOffer: [id: number]
  rejectOffer: [id: number]
  claim: [id: number]
  returnTask: [id: number, reason: string]
}>()
const returnReasons = reactive<Record<number, string>>({})
const quantityLabel = (row: ServiceRedemption | ServiceAssignmentOffer) => {
  const scale = quantityScaleForStep(row.entitlement?.quantity_step)
  return `${Number(row.quantity).toFixed(scale)} ${row.entitlement?.unit_name || '单位'}`
}
const customerName = (row: ServiceRedemption | ServiceAssignmentOffer) =>
  (row.customer as any)?.profile?.name || (row.customer as any)?.name || 'Customer'
const dateTime = (value: number | null | undefined) => value ? new Date(value * 1000).toLocaleString() : '—'
const money = (value: unknown) => `¥${Number(value || 0).toFixed(2)}`
const fieldValue = (field: ServiceField) => {
  const value = field.value
  if (value === null || value === undefined || value === '') return '—'
  if (Array.isArray(value)) return value.join('、') || '—'
  if (typeof value === 'object') {
    const item = Object.values(value as Record<string, unknown>).find(candidate => candidate !== null && candidate !== '')
    return item === undefined ? '—' : String(item)
  }
  return String(value)
}
const returnTask = (id: number) => {
  emit('returnTask', id, returnReasons[id] ?? '')
}
</script>

<template>
  <div class="personal-service-lists">
    <LsPanel aria-labelledby="offer-service-title">
      <template #header>
        <LsSectionHeader id="offer-service-title" title="待我确认" description="顾客（Customer）指定当前实体（Entity）、等待处理的接单邀请">
          <template #aside><span class="group-count" aria-live="polite">{{ offers.length }} 个</span></template>
        </LsSectionHeader>
      </template>
      <p v-if="!offers.length" class="empty">当前没有待确认邀请。</p>
      <div v-else class="task-list">
        <article v-for="offer in offers" :key="offer.id">
          <div class="task-main">
            <RouterLink :to="`/personal/service-offers/${offer.id}`"><strong>{{ offer.service?.name || `邀请 #${offer.id}` }}</strong><small>指定邀请 · {{ quantityLabel(offer) }} · 预计接单分成 {{ money(offer.handler_cut) }}</small></RouterLink>
            <LsEntityIdentity type="customer" :name="customerName(offer)" size="sm" />
            <dl class="task-facts"><div><dt>提交时间</dt><dd>{{ dateTime(offer.create_time) }}</dd></div></dl>
            <dl v-if="offer.redemption_fields?.length" class="field-list"><div v-for="field in offer.redemption_fields" :key="field.id"><dt>{{ field.name }}</dt><dd>{{ fieldValue(field) }}</dd></div></dl>
          </div>
          <div class="task-actions"><LsButton size="sm" variant="secondary" :loading="acting" @click="emit('rejectOffer', offer.id)">拒绝</LsButton><LsButton size="sm" :loading="acting" @click="emit('acceptOffer', offer.id)">接受邀请</LsButton></div>
        </article>
      </div>
    </LsPanel>

    <LsPanel aria-labelledby="available-service-title">
      <template #header>
        <LsSectionHeader id="available-service-title" title="我可以接" description="当前实体（Entity）所在接单池中的公开任务">
          <template #aside><span class="group-count" aria-live="polite">{{ available.length }} 个</span></template>
        </LsSectionHeader>
      </template>
      <p v-if="!available.length" class="empty">当前接单池没有公开任务。</p>
      <div v-else class="task-list">
        <article v-for="row in available" :key="row.id">
          <div class="task-main">
            <RouterLink :to="`/personal/services/available/${row.id}`"><strong>{{ row.service?.name || `任务 #${row.id}` }}</strong><small>公开召唤 · {{ quantityLabel(row) }} · 预计接单分成 {{ money((row as any).handler_cut) }}</small></RouterLink>
            <LsEntityIdentity type="customer" :name="customerName(row)" size="sm" />
            <dl v-if="row.redemption_fields?.length" class="field-list"><div v-for="field in row.redemption_fields" :key="field.id"><dt>{{ field.name }}</dt><dd>{{ fieldValue(field) }}</dd></div></dl>
          </div>
          <LsButton class="claim-action" size="sm" :loading="acting" @click="emit('claim', row.id)">领取任务</LsButton>
        </article>
      </div>
    </LsPanel>

    <LsPanel aria-labelledby="assigned-service-title">
      <template #header>
        <LsSectionHeader id="assigned-service-title" title="我的接单" description="已由当前实体（Entity）接取、尚未退回的履约任务">
          <template #aside><span class="group-count" aria-live="polite">{{ assigned.length }} 个</span></template>
        </LsSectionHeader>
      </template>
      <p v-if="!assigned.length" class="empty">接受邀请或领取公开任务后会显示在这里。</p>
      <div v-else class="task-list">
        <article v-for="row in assigned" :key="row.id">
          <div class="task-main">
            <RouterLink :to="`/personal/services/${row.id}`"><strong>{{ row.service?.name || `任务 #${row.id}` }}</strong><small>{{ quantityLabel(row) }} · {{ row.status_label || `状态 ${row.status}` }}</small></RouterLink>
            <LsEntityIdentity type="customer" :name="customerName(row)" size="sm" />
          </div>
          <div v-if="row.status === 2" class="return-action"><NInput v-model:value="returnReasons[row.id]" size="small" placeholder="填写退回原因" /><LsButton size="sm" variant="secondary" :disabled="!returnReasons[row.id]?.trim()" :loading="acting" @click="returnTask(row.id)">退回公开池</LsButton></div>
        </article>
      </div>
    </LsPanel>
  </div>
</template>

<style scoped>
.personal-service-lists{display:grid;gap:1.75rem}.group-count,.empty,.task-list small,.task-facts dt,.field-list dt{color:var(--muted-ink);font-size:.8rem}.group-count{font-variant-numeric:tabular-nums}.empty,.task-facts,.field-list{margin:0}.empty{line-height:1.6}.task-list{min-width:0;overflow:hidden}.task-list>article{min-width:0;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:1rem;padding:0 0 1rem;border-bottom:1px solid var(--border)}.task-list>article+article{padding-top:1rem}.task-list>article:last-child{padding-bottom:0;border-bottom:0}.task-main{min-width:0;display:grid;gap:.75rem}.task-main>a{min-width:0;color:var(--ink)}.task-main>a:hover strong{color:var(--primary)}.task-main strong,.task-main small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.task-main small{margin-top:.2rem}.task-facts,.field-list{display:flex;flex-wrap:wrap;gap:.5rem 1rem}.task-facts div,.field-list div{min-width:8rem}.task-facts dd,.field-list dd{margin:.15rem 0 0;overflow-wrap:anywhere}.field-list{padding:.75rem;background:var(--cloud);border-radius:8px}.task-actions,.return-action{display:flex;align-items:center;gap:.5rem}.return-action{width:min(24rem,100%)}.return-action .n-input{min-width:10rem}
@media(max-width:700px){.task-list>article{grid-template-columns:1fr}.task-actions,.return-action{width:100%}.task-actions>*{flex:1}.return-action{align-items:stretch;flex-direction:column}.claim-action{width:100%}.task-facts,.field-list{display:grid;grid-template-columns:1fr}.task-facts div,.field-list div{min-width:0}}
</style>
