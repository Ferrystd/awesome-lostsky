<script setup lang="ts">
import { friendlyError } from '@lostsky/api/client'
import { quantityScaleForStep } from '@lostsky/shared/quantity'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsFormActions from '@lostsky/ui/components/LsFormActions.vue'
import LsFormList from '@lostsky/ui/components/LsFormList.vue'
import LsFormSection from '@lostsky/ui/components/LsFormSection.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import LsSwitchField from '@lostsky/ui/components/LsSwitchField.vue'
import { feedback } from '@lostsky/ui/feedback'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { ChevronDown } from '@lucide/vue'
import { NInput, NInputNumber, NSelect, useDialog } from 'naive-ui'
import { computed, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { canManage, entitlementManagement, hasManagePermission, loadManageAccess, resourceOwnerLabel } from '../../lib'
import { calculateDefaultServiceDistribution, calculateServiceTeamCut } from '../../service-distribution'

type Item = {
  key: string
  expanded: boolean
  service_id: number | null
  quantity: number | null
  valid_days: number | null
  unit_price: number | null
  unit_cost: number | null
  unit_handler_cut: number | null
  unit_sender_cut: number | null
  unit_cs_cut: number | null
}

let sequence = 0
let itemDefaults = { validDays: 30, handlerRate: 80, senderRate: 15, csRate: 0 }
const makeItem = (): Item => ({
  key: `new-${++sequence}`,
  expanded: true,
  service_id: null,
  quantity: 1,
  valid_days: itemDefaults.validDays,
  unit_price: 0,
  unit_cost: 0,
  unit_handler_cut: 0,
  unit_sender_cut: 0,
  unit_cs_cut: 0,
})

const route = useRoute()
const router = useRouter()
const dialog = useDialog()
const id = computed(() => Number(route.params.id || 0))
const editing = computed(() => id.value > 0)
const scope = computed(() => route.meta.workspace === 'personal' ? 'personal' : 'team')
const management = computed(() => entitlementManagement(scope.value))
const personal = computed(() => management.value.personal)
const access = useQuery({ queryKey: ['shop-manage-access'], queryFn: () => loadManageAccess() })
const expectedEntityId = computed(() => access.data.value?.identity?.entity_id ?? 0)
const canRepriceSharedService = computed(() => hasManagePermission(access.data.value?.permissions ?? [], 'shop.product.self.package.reprice'))
const copySourceId = computed(() => Number(route.query.copy || 0))
const copying = computed(() => !editing.value && copySourceId.value > 0)
const sourceId = computed(() => editing.value ? id.value : copySourceId.value)
const form = reactive({ name: '', pricing_mode: 2 as 1 | 2, is_active: 1, services: [makeItem()] as Item[] })
const options = useQuery({ queryKey: computed(() => [scope.value, 'manage-options']), queryFn: () => management.value.options() })
const detail = useQuery({
  queryKey: computed(() => [scope.value, 'manage-package', sourceId.value]),
  queryFn: () => management.value.package(sourceId.value),
  enabled: computed(() => sourceId.value > 0),
})
watch(() => options.data.value?.service_defaults, defaults => {
  if (!defaults) return
  itemDefaults = {
    validDays: defaults.default_valid_days,
    handlerRate: defaults.default_handler_rate_percent,
    senderRate: defaults.default_sender_rate_percent,
    csRate: defaults.default_cs_rate_percent,
  }
  if (editing.value || copying.value || form.services.length !== 1 || form.services[0].service_id !== null) return
  Object.assign(form.services[0], {
    valid_days: defaults.default_valid_days,
  })
}, { immediate: true })

function pricingModeNumber(value: unknown): 1 | 2 {
  return value === 1 || value === '1' || value === '历史均摊' ? 1 : 2
}
watch(() => detail.data.value, data => {
  if (!data) return
  Object.assign(form, {
    name: copying.value ? `${data.name}（副本）` : data.name,
    pricing_mode: pricingModeNumber(data.pricing_mode),
    is_active: copying.value ? 1 : data.is_active,
    services: (data.services ?? []).map(item => ({
      key: `service-${item.id ?? item.service_id}`,
      expanded: Boolean(data.is_pricing_locked),
      service_id: item.service_id,
      quantity: Number(item.quantity),
      valid_days: item.valid_days,
      unit_price: Number(item.unit_price ?? 0),
      unit_cost: Number(item.unit_cost ?? 0),
      unit_handler_cut: Number(item.unit_handler_cut ?? 0),
      unit_sender_cut: Number(item.unit_sender_cut ?? 0),
      unit_cs_cut: Number(item.unit_cs_cut ?? 0),
    })),
  })
}, { immediate: true })

const availableServices = computed(() => {
  const services = [...(options.data.value?.services ?? [])]
  for (const item of detail.data.value?.services ?? []) {
    if (item.service && !services.some(service => service.id === item.service?.id)) services.push(item.service)
  }
  return services
})
const serviceOptions = computed(() => availableServices.value.map(service => ({
  label: `${service.name}（${service.unit_name || '次'}） · ${resourceOwnerLabel(service, expectedEntityId.value)}`,
  value: service.id,
  disabled: !service.is_active,
})))
const selectedService = (item: Item) => availableServices.value.find(service => service.id === item.service_id)
const sharedPricingLocked = (item: Item) => Boolean(personal.value && selectedService(item)?.owner_entity_id == null && !canRepriceSharedService.value)
const moneyLocked = (item: Item) => pricingLocked.value || sharedPricingLocked(item)
const sharedPricingHint = (item: Item) => sharedPricingLocked(item)
  ? '团队公用服务的价格、成本与分成沿用服务定义；需要 shop.product.self.package.reprice 才能调整。'
  : '默认使用服务价格；修改后按团队默认比例重算人员分成。'
const quantityScale = (item: Item) => quantityScaleForStep(selectedService(item)?.quantity_step)
const quantityStep = (item: Item) => Number(selectedService(item)?.quantity_step ?? 1)
const itemized = computed(() => form.pricing_mode === 2)
const pricingLocked = computed(() => editing.value && Boolean(detail.data.value?.is_pricing_locked))

const finite = (value: number | null) => typeof value === 'number' && Number.isFinite(value)
const numeric = (value: number | null) => finite(value) ? value as number : 0
const fixed = (value: number | null, precision: number) => numeric(value).toFixed(precision)
const nonNegative = (value: number | null) => finite(value) && numeric(value) >= 0
const positive = (value: number | null) => finite(value) && numeric(value) > 0

function itemMoney(item: Item) {
  const available = Math.round((numeric(item.unit_price) - numeric(item.unit_cost)) * 100)
  const handler = Math.round(numeric(item.unit_handler_cut) * 100)
  const sender = Math.round(numeric(item.unit_sender_cut) * 100)
  const cs = Math.round(numeric(item.unit_cs_cut) * 100)
  return { handler, sender, cs, team: available - handler - sender - cs }
}
function selectService(item: Item, serviceId: number | null) {
  item.service_id = serviceId
  const service = selectedService(item)
  if (!service) return
  const step = Number(service.quantity_step ?? 1)
  const currentQuantity = numeric(item.quantity)
  Object.assign(item, {
    quantity: currentQuantity >= step && Math.abs(currentQuantity / step - Math.round(currentQuantity / step)) <= 1e-8
      ? currentQuantity
      : step,
    unit_price: Number(service.default_total_price ?? 0),
    unit_cost: Number(service.default_cost ?? 0),
    unit_handler_cut: Number(service.default_handler_cut ?? 0),
    unit_sender_cut: Number(service.default_sender_cut ?? 0),
    unit_cs_cut: Number(service.default_cs_cut ?? 0),
  })
}
function updateItemMoney(item: Item, field: 'unit_price' | 'unit_cost', value: number | null) {
  item[field] = value
  const distribution = calculateDefaultServiceDistribution(item.unit_price, item.unit_cost, {
    handler: itemDefaults.handlerRate,
    sender: itemDefaults.senderRate,
    customerService: itemDefaults.csRate,
  })
  Object.assign(item, {
    unit_handler_cut: distribution.handler,
    unit_sender_cut: distribution.sender,
    unit_cs_cut: distribution.customerService,
  })
}
const itemTeamCut = (item: Item) => calculateServiceTeamCut(
  item.unit_price,
  item.unit_cost,
  item.unit_handler_cut,
  item.unit_sender_cut,
  item.unit_cs_cut,
)
const summary = computed(() => {
  const totals = { price: 0, cost: 0, handler: 0, sender: 0, cs: 0, team: 0 }
  for (const item of form.services) {
    const money = itemMoney(item)
    const quantity = numeric(item.quantity)
    totals.price += Math.round(numeric(item.unit_price) * 100) * quantity
    totals.cost += Math.round(numeric(item.unit_cost) * 100) * quantity
    totals.handler += money.handler * quantity
    totals.sender += money.sender * quantity
    totals.cs += money.cs * quantity
    totals.team += money.team * quantity
  }
  return totals
})
const currency = (cents: number) => (cents / 100).toFixed(2)
const valid = computed(() => {
  if (!form.name.trim() || !form.services.length) return false
  const ids = form.services.map(item => item.service_id).filter(Boolean)
  if (new Set(ids).size !== ids.length) return false
  return form.services.every(item => {
    if (!item.service_id || !positive(item.quantity) || !nonNegative(item.valid_days)) return false
    const step = quantityStep(item)
    if (Math.abs(numeric(item.quantity) / step - Math.round(numeric(item.quantity) / step)) > 1e-8) return false
    if (!itemized.value) return true
    if (!nonNegative(item.unit_price) || !nonNegative(item.unit_cost) || numeric(item.unit_cost) > numeric(item.unit_price)) return false
    return nonNegative(item.unit_handler_cut) && nonNegative(item.unit_sender_cut)
      && nonNegative(item.unit_cs_cut) && itemMoney(item).team >= 0
  })
})

const save = useMutation({
  mutationFn: () => management.value.savePackage(editing.value ? id.value : null, {
    name: form.name,
    pricing_mode: form.pricing_mode,
    is_active: form.is_active,
    services: form.services.map((item, sort) => ({
      service_id: item.service_id,
      quantity: fixed(item.quantity, quantityScale(item)),
      valid_days: numeric(item.valid_days),
      unit_price: fixed(item.unit_price, 2),
      unit_cost: fixed(item.unit_cost, 2),
      unit_handler_cut: fixed(item.unit_handler_cut, 2),
      unit_sender_cut: fixed(item.unit_sender_cut, 2),
      unit_cs_cut: fixed(item.unit_cs_cut, 2),
      sort,
    })),
  }, expectedEntityId.value),
  onSuccess: data => {
    feedback.success('权益包已保存')
    void router.push(`${management.value.routePrefix}/packages/${data.id}`)
  },
})
const disable = useMutation({ mutationFn: () => management.value.disablePackage(id.value, expectedEntityId.value), onSuccess: () => router.push(`${management.value.routePrefix}/packages`) })
function stop() {
  dialog.warning({
    title: '停用权益包',
    content: '已完成订单和已领取服务不会改变；新商品配置不再使用它。',
    positiveText: '确认停用',
    negativeText: '返回',
    onPositiveClick: () => disable.mutate(),
  })
}
</script>

<template>
  <div class="manage-page">
    <LsPageHeader
      :title="editing ? (personal ? '编辑本人权益包' : '编辑权益包') : (copying ? '复制权益包' : (personal ? '新建本人权益包' : '新建权益包'))"
      description="不同服务可使用不同单位、授予额度、单价和分成；实际核销时再从额度中创建履约切片。"
      :back-to="`${management.routePrefix}/packages`"
      back-label="返回权益包"
    >
      <template #actions>
        <LsButton v-if="pricingLocked && canManage(management.permission)" variant="secondary" @click="router.push(`${management.routePrefix}/packages/new?copy=${id}`)">复制为新权益包</LsButton>
        <LsButton v-if="editing && canManage(management.disablePermission)" variant="danger" @click="stop">停用权益包</LsButton>
      </template>
    </LsPageHeader>
    <form class="manage-form" @submit.prevent="save.mutate()">
      <LsFormSection title="基本信息">
        <p v-if="personal" class="form-intro" role="note">此权益包自动归属当前 Entity；可组合本人服务和已启用的团队公用服务。</p>
        <LsField label="权益包名称" for-id="package-name" required><NInput id="package-name" v-model:value="form.name" maxlength="100" /></LsField>
        <LsField v-if="form.pricing_mode === 1" label="计价方式" for-id="package-pricing-mode" hint="历史权益包继续按订单总额均摊；如需分项计价，请新建权益包。"><NInput id="package-pricing-mode" value="历史均摊" disabled /></LsField>
        <LsSwitchField id="package-active" :model-value="form.is_active === 1" label="启用状态" description="停用后不能用于新的卡活动或商品配置。" @update:model-value="value => form.is_active = value ? 1 : 0" />
      </LsFormSection>

      <LsFormSection title="服务权益" description="为每项服务设置授予额度；额度可按服务定义的最小步长分多次履约。">
        <p v-if="pricingLocked" class="form-intro" role="note">该权益包已被商品或兑换活动引用，服务项目和计价已冻结。请复制为新权益包后调整。</p>
        <LsFormList v-model="form.services" :item-key="item => item.key" :create-item="makeItem" item-label="服务" add-label="添加服务" :disabled="pricingLocked">
          <template #item="{ item }">
            <div class="package-item-fields">
              <button
                type="button"
                class="package-item-summary"
                :aria-expanded="item.expanded"
                :aria-controls="`package-editor-${item.key}`"
                @click="item.expanded = !item.expanded"
              >
                <span>
                  <strong>{{ selectedService(item)?.name || '尚未选择服务' }}</strong>
                  <small>额度 {{ numeric(item.quantity) }} {{ selectedService(item)?.unit_name || '单位' }} · {{ numeric(item.valid_days) === 0 ? '永久有效' : `${numeric(item.valid_days)} 天` }}</small>
                </span>
                <span v-if="itemized" class="package-item-summary__money">¥{{ fixed(item.unit_price, 2) }} / {{ selectedService(item)?.unit_name || '单位' }}</span>
                <ChevronDown :size="18" :class="{ expanded: item.expanded }" aria-hidden="true" />
              </button>
              <div v-if="item.expanded" :id="`package-editor-${item.key}`" class="package-item-editor">
                <section class="package-field-group" data-package-group="entitlement" :aria-labelledby="`package-group-entitlement-title-${item.key}`">
                  <h4 :id="`package-group-entitlement-title-${item.key}`">额度</h4>
                  <LsField label="服务" :for-id="`package-service-${item.key}`" required><NSelect :id="`package-service-${item.key}`" :value="item.service_id" :options="serviceOptions" filterable :disabled="pricingLocked" @update:value="value => selectService(item, value)" /></LsField>
                  <LsField label="授予额度" :for-id="`package-quantity-${item.key}`" required :hint="selectedService(item) ? `单位：${selectedService(item)?.unit_name}；最小步长 ${quantityStep(item)}` : '先选择服务'"><NInputNumber :id="`package-quantity-${item.key}`" v-model:value="item.quantity" :min="quantityStep(item)" :max="999999" :step="quantityStep(item)" :precision="quantityScale(item)" :disabled="pricingLocked" /></LsField>
                  <LsField label="有效天数" :for-id="`package-days-${item.key}`" hint="0 表示永久"><NInputNumber :id="`package-days-${item.key}`" v-model:value="item.valid_days" :min="0" :disabled="pricingLocked" /></LsField>
                </section>
                <template v-if="itemized">
                  <section class="package-field-group" data-package-group="pricing" :aria-labelledby="`package-group-pricing-title-${item.key}`">
                    <h4 :id="`package-group-pricing-title-${item.key}`">价格与成本</h4>
                    <LsField label="单位价格" :for-id="`package-price-${item.key}`" required :hint="sharedPricingHint(item)"><NInputNumber :id="`package-price-${item.key}`" :value="item.unit_price" :min="0" :step="0.01" :precision="2" :disabled="moneyLocked(item)" @update:value="value => updateItemMoney(item, 'unit_price', value)" /></LsField>
                    <LsField label="单位成本" :for-id="`package-cost-${item.key}`"><NInputNumber :id="`package-cost-${item.key}`" :value="item.unit_cost" :min="0" :step="0.01" :precision="2" :disabled="moneyLocked(item)" @update:value="value => updateItemMoney(item, 'unit_cost', value)" /></LsField>
                  </section>
                  <section class="package-field-group" data-package-group="distribution" :aria-labelledby="`package-group-distribution-title-${item.key}`">
                    <h4 :id="`package-group-distribution-title-${item.key}`">分成</h4>
                    <LsField label="单位接单分成" :for-id="`package-handler-cut-${item.key}`"><NInputNumber :id="`package-handler-cut-${item.key}`" v-model:value="item.unit_handler_cut" :min="0" :precision="2" :disabled="moneyLocked(item)" /></LsField>
                    <LsField label="单位发单分成" :for-id="`package-sender-cut-${item.key}`"><NInputNumber :id="`package-sender-cut-${item.key}`" v-model:value="item.unit_sender_cut" :min="0" :precision="2" :disabled="moneyLocked(item)" /></LsField>
                    <LsField label="单位客服分成" :for-id="`package-cs-cut-${item.key}`"><NInputNumber :id="`package-cs-cut-${item.key}`" v-model:value="item.unit_cs_cut" :min="0" :precision="2" :disabled="moneyLocked(item)" /></LsField>
                    <LsField label="单位团队分成" :for-id="`package-team-cut-${item.key}`" hint="自动取单位价格扣除成本与人员分成后的余额。"><NInputNumber :id="`package-team-cut-${item.key}`" :value="itemTeamCut(item)" :precision="2" disabled /></LsField>
                  </section>
                </template>
              </div>
            </div>
          </template>
        </LsFormList>
      </LsFormSection>

      <LsFormSection v-if="itemized" title="套餐金额汇总" description="团队分成始终取每个服务项扣除成本与人员分成后的余额。">
        <dl class="package-summary">
          <div><dt>售价</dt><dd>¥{{ currency(summary.price) }}</dd></div>
          <div><dt>成本</dt><dd>¥{{ currency(summary.cost) }}</dd></div>
          <div><dt>接单分成</dt><dd>¥{{ currency(summary.handler) }}</dd></div>
          <div><dt>发单分成</dt><dd>¥{{ currency(summary.sender) }}</dd></div>
          <div><dt>客服分成</dt><dd>¥{{ currency(summary.cs) }}</dd></div>
          <div><dt>团队分成</dt><dd>¥{{ currency(summary.team) }}</dd></div>
        </dl>
      </LsFormSection>

      <LsInlineError v-if="detail.isError.value" :message="friendlyError(detail.error.value)" />
      <LsInlineError v-if="save.isError.value" :message="friendlyError(save.error.value)" />
      <LsFormActions>
        <LsButton type="button" variant="secondary" @click="router.back()">取消</LsButton>
        <LsButton type="submit" :disabled="!valid || !canManage(management.permission) || (personal && !expectedEntityId)" :loading="save.isPending.value">保存权益包</LsButton>
      </LsFormActions>
    </form>
  </div>
</template>

<style scoped>
.package-item-fields { min-width: 0; display: grid; gap: 1rem; }
.package-item-summary { width: 100%; min-width: 0; min-height: 52px; display: grid; grid-template-columns: minmax(0, 1fr) auto auto; align-items: center; gap: 1rem; padding: .65rem .75rem; color: var(--ink); background: var(--cloud); border: 0; border-radius: 10px; text-align: left; cursor: pointer; }
.package-item-summary > span:first-child { min-width: 0; display: grid; gap: .2rem; }
.package-item-summary strong,.package-item-summary small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.package-item-summary small,.package-item-summary__money { color: var(--muted-ink); font-size: .78rem; font-variant-numeric: tabular-nums; }
.package-item-summary svg { color: var(--muted-ink); transition: transform var(--motion-fast) var(--ease-standard); }
.package-item-summary svg.expanded { transform: rotate(180deg); }
.package-item-summary:focus-visible { outline: 3px solid color-mix(in oklch, var(--primary), transparent 72%); outline-offset: 2px; }
.package-item-editor { min-width: 0; display: grid; gap: 1.25rem; }
.package-field-group { min-width: 0; display: grid; grid-template-columns: minmax(0, 1fr); align-items: start; gap: .75rem; padding-top: 1rem; border-top: 1px solid var(--border); }
.package-field-group h4 { margin: 0; color: var(--ink); font-size: .9rem; }
.package-summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .75rem; margin: 0; }
.package-summary div { padding: .8rem; background: var(--cloud); border-radius: 10px; }
.package-summary dt { color: var(--muted-ink); font-size: .75rem; }
.package-summary dd { margin: .2rem 0 0; color: var(--ink); font-size: 1rem; font-weight: 700; font-variant-numeric: tabular-nums; }
@media (max-width: 767px) { .package-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 479px) { .package-item-summary { grid-template-columns: minmax(0, 1fr) auto; gap: .5rem; } .package-item-summary__money { grid-column: 1; grid-row: 2; } .package-item-summary svg { grid-column: 2; grid-row: 1 / span 2; } .package-summary { grid-template-columns: 1fr; } }
</style>
