<script setup lang="ts">
import ServiceCompletionSettings from './ServiceCompletionSettings.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsFormSection from '@lostsky/ui/components/LsFormSection.vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsMediaUploadField from '@lostsky/ui/components/LsMediaUploadField.vue'
import LsMarkdownEditor from '@lostsky/ui/components/LsMarkdownEditor.vue'
import LsEntitySelect from '@lostsky/ui/components/LsEntitySelect.vue'
import LsSwitchField from '@lostsky/ui/components/LsSwitchField.vue'
import { NInput, NInputNumber, NSelect } from 'naive-ui'
import { computed, ref, watch, toRaw } from 'vue'
import type { ProductVariantDraft } from '../product-variants'
import type { ManageEntityOption, ManageProductCandidate } from '../types'
import type { ServiceRedemptionFieldDraft } from '../types'
import ServiceFieldsEditor from './ServiceFieldsEditor.vue'
import { serializeServiceRedemptionFields } from '../service-redemption-fields'
import { calculateDefaultServiceDistribution, calculateServiceTeamCut } from '../service-distribution'
import type { ServiceDistributionRates } from '../service-distribution'
import { hydratePurchaseFields, serializePurchaseFields } from '../purchase-fields'
import { compositionMoneyFields, compositionIsNested, compositionItemAmount, compositionItemLocked, compositionItemTeamCut, compositionItemValid, restoreCompositionAmounts, type CompositionDraftItem, type CompositionMoneyField } from '../composition-pricing'

const draft = defineModel<ProductVariantDraft>({ required: true })
const props = defineProps<{
  prefix: string
  products: ManageProductCandidate[]
  entities: ManageEntityOption[]
  distributionLocked: boolean
  distributionRates: ServiceDistributionRates
  upload: (file: File) => Promise<string>
  uploadDisabledReason?: string
}>()
const kinds = [{ label: '普通商品', value: 1 }, { label: '核销商品', value: 4 }, { label: '套餐', value: 2 }, { label: '卡密', value: 3 }]
const composite = computed(() => [2, 3].includes(draft.value.kind))
const savedItems = structuredClone(toRaw(draft.value.items ?? []))
const nested = computed(() => compositionIsNested(draft.value.items ?? [], props.products))
const itemAmount = (item: CompositionDraftItem, field: CompositionMoneyField) => compositionItemAmount(item, field, props.products, props.distributionRates)
const itemLocked = (item: CompositionDraftItem, field: CompositionMoneyField) => compositionItemLocked(item, field, props.products, nested.value, props.distributionLocked)
const itemTeamCut = (item: CompositionDraftItem) => compositionItemTeamCut(item, props.products, props.distributionRates)
const itemValid = (item: CompositionDraftItem) => compositionItemValid(item, props.products, props.distributionRates)
const totalPrice = computed(() => (draft.value.items ?? []).reduce((total, item) => total + Math.round((itemAmount(item, 'unit_price') ?? 0) * 100) * item.quantity, 0) / 100)
watch(nested, value => { if (value) restoreCompositionAmounts(draft.value.items ?? [], savedItems) })
function chooseProduct(index: number, productId: number) {
  if (draft.value.items) draft.value.items[index] = { product_id: productId, quantity: 1 }
}
const choices = computed(() => props.products.filter(product => product.id !== draft.value.id).map(product => ({ label: product.name, value: product.id })))
const moneyFields = [{ key: 'price', label: '售价' }, { key: 'cost', label: '成本' }, { key: 'handler_cut', label: '接单分成' }, { key: 'sender_cut', label: '发单分成' }, { key: 'cs_cut', label: '客服分成' }] as const
const amount = (value: unknown) => value === null || value === undefined || value === '' ? null : Number(value)
const selectedEntities = (value: number | number[] | null) => Array.isArray(value) ? value : []
const teamCut = computed(() => calculateServiceTeamCut(amount(draft.value.price), amount(draft.value.cost), amount(draft.value.handler_cut), amount(draft.value.sender_cut), amount(draft.value.cs_cut)))
function recalculateDistribution() {
  if (composite.value || (props.distributionLocked && draft.value.id)) return
  const values = calculateDefaultServiceDistribution(amount(draft.value.price), amount(draft.value.cost), props.distributionRates)
  draft.value.handler_cut = values.handler.toFixed(2)
  draft.value.sender_cut = values.sender.toFixed(2)
  draft.value.cs_cut = values.customerService.toFixed(2)
  delete draft.value.team_cut
}
watch(() => [draft.value.price, draft.value.cost], recalculateDistribution, { flush: 'sync' })
watch(() => props.distributionRates, () => { if (!draft.value.id) recalculateDistribution() }, { deep: true })
const redemptionFields = ref<ServiceRedemptionFieldDraft[]>((draft.value.redemption?.redemption_fields ?? []).map((field, index) => ({
    ...field, key: field.id ? `field-${field.id}` : `${props.prefix}-field-${index}`,
    options_text: (field.options ?? []).join('\n'),
  })))
