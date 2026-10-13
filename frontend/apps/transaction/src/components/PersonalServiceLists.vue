<script setup lang="ts">
import LsButton from '@lostsky/ui/components/LsButton.vue'
import { quantityScaleForStep } from '@lostsky/shared/quantity'
import LsEntityIdentity from '@lostsky/ui/components/LsEntityIdentity.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsSectionHeader from '@lostsky/ui/components/LsSectionHeader.vue'
import LsStatusTag from '@lostsky/ui/components/LsStatusTag.vue'
import { ArrowUpRight, ClipboardCheck, RadioTower, RotateCcw } from '@lucide/vue'
import { NInput } from 'naive-ui'
import { reactive, watch } from 'vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import type { ServiceAssignmentOffer, ServiceField, ServiceRedemption } from '../types'

const props = defineProps<{
  offers: ServiceAssignmentOffer[]
  available: ServiceRedemption[]
  assigned: ServiceRedemption[]
  acting?: boolean
}>()

const emit = defineEmits<{
  returnTask: [id: number, reason: string]
}>()
const returnReasons = reactive<Record<number, string>>({})
const returning = reactive<Record<number, boolean>>({})
watch(() => props.assigned.map(row => row.id), ids => {
  const activeIds = new Set(ids)
  for (const key of Object.keys(returning)) {
    const id = Number(key)
    if (activeIds.has(id)) continue
    delete returning[id]
    delete returnReasons[id]
  }
})
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
const closeReturnTask = (id: number) => {
  returning[id] = false
  returnReasons[id] = ''
}
</script>

