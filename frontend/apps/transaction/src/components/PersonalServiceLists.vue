<script setup lang="ts">
import LsButton from '@lostsky/ui/components/LsButton.vue'
import { quantityScaleForStep } from '@lostsky/shared/quantity'
import LsResourceList from '@lostsky/ui/components/LsResourceList.vue'
import LsResourceRow from '@lostsky/ui/components/LsResourceRow.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsSectionHeader from '@lostsky/ui/components/LsSectionHeader.vue'
import LsStatusTag from '@lostsky/ui/components/LsStatusTag.vue'
import { ClipboardCheck, RadioTower, RotateCcw } from '@lucide/vue'
import { NInput } from 'naive-ui'
import { reactive, watch } from 'vue'
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
    <section aria-labelledby="offer-service-title">
      <LsSectionHeader id="offer-service-title" title="待我确认" description="进入详情填写接单资料，再接受顾客指定邀请。">
        <template #aside><span class="group-count">{{ offers.length }} 项</span></template>
      </LsSectionHeader>
      <LsEmptyState v-if="!offers.length" :source="offers" title="没有待确认邀请" description="新的指定邀请会在这里等待你接受或拒绝。" />
      <LsResourceList v-else aria-label="待确认邀请">
        <LsResourceRow v-for="offer in offers" :key="offer.id" :title="offer.service?.name || `邀请 #${offer.id}`" :to="`/personal/service-offers/${offer.id}`" :icon="ClipboardCheck" :description="`指定邀请 #${offer.id} · 顾客 ${customerName(offer)} · 权益量 ${quantityLabel(offer)} · 预计分成 ${money(offer.handler_cut)}`">
          <template #metadata>
            <span>提交于 {{ dateTime(offer.create_time) }}</span>
            <span v-for="field in offer.redemption_fields" :key="field.id">{{ field.name }}：{{ fieldValue(field) }}</span>
          </template>
        </LsResourceRow>
      </LsResourceList>
    </section>
    <section aria-labelledby="available-service-title">
      <LsSectionHeader id="available-service-title" title="我可以接" description="进入详情选择本次接单数量、填写接单资料并确认领取。">
        <template #aside><span class="group-count">{{ available.length }} 项</span></template>
      </LsSectionHeader>
      <LsEmptyState v-if="!available.length" :source="available" title="当前没有公开任务" description="符合接单池资格的新任务会出现在这里。" />
      <LsResourceList v-else aria-label="可接公开任务">
        <LsResourceRow v-for="row in available" :key="row.id" :title="row.service?.name || `任务 #${row.id}`" :to="`/personal/services/available/${row.id}`" :icon="RadioTower" :description="`公开任务 #${row.id} · 顾客 ${customerName(row)} · 权益量 ${quantityLabel(row)} · 预计分成 ${money(row.settlement_kind === 'unused' ? row.settled_handler_cut ?? 0 : row.handler_cut)}`">
          <template v-if="row.redemption_fields?.length" #metadata><span v-for="field in row.redemption_fields" :key="field.id">{{ field.name }}：{{ fieldValue(field) }}</span></template>
        </LsResourceRow>
      </LsResourceList>
    </section>
    <section aria-labelledby="assigned-service-title">
      <LsSectionHeader id="assigned-service-title" title="我的接单" description="已经由你接取的进行中任务，可查看详情或退回公开池。">
        <template #aside><span class="group-count">{{ assigned.length }} 项</span></template>
      </LsSectionHeader>
      <LsEmptyState v-if="!assigned.length" :source="assigned" title="还没有进行中的接单" description="接受邀请或领取公开任务后，会进入这里持续处理。" />
      <LsResourceList v-else aria-label="已接任务">
        <LsResourceRow v-for="row in assigned" :key="row.id" :title="row.service?.name || `任务 #${row.id}`" :to="`/personal/services/${row.id}`" :icon="ClipboardCheck" :description="`接单 #${row.id} · 顾客 ${customerName(row)} · 权益量 ${quantityLabel(row)} · 接取于 ${dateTime(row.started_at || row.create_time)}`">
          <template #status><LsStatusTag :label="row.completion_requested_at && row.status === 2 ? '待顾客确认' : row.status_label || `状态 ${row.status}`" :type="row.status === 3 ? 'success' : 'warning'" /></template>
          <template v-if="row.status === 2 && !row.completion_requested_at" #actions>
            <LsButton v-if="!returning[row.id]" variant="ghost" :loading="acting" @click="returning[row.id] = true"><template #icon><RotateCcw :size="16" /></template>退回任务</LsButton>
            <div v-else class="return-composer">
              <strong>退回公开池</strong><span>说明原因后，任务会重新开放给其他接单人。</span>
              <NInput v-model:value="returnReasons[row.id]" placeholder="填写退回原因" maxlength="500" show-count :input-props="{ 'aria-label': `任务 ${row.id} 的退回原因` }" />
              <div class="return-actions"><LsButton variant="ghost" :disabled="acting" @click="closeReturnTask(row.id)">取消</LsButton><LsButton variant="secondary" :disabled="!returnReasons[row.id]?.trim()" :loading="acting" @click="returnTask(row.id)">确认退回</LsButton></div>
            </div>
          </template>
        </LsResourceRow>
      </LsResourceList>
    </section>
  </div>
</template>

<style scoped>
.personal-service-lists { display: grid; gap: 1.5rem; min-width: 0; }
.personal-service-lists section { display: grid; gap: .75rem; min-width: 0; }
.group-count { color: var(--text-secondary); font-size: .8125rem; font-variant-numeric: tabular-nums; }
.return-composer { display: grid; gap: .5rem; width: min(18rem, 100%); min-width: 0; }
.return-composer > span { color: var(--text-secondary); font-size: .8125rem; overflow-wrap: anywhere; }
.return-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: .5rem; }
</style>