const purchaseFields = ref(hydratePurchaseFields(draft.value.purchase_fields))
watch(purchaseFields, fields => { draft.value.purchase_fields = serializePurchaseFields(fields) }, { deep: true })
watch(redemptionFields, fields => {
  if (draft.value.redemption) draft.value.redemption.redemption_fields = serializeServiceRedemptionFields(fields)
}, { deep: true })
watch(() => draft.value.kind, kind => {
  if (kind === 4) draft.value.redemption ??= { unit_name: '次', quantity: '1', quantity_step: '1', valid_days: 0, auto_complete_after_minutes: null, unused_auto_complete_after_minutes: null, handler_entity_ids: [], redemption_fields: [] }
  if (kind === 2 || kind === 3) draft.value.items ??= []
}, { immediate: true })
</script>

<template>
  <LsFormSection title="规格信息">
    <LsSwitchField :id="`${prefix}-active`" :model-value="draft.is_active !== 0" label="启用规格" description="关闭后不允许新购买或新增引用，历史订单保留。" @update:model-value="draft.is_active = $event ? 1 : 0" />
    <LsField label="规格名称" :for-id="`${prefix}-name`" required><NInput :id="`${prefix}-name`" v-model:value="draft.name" maxlength="100" /></LsField>
    <LsField label="规格类型" :for-id="`${prefix}-kind`" required><NSelect :id="`${prefix}-kind`" v-model:value="draft.kind" :options="kinds" :disabled="Boolean(draft.id)" /></LsField>
    <LsField label="规格说明" :for-id="`${prefix}-description`"><NInput :id="`${prefix}-description`" :value="draft.description ?? ''" type="textarea" maxlength="500" @update:value="draft.description = $event" /></LsField>
    <LsField label="规格图片" :for-id="`${prefix}-cover`"><LsMediaUploadField :id="`${prefix}-cover`" :model-value="draft.cover_image ?? ''" :upload="upload" :disabled="Boolean(uploadDisabledReason)" :disabled-reason="uploadDisabledReason" accept="image/*" placeholder="省略时使用商品封面" @update:model-value="draft.cover_image = $event" /></LsField>
    <LsField label="规格详情" :for-id="`${prefix}-markdown`"><LsMarkdownEditor :id="`${prefix}-markdown`" :model-value="draft.introduction_markdown ?? ''" :upload-image="upload" :upload-disabled-reason="uploadDisabledReason" @update:model-value="draft.introduction_markdown = $event" /></LsField>
  </LsFormSection>
  <ServiceFieldsEditor v-model="purchaseFields" purpose="purchase" />
  <LsFormSection v-if="draft.kind === 4 && draft.redemption" title="规格核销配置">
    <ServiceCompletionSettings :id-prefix="prefix" v-model:unused-minutes="draft.redemption.unused_auto_complete_after_minutes" v-model:confirmation-minutes="draft.redemption.auto_complete_after_minutes" />
    <LsField label="计量单位" :for-id="`${prefix}-unit`" required><NInput :id="`${prefix}-unit`" v-model:value="draft.redemption.unit_name" maxlength="20" /></LsField>
    <LsField label="每份核销额度" :for-id="`${prefix}-quota`" required><NInputNumber :id="`${prefix}-quota`" :value="amount(draft.redemption.quantity)" :min="0.0001" :precision="4" @update:value="draft.redemption.quantity = $event === null ? '' : String($event)" /></LsField>
    <LsField label="最小核销单位" :for-id="`${prefix}-step`" required><NInputNumber :id="`${prefix}-step`" :value="amount(draft.redemption.quantity_step)" :min="0.0001" :precision="4" @update:value="draft.redemption.quantity_step = $event === null ? '' : String($event)" /></LsField>
    <LsField label="有效天数" :for-id="`${prefix}-days`" hint="0 表示不限期。"><NInputNumber :id="`${prefix}-days`" :value="draft.redemption.valid_days ?? null" :min="0" :precision="0" @update:value="draft.redemption.valid_days = $event ?? undefined" /></LsField>
    <LsField label="核销接单人" :for-id="`${prefix}-redemption-handlers`"><LsEntitySelect :id="`${prefix}-redemption-handlers`" :model-value="draft.redemption.handler_entity_ids ?? []" :entities="entities" multiple clearable @update:model-value="draft.redemption.handler_entity_ids = selectedEntities($event)" /></LsField>
  </LsFormSection>
  <ServiceFieldsEditor v-if="draft.kind === 4" v-model="redemptionFields" />
  <LsFormSection v-if="!composite" title="价格与分成">
    <LsField v-for="field in moneyFields" :key="field.key" :label="field.label" :for-id="`${prefix}-${field.key}`" required>
      <NInputNumber :id="`${prefix}-${field.key}`" :value="amount(draft[field.key])" :min="0" :precision="2" :disabled="distributionLocked && !['price', 'cost'].includes(field.key)" @update:value="draft[field.key] = $event === null ? '' : $event.toFixed(2)" />
    </LsField>
    <LsField label="团队分成" :for-id="`${prefix}-team`"><NInputNumber :id="`${prefix}-team`" :value="teamCut" :precision="2" disabled /></LsField>
    <LsField v-if="draft.kind === 1" label="接单人" :for-id="`${prefix}-handlers`"><LsEntitySelect :id="`${prefix}-handlers`" :model-value="draft.handler_entity_ids ?? []" :entities="entities" multiple clearable @update:model-value="draft.handler_entity_ids = selectedEntities($event)" /></LsField>
  </LsFormSection>
  <LsFormSection v-if="composite" title="规格组成" description="选择具体商品或规格，价格与分成沿用组成配置。">
    <p v-if="nested" role="note">包含套餐或卡密，所有分项金额均锁定。加入嵌套项会恢复已保存金额或源商品金额。</p>
    <template v-for="(item, index) in draft.items" :key="index">
      <LsField :label="`商品 ${index + 1}`" :for-id="`${prefix}-item-${index}`" required><NSelect :id="`${prefix}-item-${index}`" :value="item.product_id" :options="choices" filterable @update:value="value => chooseProduct(index, value)" /></LsField>
      <LsField label="份数" :for-id="`${prefix}-quantity-${index}`" required><NInputNumber :id="`${prefix}-quantity-${index}`" v-model:value="item.quantity" :min="1" :max="10000" :precision="0" /></LsField>
      <LsField v-for="field in compositionMoneyFields" :key="field.key" :label="field.label" :for-id="`${prefix}-${field.key}-${index}`" required>
        <NInputNumber :id="`${prefix}-${field.key}-${index}`" :value="itemAmount(item, field.key)" :min="0" :precision="2" :disabled="itemLocked(item, field.key)" @update:value="value => item[field.key] = value === null ? '' : value.toFixed(2)" />
      </LsField>
      <LsField label="每份团队分成" :for-id="`${prefix}-item-team-${index}`" :hint="itemValid(item) ? '每份售价扣除成本及人员分成后的余额。' : '请填写完整金额，成本与人员分成之和不能超过每份售价。'">
        <NInputNumber :id="`${prefix}-item-team-${index}`" :value="itemTeamCut(item)" :precision="2" disabled />
      </LsField>
      <LsButton type="button" variant="secondary" @click="draft.items?.splice(index, 1)">移除商品 {{ index + 1 }}</LsButton>
    </template>
    <LsButton v-if="draft.kind === 2 || !draft.items?.length" type="button" variant="secondary" @click="draft.items?.push({ product_id: 0, quantity: 1 })">添加商品</LsButton>
    <p>规格售价：¥{{ totalPrice.toFixed(2) }}，由各分项按份数汇总。</p>
  </LsFormSection>
</template>