<template>
  <div class="personal-service-lists">
    <LsPanel aria-labelledby="offer-service-title">
      <template #header>
        <LsSectionHeader id="offer-service-title" title="待我确认" description="进入详情填写接单资料，再接受顾客指定邀请。">
          <template #aside><span class="group-count" aria-live="polite">{{ offers.length }} 项</span></template>
        </LsSectionHeader>
      </template>
      <div v-if="!offers.length" class="queue-empty"><strong>没有待确认邀请</strong><span>新的指定邀请会在这里等待你接受或拒绝。</span></div>
      <div v-else class="task-list">
        <article v-for="offer in offers" :key="offer.id" class="task-row">
          <div class="task-summary">
            <span class="task-kind"><ClipboardCheck :size="16" aria-hidden="true" />指定邀请 #{{ offer.id }}</span>
            <LsPageLink :to="`/personal/service-offers/${offer.id}`" :label="offer.service?.name || `邀请 #${offer.id}`" :icon="ArrowUpRight" />
            <dl class="task-metrics">
              <div><dt>权益量</dt><dd>{{ quantityLabel(offer) }}</dd></div>
              <div><dt>预计分成</dt><dd>{{ money(offer.handler_cut) }}</dd></div>
              <div><dt>提交时间</dt><dd>{{ dateTime(offer.create_time) }}</dd></div>
            </dl>
          </div>
          <div class="task-customer"><span class="task-label">顾客</span><LsEntityIdentity type="customer" :name="customerName(offer)" size="sm" /></div>
          <div class="task-actions"><LsPageLink :to="`/personal/service-offers/${offer.id}`" label="查看详情" :icon="ArrowUpRight" /></div>
          <div v-if="offer.redemption_fields?.length" class="task-field-section"><span class="task-label">履约资料</span><dl class="field-list"><div v-for="field in offer.redemption_fields" :key="field.id"><dt>{{ field.name }}</dt><dd>{{ fieldValue(field) }}</dd></div></dl></div>
        </article>
      </div>
    </LsPanel>

    <LsPanel aria-labelledby="available-service-title">
      <template #header>
        <LsSectionHeader id="available-service-title" title="我可以接" description="进入详情选择本次接单数量、填写接单资料并确认领取。">
          <template #aside><span class="group-count" aria-live="polite">{{ available.length }} 项</span></template>
        </LsSectionHeader>
      </template>
      <div v-if="!available.length" class="queue-empty"><strong>当前没有公开任务</strong><span>符合接单池资格的新任务会出现在这里。</span></div>
      <div v-else class="task-list">
        <article v-for="row in available" :key="row.id" class="task-row">
          <div class="task-summary">
            <span class="task-kind"><RadioTower :size="16" aria-hidden="true" />公开任务 #{{ row.id }}</span>
            <LsPageLink :to="`/personal/services/available/${row.id}`" :label="row.service?.name || `任务 #${row.id}`" :icon="ArrowUpRight" />
            <dl class="task-metrics"><div><dt>权益量</dt><dd>{{ quantityLabel(row) }}</dd></div><div><dt>预计分成</dt><dd>{{ money(row.settlement_kind === 'unused' ? row.settled_handler_cut ?? 0 : row.handler_cut) }}</dd></div></dl>
          </div>
          <div class="task-customer"><span class="task-label">顾客</span><LsEntityIdentity type="customer" :name="customerName(row)" size="sm" /></div>
          <div class="task-actions"><LsPageLink :to="`/personal/services/available/${row.id}`" label="查看详情" :icon="ArrowUpRight" /></div>
          <div v-if="row.redemption_fields?.length" class="task-field-section"><span class="task-label">履约资料</span><dl class="field-list"><div v-for="field in row.redemption_fields" :key="field.id"><dt>{{ field.name }}</dt><dd>{{ fieldValue(field) }}</dd></div></dl></div>
        </article>
      </div>
    </LsPanel>

    <LsPanel aria-labelledby="assigned-service-title">
      <template #header>
        <LsSectionHeader id="assigned-service-title" title="我的接单" description="已经由你接取的进行中任务，可查看详情或退回公开池。">
          <template #aside><span class="group-count" aria-live="polite">{{ assigned.length }} 项</span></template>
        </LsSectionHeader>
      </template>
      <div v-if="!assigned.length" class="queue-empty"><strong>还没有进行中的接单</strong><span>接受邀请或领取公开任务后，会进入这里持续处理。</span></div>
      <div v-else class="task-list">
        <article v-for="row in assigned" :key="row.id" class="task-row">
          <div class="task-summary">
            <span class="task-kind"><ClipboardCheck :size="16" aria-hidden="true" />接单 #{{ row.id }}<LsStatusTag :label="row.completion_requested_at && row.status === 2 ? '待顾客确认' : row.status_label || `状态 ${row.status}`" :type="row.status === 3 ? 'success' : 'warning'" /></span>
            <LsPageLink :to="`/personal/services/${row.id}`" :label="row.service?.name || `任务 #${row.id}`" :icon="ArrowUpRight" />
            <dl class="task-metrics"><div><dt>权益量</dt><dd>{{ quantityLabel(row) }}</dd></div><div><dt>接取时间</dt><dd>{{ dateTime(row.started_at || row.create_time) }}</dd></div></dl>
          </div>
          <div class="task-customer"><span class="task-label">顾客</span><LsEntityIdentity type="customer" :name="customerName(row)" size="sm" /></div>
          <div v-if="row.status === 2 && !row.completion_requested_at && !returning[row.id]" class="task-actions"><LsButton variant="secondary" :loading="acting" @click="returning[row.id] = true"><template #icon><RotateCcw :size="16" /></template>退回任务</LsButton></div>
          <div v-if="row.status === 2 && !row.completion_requested_at && returning[row.id]" class="return-composer">
            <div><strong>退回公开池</strong><span>说明原因后，任务会重新开放给其他接单人。</span></div>
            <NInput v-model:value="returnReasons[row.id]" placeholder="填写退回原因" maxlength="500" show-count :input-props="{ 'aria-label': '退回原因' }" />
            <div class="return-actions"><LsButton variant="ghost" :disabled="acting" @click="closeReturnTask(row.id)">取消</LsButton><LsButton variant="secondary" :disabled="!returnReasons[row.id]?.trim()" :loading="acting" @click="returnTask(row.id)">确认退回</LsButton></div>
          </div>
        </article>
      </div>
    </LsPanel>
  </div>
</template>

<style scoped>

.personal-service-lists{display:grid;gap:1.25rem}.group-count{min-width:3.75rem;display:inline-flex;align-items:center;justify-content:center;padding:.4rem .65rem;color:var(--sky-lost-strong);background:color-mix(in oklch,var(--sky-lost),var(--surface) 86%);border-radius:var(--radius-sm);font-size:.78rem;font-weight:750;font-variant-numeric:tabular-nums}.queue-empty{min-height:5.5rem;display:flex;justify-content:center;flex-direction:column;gap:.25rem;color:var(--muted-ink)}.queue-empty strong{color:var(--ink);font-size:.9rem}.queue-empty span{font-size:.8rem;line-height:1.55}.task-list{min-width:0;overflow:hidden}.task-row{min-width:0;display:grid;grid-template-columns:minmax(0,1fr) 15rem 16rem;grid-template-areas:"summary customer actions" "fields fields fields";align-items:center;gap:1rem 1.5rem;padding:0 0 1.25rem;border-bottom:1px solid var(--border)}.task-row+.task-row{padding-top:1.25rem}.task-row:last-child{padding-bottom:0;border-bottom:0}.task-summary{grid-area:summary;min-width:0;display:grid;gap:.5rem}.task-kind{min-width:0;display:flex;align-items:center;gap:.4rem;color:var(--sky-lost-strong);font-size:.75rem;font-weight:700;line-height:1.4}.task-metrics,.field-list{margin:0}.task-metrics{display:flex;flex-wrap:wrap;gap:.45rem 1.25rem}.task-metrics div{min-width:6.5rem}.task-metrics dt,.field-list dt,.task-label{color:var(--muted-ink);font-size:.72rem;font-weight:650;line-height:1.4}.task-metrics dd,.field-list dd{margin:.12rem 0 0;color:var(--ink);font-size:.84rem;line-height:1.45;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}.task-customer{grid-area:customer;min-width:0;display:grid;gap:.45rem;padding-left:1.25rem;border-left:1px solid var(--border)}.task-actions{grid-area:actions;display:flex;align-items:center;justify-content:flex-end;gap:.5rem}.task-field-section{grid-area:fields;display:grid;grid-template-columns:6rem minmax(0,1fr);align-items:start;gap:1rem;padding-top:1rem;border-top:1px solid var(--border)}.field-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,10rem),1fr));gap:.75rem 1rem}.field-list div{min-width:0}.return-composer{grid-column:1/-1;display:grid;grid-template-columns:minmax(10rem,.65fr) minmax(14rem,1fr) auto;align-items:center;gap:1rem;padding:1rem;background:var(--cloud);border-radius:var(--radius-sm)}.return-composer>div:first-child{min-width:0;display:grid;gap:.2rem}.return-composer strong{font-size:.86rem}.return-composer span{color:var(--muted-ink);font-size:.76rem;line-height:1.5}.return-actions{display:flex;align-items:center;justify-content:flex-end;gap:.5rem}
@media(max-width:1280px){.task-row{grid-template-columns:minmax(0,1fr) minmax(11rem,.5fr);grid-template-areas:"summary customer" "actions actions" "fields fields"}.task-actions{justify-content:flex-start}.return-composer{grid-template-columns:1fr minmax(14rem,1.25fr)}.return-actions{grid-column:2}}
@media(max-width:700px){.personal-service-lists{gap:1rem}.task-row{grid-template-columns:1fr;grid-template-areas:"summary" "customer" "fields" "actions";gap:1rem}.task-customer{padding:1rem 0 0;border-top:1px solid var(--border);border-left:0}.task-actions{width:100%;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,9rem),1fr))}.task-actions>*{width:100%}.task-field-section{grid-template-columns:1fr;gap:.6rem}.field-list{grid-template-columns:1fr}.return-composer{grid-template-columns:1fr}.return-actions{grid-column:auto;justify-content:stretch}.return-actions>*{flex:1}.task-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}.task-metrics div{min-width:0}}
@media(max-width:420px){.task-metrics{grid-template-columns:1fr}.return-actions{flex-direction:column}.return-actions>*{width:100%}}
@media(prefers-reduced-motion:reduce){}
</style>
