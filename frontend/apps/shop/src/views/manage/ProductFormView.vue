<script setup lang="ts">
import ServiceCompletionSettings from '../../components/ServiceCompletionSettings.vue'
import { api, friendlyError, uploadFileUrl } from '@lostsky/api/client'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsEntitySelect from '@lostsky/ui/components/LsEntitySelect.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsFormActions from '@lostsky/ui/components/LsFormActions.vue'
import LsFormSection from '@lostsky/ui/components/LsFormSection.vue'
import LsFormPage from '@lostsky/ui/components/LsFormPage.vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsMarkdownEditor from '@lostsky/ui/components/LsMarkdownEditor.vue'
import LsMediaUploadField from '@lostsky/ui/components/LsMediaUploadField.vue'
import LsSwitchField from '@lostsky/ui/components/LsSwitchField.vue'
import { feedback } from '@lostsky/ui/feedback'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { ArrowLeft, Eye } from '@lucide/vue'
import { NInput, NInputNumber, NSelect } from 'naive-ui'
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { canManage, fileUploadReason, loadManageAccess, managePermissionReason, productManagement } from '../../lib'
import { calculateDefaultServiceDistribution, calculateServiceTeamCut } from '../../service-distribution'
import { hydratePurchaseFields, serializePurchaseFields, validPurchaseFields, type PurchaseFieldDraft } from '../../purchase-fields'
import { compositionMoneyFields, compositionIsNested, compositionItemAmount, compositionItemLocked, compositionItemTeamCut, compositionItemValid, restoreCompositionAmounts, type CompositionMoneyField, type CompositionDraftItem } from '../../composition-pricing'
import type { ManagePricingSummary } from '../../types'
import { personalDistributionLocked, withoutPersonnelCuts } from '../../personal-pricing'
import ServiceFieldsEditor from '../../components/ServiceFieldsEditor.vue'
import ProductVariantEditor from '../../components/ProductVariantEditor.vue'
import { hydrateProductVariant, serializeProductVariant, validProductVariant, newProductVariant, validAutoCompleteAfterMinutes } from '../../product-variants'
import type { ProductVariantDraft } from '../../product-variants'
import { useQueryDraft } from '@lostsky/shared/useQueryDraft'
import { useUnsavedChangesGuard } from '@lostsky/shared/useUnsavedChangesGuard'
import { hydrateServiceRedemptionFields, serializeServiceRedemptionFields, validServiceRedemptionFields } from '../../service-redemption-fields'
import type { ServiceRedemptionFieldDraft } from '../../types'

type ProductFormState = {
  name: string
  description: string
  cover_image: string
  introduction_markdown: string
  price: number | null
  cost: number | null
  handler_cut: number | null
  sender_cut: number | null
  cs_cut: number | null
  entity_id: number | null
  kind: number
  benefit_package_id: number | null
  redemption_campaign_id: number | null
  is_active: number
  handler_entity_ids: number[]
}

const route = useRoute()
const routeAccess = useRouteAccess()
const router = useRouter()
const queryClient = useQueryClient()
const id = computed(() => Number(route.params.id || 0))
const editing = computed(() => id.value > 0)
function focusChapter(chapterId: string) {
  const heading = document.getElementById(chapterId)
  if (!heading) return
  heading.tabIndex = -1
  heading.focus({ preventScroll: true })
  heading.scrollIntoView({ block: 'center' })
}
const scope = computed(() => route.meta.workspace === 'personal' ? 'personal' : 'team')
const management = computed(() => productManagement(scope.value))
const personal = computed(() => management.value.personal)
const access = useQuery({ queryKey: ['shop-manage-access'], queryFn: () => loadManageAccess(true) })
const expectedEntityId = computed(() => access.data.value?.identity?.entity_id ?? 0)
const distributionLocked = computed(() => personalDistributionLocked(personal.value, access.data.value?.permissions))
const uploading = ref<'cover' | 'markdown' | ''>('')
const uploadDisabledReason = computed(() => {
  if (access.isPending.value) return '正在核对文件上传能力'
  if (access.isError.value) return friendlyError(access.error.value)
  return fileUploadReason(access.data.value?.file_upload)
})
const form = reactive<ProductFormState>({
  name: '', description: '', cover_image: '', introduction_markdown: '', price: 0, cost: 0,
  handler_cut: null as number | null, sender_cut: null as number | null,
  cs_cut: null as number | null,
  entity_id: null as number | null, kind: 1, benefit_package_id: null as number | null,
  redemption_campaign_id: null as number | null, is_active: 1,
  handler_entity_ids: [] as number[],
})
const distributionRates = reactive({ handler: 80, sender: 15, customerService: 0 })
const redemption = reactive({ unit_name: '次', quantity: 1 as number | null, quantity_step: 1 as number | null, valid_days: 0 as number | null, unused_auto_complete_after_minutes: null as number | null, auto_complete_after_minutes: null as number | null })
let autoCompleteDefaultApplied = false
let autoCompleteTouched = false
function updateAutoComplete(value: number | null) {
  autoCompleteTouched = true
  redemption.auto_complete_after_minutes = value
}
const redemptionFields = ref<ServiceRedemptionFieldDraft[]>([])
const purchaseFields = ref<PurchaseFieldDraft[]>([])
const variants = ref<ProductVariantDraft[]>([])
function addVariant() {
  variants.value.push(newProductVariant(options.data.value?.service_defaults.default_auto_complete_after_minutes ?? null))
}
const itemMoneyFields = compositionMoneyFields
type ItemMoneyField = CompositionMoneyField
type CompositionItem = CompositionDraftItem
const compositionItems = ref<CompositionItem[]>([])
const draftSnapshot = () => JSON.stringify({ form, redemption, redemptionFields: redemptionFields.value, purchaseFields: purchaseFields.value, items: compositionItems.value, variants: variants.value })
let hydratingAmounts = false
const draft = useQueryDraft({
  key: () => `${access.data.value?.team?.id ?? 0}:${expectedEntityId.value}:${scope.value}:product:${id.value}`,
  read: draftSnapshot,
  apply: snapshot => {
    hydratingAmounts = true
    const value = JSON.parse(snapshot)
    Object.assign(form, value.form)
    Object.assign(redemption, value.redemption)
    redemptionFields.value = value.redemptionFields
    purchaseFields.value = value.purchaseFields
    compositionItems.value = value.items
    variants.value = value.variants
    hydratingAmounts = false
  },
})
const hasUnsavedChanges = draft.dirty
useUnsavedChangesGuard(hasUnsavedChanges, { shouldConfirm: (to, from) => to.path !== from.path })
watch([id, scope, expectedEntityId, () => access.data.value?.team?.id], () => { autoCompleteDefaultApplied = false; autoCompleteTouched = false }, { flush: 'sync' })
const useComposition = computed(() => [2, 3].includes(form.kind))
const options = useQuery({
  queryKey: computed(() => ['manage-product-options', scope.value]),
  queryFn: () => management.value.options(),
  enabled: computed(() => !routeAccess.restricted.value),
})
const detail = useQuery({
  queryKey: computed(() => ['manage-product', scope.value, id.value]),
  queryFn: () => routeAccess.read(() => management.value.product(id.value)),
  enabled: computed(() => editing.value && !routeAccess.restricted.value),
})
function kindNumber(value: unknown) {
  if (typeof value === 'number') return value
  const mapped: Record<string, number> = { '普通商品': 1, '套餐': 2, '卡密': 3, '核销商品': 4, '多规格商品': 5 }
  return mapped[String(value)] ?? (Number(value) || 1)
}
watch([() => detail.data.value, expectedEntityId, () => access.data.value?.team?.id], ([data]) => {
  if (!data || data.id !== id.value || hasUnsavedChanges.value) return
  variants.value = (data.variants ?? []).map(hydrateProductVariant)
  purchaseFields.value = hydratePurchaseFields(data.purchase_fields ?? [])
  hydratingAmounts = true
  Object.assign(form, {
    name: data.name,
    entity_id: data.entity_id ?? null,
    benefit_package_id: data.benefit_package_id ?? null,
    redemption_campaign_id: data.redemption_campaign_id ?? null,
    is_active: data.is_active,
    description: data.description ?? '',
    cover_image: data.cover_image ?? '',
    introduction_markdown: data.introduction_markdown ?? '',
    kind: kindNumber(data.kind),
    price: Number(data.price),
    cost: Number(data.cost),
    handler_cut: data.handler_cut == null ? null : Number(data.handler_cut),
    sender_cut: data.sender_cut == null ? null : Number(data.sender_cut),
    cs_cut: data.cs_cut == null ? null : Number(data.cs_cut),
    handler_entity_ids: (data.handlers ?? []).map((handler: any) => Number(handler.entity_id)),
  })
  if (data.redemption) {
    redemptionFields.value = hydrateServiceRedemptionFields(data.redemption.redemption_fields)
    Object.assign(redemption, { unit_name: data.redemption.unit_name, quantity: Number(data.redemption.quantity),
      quantity_step: Number(data.redemption.quantity_step), valid_days: Number(data.redemption.valid_days),
      unused_auto_complete_after_minutes: data.redemption.unused_auto_complete_after_minutes ?? null,
      auto_complete_after_minutes: data.redemption.auto_complete_after_minutes ?? null })
    form.handler_entity_ids = [...(data.redemption.handler_entity_ids ?? [])]
  }
  compositionItems.value = (data.items ?? []).map((item: CompositionItem) => ({ ...item }))
  hydratingAmounts = false
  draft.reset(draftSnapshot())
}, { immediate: true })
const entities = computed(() => options.data.value?.entities ?? [])
const resourceOwnerEntityId = computed(() => personal.value ? expectedEntityId.value : form.entity_id)
const compatibleOwner = (ownerEntityId?: number | null) => ownerEntityId == null || ownerEntityId === resourceOwnerEntityId.value
const productCandidates = computed(() => (options.data.value?.products ?? []).filter(product => product.id !== id.value && compatibleOwner(product.entity_id)))
const productChoices = computed(() => productCandidates.value.map(product => ({ value: product.id,
  label: `${product.name} · ${product.entity_id === null ? '团队公用' : '本人'} · #${product.id}` })))
function chooseCompositionProduct(index: number, productId: number | null) {
  compositionItems.value[index] = { product_id: productId, quantity: 1 }
}
const compositionNested = computed(() => compositionIsNested(compositionItems.value, productCandidates.value))
function compositionAmount(item: CompositionItem, field: ItemMoneyField): number | null {
  return compositionItemAmount(item, field, productCandidates.value, distributionRates)
}
function compositionMoneyLocked(item: CompositionItem, field: ItemMoneyField) {
  return access.isPending.value || access.isError.value || compositionItemLocked(item, field, productCandidates.value, compositionNested.value, distributionLocked.value)
}
function compositionTeamCut(item: CompositionItem) {
  return compositionItemTeamCut(item, productCandidates.value, distributionRates)
}
function compositionMoneyValid(item: CompositionItem) {
  return compositionItemValid(item, productCandidates.value, distributionRates)
}
watch(compositionNested, nested => {
  if (!nested) return
  restoreCompositionAmounts(compositionItems.value, detail.data.value?.items ?? [])
})
const benefitPricingSummary = computed<ManagePricingSummary | null>(() => {
  if (useComposition.value) {
    const cents = { price: 0, cost: 0, handler_cut: 0, sender_cut: 0, cs_cut: 0, team_cut: 0 }
    for (const item of compositionItems.value) {
      const product = productCandidates.value.find(product => product.id === item.product_id)
      if (!product || item.quantity === null) continue
      for (const field of itemMoneyFields) {
        const key = field.key.slice(5) as Exclude<keyof typeof cents, 'team_cut'>
        cents[key] += Math.round((compositionAmount(item, field.key) ?? 0) * 100) * item.quantity
      }
    }
    cents.team_cut = cents.price - cents.cost - cents.handler_cut - cents.sender_cut - cents.cs_cut
    return Object.fromEntries(Object.entries(cents).map(([key, value]) => [key, (value / 100).toFixed(2)])) as unknown as ManagePricingSummary
  }
  return null
})
const pricingLocked = computed(() => benefitPricingSummary.value !== null)
function recalculatePersonnelCuts() {
  if (hydratingAmounts || pricingLocked.value || (editing.value && distributionLocked.value)) return
  const distribution = calculateDefaultServiceDistribution(form.price, form.cost, distributionRates)
  Object.assign(form, {
    handler_cut: distribution.handler,
    sender_cut: distribution.sender,
    cs_cut: distribution.customerService,
  })
}
watch([() => options.data.value?.service_defaults, expectedEntityId, () => access.data.value?.team?.id], ([defaults]) => {
  if (!defaults || hasUnsavedChanges.value) return
  if (!editing.value && !autoCompleteDefaultApplied) {
    if (!autoCompleteTouched) redemption.auto_complete_after_minutes = defaults.default_auto_complete_after_minutes ?? null
    autoCompleteDefaultApplied = true
  }
  Object.assign(distributionRates, {
    handler: defaults.default_handler_rate_percent,
    sender: defaults.default_sender_rate_percent,
    customerService: defaults.default_cs_rate_percent,
  })
  if (!editing.value) {
    recalculatePersonnelCuts()
    draft.reset(draftSnapshot())
  }
}, { immediate: true })
watch(
  () => [form.price, form.cost] as const,
  recalculatePersonnelCuts,
  { flush: 'sync' },
)
const teamCut = computed(() => calculateServiceTeamCut(
  form.price,
  form.cost,
  form.handler_cut,
  form.sender_cut,
  form.cs_cut,
))
const teamCutHint = computed(() => teamCut.value < 0
  ? '成本与人员分成超过售价，请调低金额后再保存。'
  : '自动取售价扣除成本与人员分成后的余额。')
watch(benefitPricingSummary, summary => {
  if (!summary) return
  form.price = Number(summary.price)
  form.cost = Number(summary.cost)
  form.handler_cut = Number(summary.handler_cut)
  form.sender_cut = Number(summary.sender_cut)
  form.cs_cut = Number(summary.cs_cut)
}, { immediate: true })
watch(() => form.kind, value => {
  if (value !== 2) form.benefit_package_id = null
  if (value !== 3) form.redemption_campaign_id = null
})
async function uploadMarkdownImage(file: File) {
  if (uploadDisabledReason.value) throw new Error(uploadDisabledReason.value)
  uploading.value = 'markdown'
  try {
    const url = await uploadFileUrl(file, 'markdown')
    await access.refetch()
    return url
  } finally {
    uploading.value = ''
  }
}
const save = useMutation({
  mutationFn: async () => {
    if (!valid.value) throw new Error('请检查商品必填项、金额和核销额度')
    const submission = draft.capture()
    const body: Record<string, unknown> = {
      name: form.name,
      ...(form.kind !== 5 ? { purchase_fields: serializePurchaseFields(purchaseFields.value) } : {}),
      description: form.description.trim() || null,
      cover_image: form.cover_image,
      introduction_markdown: form.introduction_markdown || null,
      price: form.price,
      cost: form.cost,
      handler_cut: form.handler_cut,
      sender_cut: form.sender_cut,
      cs_cut: form.cs_cut,
      team_cut: pricingLocked.value ? Number(benefitPricingSummary.value?.team_cut ?? 0) : teamCut.value,
      kind: form.kind,
      benefit_package_id: form.benefit_package_id,
      redemption_campaign_id: form.redemption_campaign_id,
      is_active: form.is_active,
      handler_entity_ids: [...form.handler_entity_ids],
    }
    if (form.kind === 4) {
      delete body.benefit_package_id
      delete body.redemption_campaign_id
      delete body.handler_entity_ids
      body.redemption = { ...redemption, quantity: String(redemption.quantity), quantity_step: String(redemption.quantity_step),
        handler_entity_ids: [...form.handler_entity_ids], redemption_fields: serializeServiceRedemptionFields(redemptionFields.value) }
    }
    if (useComposition.value) {
      for (const key of ['price', 'cost', 'handler_cut', 'sender_cut', 'cs_cut', 'team_cut', 'benefit_package_id', 'redemption_campaign_id', 'handler_entity_ids']) delete body[key]
      body.items = compositionItems.value.map(item => ({ ...item, ...Object.fromEntries(itemMoneyFields
        .filter(field => item[field.key] !== undefined)
        .map(field => [field.key, Number(item[field.key]).toFixed(2)])) }))
    }
    if (!personal.value) body.entity_id = form.entity_id || null
    if (form.kind === 5) {
      for (const key of ['price', 'cost', 'handler_cut', 'sender_cut', 'cs_cut', 'team_cut', 'benefit_package_id', 'redemption_campaign_id', 'handler_entity_ids']) delete body[key]
      body.variants = variants.value.map(serializeProductVariant)
    }
    const result = await management.value.saveProduct(
      editing.value ? id.value : null,
      distributionLocked.value && !editing.value ? withoutPersonnelCuts(body) : body,
      expectedEntityId.value,
    )
    const productId = result.id
    await queryClient.invalidateQueries({ queryKey: ['manage-product-options'] })
    return { id: productId, submission }
  },
  onSuccess: data => {
    if (!draft.accept(data.submission)) return
    feedback.success('商品已保存')
    if (hasUnsavedChanges.value) return
    void router.push(`${management.value.routeBase}/${data.id}`)
  },
})
const finite = (value: number | null) => typeof value === 'number' && Number.isFinite(value)
const nonNegative = (value: number | null) => finite(value) && (value as number) >= 0
const valid = computed(() => Boolean(
  form.name.trim() && form.cover_image.trim()
  && (form.kind === 5 || validPurchaseFields(serializePurchaseFields(purchaseFields.value)))
  && !options.isPending.value && !options.isError.value && !access.isPending.value && !access.isError.value
  && (form.kind === 5 ? variants.value.length > 0 && variants.value.every(variant => validProductVariant(variant)
    && (![2, 3].includes(variant.kind) || (variant.items ?? []).every(compositionMoneyValid)))
    && (form.is_active === 0 || variants.value.some(variant => variant.is_active !== 0)) : (
  nonNegative(form.price) && nonNegative(form.cost)
  && (form.cost as number) <= (form.price as number)
  && (pricingLocked.value || (
    nonNegative(form.handler_cut) && nonNegative(form.sender_cut)
    && nonNegative(form.cs_cut) && teamCut.value >= 0
  ))
  && (!useComposition.value || (compositionItems.value.length > 0 && (form.kind !== 3 || compositionItems.value.length === 1)
    && compositionItems.value.every(item => compositionMoneyValid(item) && productCandidates.value.some(product => product.id === item.product_id)
      && item.quantity !== null && Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= 10000)))
  && (useComposition.value || form.kind !== 2 || form.benefit_package_id)
  && (useComposition.value || form.kind !== 3 || form.redemption_campaign_id)
  && (form.kind !== 4 || (validServiceRedemptionFields(redemptionFields.value) && redemption.unit_name.trim() && finite(redemption.quantity) && (redemption.quantity as number) > 0
    && finite(redemption.quantity_step) && (redemption.quantity_step as number) > 0
    && nonNegative(redemption.valid_days) && Number.isInteger(redemption.valid_days)
    && validAutoCompleteAfterMinutes(redemption.unused_auto_complete_after_minutes) && validAutoCompleteAfterMinutes(redemption.auto_complete_after_minutes))))),
))
</script>

<template>
  <LsFormPage :title="editing ? (personal ? '编辑本人商品' : '编辑商品') : (personal ? '新建本人商品' : '新建商品')" description="整理商品资料、配置交付与价格，最后统一保存。">
    <template #actions>
      <LsPageLink :to="management.routeBase" :icon="ArrowLeft" :label="personal ? '返回我的商品' : '返回商品'" />
      <LsPageLink v-if="editing" :icon="Eye" label="预览前台" :href="`/product/${id}`" target="_blank" rel="noopener noreferrer" />
    </template>

    <nav class="product-chapters" aria-label="商品编辑章节">
      <a href="#product-basics" @click.prevent="focusChapter('product-basics')">商品资料</a>
      <a href="#product-delivery" @click.prevent="focusChapter('product-delivery')">销售与交付</a>
      <a v-if="form.kind !== 5" href="#product-pricing" @click.prevent="focusChapter('product-pricing')">价格与分成</a>
      <a href="#product-details" @click.prevent="focusChapter('product-details')">详情介绍</a>
      <a href="#product-publish" @click.prevent="focusChapter('product-publish')">上架与保存</a>
    </nav>

    <form class="product-focused-form" @submit.prevent="routeAccess.restricted.value ? feedback.info(routeAccess.reason.value) : !save.isPending.value && save.mutate()">
      <fieldset class="product-edit-fields" :disabled="save.isPending.value" :inert="save.isPending.value">
      <LsFormSection id="product-basics" title="商品资料" description="名称、简短说明与封面，帮助顾客快速了解商品。">
          <LsField label="商品名称" for-id="product-name" required><NInput id="product-name" v-model:value="form.name" maxlength="100" /></LsField>
          <LsField label="简短说明" for-id="product-description"><NInput id="product-description" v-model:value="form.description" type="textarea" maxlength="500" show-count /></LsField>
          <LsField label="封面" for-id="product-cover" required><LsMediaUploadField id="product-cover" v-model="form.cover_image" :upload="uploadFileUrl" accept="image/*" placeholder="图片 URL 或上传文件" button-label="上传封面" :disabled="Boolean(uploading || uploadDisabledReason)" :disabled-reason="uploading ? '正在上传图片，请稍候' : uploadDisabledReason" @uploading="uploading = $event ? 'cover' : ''" @uploaded="access.refetch(); feedback.success('商品封面已上传')" /></LsField>
      </LsFormSection>
      <LsFormSection id="product-delivery" title="销售与交付" description="确定商品类型、归属人员，以及顾客购买后获得的内容。">
          <p v-if="personal" class="form-intro" role="note">此商品自动归属当前已领取的人员，个人工作台不能转移归属。</p>
          <LsField label="商品类型" for-id="product-kind" required><NSelect id="product-kind" v-model:value="form.kind" :disabled="editing" :options="[{ label: '普通商品', value: 1 }, { label: '核销商品', value: 4 }, { label: '套餐', value: 2 }, { label: '卡密', value: 3 }, { label: '多规格商品', value: 5 }]" /></LsField>
          <template v-if="form.kind === 4">
            <ServiceCompletionSettings id-prefix="product" v-model:unused-minutes="redemption.unused_auto_complete_after_minutes" :confirmation-minutes="redemption.auto_complete_after_minutes" @update:confirmation-minutes="updateAutoComplete" />
            <LsField label="计量单位" for-id="product-unit" required><NInput id="product-unit" v-model:value="redemption.unit_name" maxlength="20" /></LsField>
            <LsField label="每份核销额度" for-id="product-quota" required><NInputNumber id="product-quota" v-model:value="redemption.quantity" :min="0.0001" :precision="4" /></LsField>
            <LsField label="最小核销单位" for-id="product-step" required><NInputNumber id="product-step" v-model:value="redemption.quantity_step" :min="0.0001" :precision="4" /></LsField>
            <LsField label="有效天数" for-id="product-days" hint="从权益发放时起计算，0 表示不限期。"><NInputNumber id="product-days" v-model:value="redemption.valid_days" :min="0" :precision="0" /></LsField>
          </template>
          <template v-if="useComposition">
            <p class="form-intro">普通子项不核销；核销子项发放可核销权益。卡密子项等待单独兑换。</p>
            <p v-if="compositionNested" class="form-intro" role="note">包含套餐或卡密，所有分项金额均锁定。加入嵌套项会恢复已保存金额或源商品金额。</p>
            <template v-for="(item, index) in compositionItems" :key="index">
              <LsField :label="`子项 ${index + 1}`" :for-id="`product-item-${index}`" required>
                <NSelect :id="`product-item-${index}`" :value="item.product_id" :options="productChoices" :loading="options.isPending.value" :disabled="options.isError.value" filterable @update:value="value => chooseCompositionProduct(index, value)" />
              </LsField>
              <LsField label="份数" :for-id="`product-item-quantity-${index}`" required><NInputNumber :id="`product-item-quantity-${index}`" v-model:value="item.quantity" :min="1" :max="10000" :precision="0" /></LsField>
              <LsField v-for="field in itemMoneyFields" :key="field.key" :label="field.label" :for-id="`product-item-${field.key}-${index}`" required>
                <NInputNumber :id="`product-item-${field.key}-${index}`" :value="compositionAmount(item, field.key)" :min="0" :precision="2" :step="0.01" :disabled="compositionMoneyLocked(item, field.key)" @update:value="value => item[field.key] = value" />
              </LsField>
              <LsField label="每份团队分成" :for-id="`product-item-team-cut-${index}`" :hint="compositionMoneyValid(item) ? '每份售价扣除成本及人员分成后的余额。' : '请填写完整金额，成本与人员分成之和不能超过每份售价。'">
                <NInputNumber :id="`product-item-team-cut-${index}`" :value="compositionTeamCut(item)" :precision="2" disabled />
              </LsField>
              <LsButton type="button" variant="secondary" @click="compositionItems.splice(index, 1)">移除子项 {{ index + 1 }}</LsButton>
            </template>
            <LsButton v-if="form.kind === 2 || compositionItems.length === 0" type="button" variant="secondary" :disabled="options.isPending.value || options.isError.value" @click="compositionItems.push({ product_id: null, quantity: 1 })">添加商品</LsButton>
          </template>
          <p v-if="pricingLocked" class="form-intro" role="note">售价、成本和分成由子项自动汇总。</p>
          <LsField v-if="!personal" label="专属人员" for-id="product-owner"><LsEntitySelect id="product-owner" v-model="form.entity_id" :entities="entities" :loading="options.isPending.value" :disabled="options.isError.value" clearable placeholder="留空表示团队公用商品" /></LsField>
          <LsField v-if="[1, 4].includes(form.kind)" label="可选接单人" for-id="product-handlers" hint="普通商品用于下单选择；核销商品用于核销接单。"><LsEntitySelect id="product-handlers" v-model="form.handler_entity_ids" :entities="entities" :loading="options.isPending.value" :disabled="options.isError.value" multiple clearable placeholder="选择可选接单人" /></LsField>
      </LsFormSection>
      <ServiceFieldsEditor v-if="form.kind !== 5" v-model="purchaseFields" purpose="purchase" />
      <template v-if="form.kind === 5">
        <template v-for="(variant, index) in variants" :key="variant.draftKey">
          <ProductVariantEditor v-model="variants[index]" :prefix="`variant-${index}`" :products="productCandidates" :entities="entities" :distribution-locked="distributionLocked" :distribution-rates="distributionRates" :upload="uploadMarkdownImage" :upload-disabled-reason="uploadDisabledReason" />
          <LsButton type="button" variant="secondary" @click="variants.splice(index, 1)">移除规格 {{ index + 1 }}</LsButton>
        </template>
        <LsButton type="button" variant="secondary" :disabled="variants.length >= 50 || options.isPending.value || options.isError.value" @click="addVariant">添加规格</LsButton>
      </template>
      <ServiceFieldsEditor v-if="form.kind === 4" v-model="redemptionFields" />
      <LsFormSection v-if="form.kind !== 5" id="product-pricing" title="价格与分成" :description="pricingLocked ? '按子项份数自动汇总；订单创建后冻结当前金额。' : distributionLocked ? (editing ? '人员分成沿用已保存金额，团队分成取余额。' : '人员分成按团队默认比例生成，团队分成取余额。') : '修改售价或成本后，按团队设置重算人员分成；订单创建时冻结当前金额。'">
          <LsField label="售价" for-id="product-price" required :hint="pricingLocked ? '由子项自动汇总' : undefined"><NInputNumber id="product-price" v-model:value="form.price" :min="0" :step="0.01" :precision="2" :disabled="pricingLocked" /></LsField>
        <template v-if="pricingLocked">
          <dl class="pricing-breakdown">
            <div><dt>成本</dt><dd>¥{{ benefitPricingSummary?.cost }}</dd></div>
            <div><dt>接单分成</dt><dd>¥{{ benefitPricingSummary?.handler_cut }}</dd></div>
            <div><dt>发单分成</dt><dd>¥{{ benefitPricingSummary?.sender_cut }}</dd></div>
            <div><dt>客服分成</dt><dd>¥{{ benefitPricingSummary?.cs_cut }}</dd></div>
            <div><dt>团队分成</dt><dd>¥{{ benefitPricingSummary?.team_cut }}</dd></div>
          </dl>
        </template>
        <template v-else>
          <LsField label="成本" for-id="product-cost"><NInputNumber id="product-cost" v-model:value="form.cost" :min="0" :step="0.01" :precision="2" /></LsField>
          <LsField label="接单分成" for-id="product-handler-cut"><NInputNumber id="product-handler-cut" v-model:value="form.handler_cut" :min="0" :precision="2" :disabled="distributionLocked" clearable /></LsField>
          <LsField label="发单分成" for-id="product-sender-cut"><NInputNumber id="product-sender-cut" v-model:value="form.sender_cut" :min="0" :precision="2" :disabled="distributionLocked" clearable /></LsField>
          <LsField label="客服分成" for-id="product-cs-cut"><NInputNumber id="product-cs-cut" v-model:value="form.cs_cut" :min="0" :precision="2" :disabled="distributionLocked" clearable /></LsField>
          <LsField label="团队分成" for-id="product-team-cut" :hint="teamCutHint"><NInputNumber id="product-team-cut" :value="teamCut" :precision="2" disabled /></LsField>
        </template>
      </LsFormSection>
      <LsFormSection id="product-details" title="详情介绍" description="补充服务内容、使用方式与购买须知，支持图文编辑。">
          <LsField label="详情" for-id="product-markdown"><LsMarkdownEditor id="product-markdown" v-model="form.introduction_markdown" :draft-key="`shop-product-${scope}-${id || 'new'}`" :upload-image="uploadMarkdownImage" :upload-disabled-reason="uploading ? '正在上传图片，请稍候' : uploadDisabledReason" /></LsField>
      </LsFormSection>
      <LsFormSection id="product-publish" title="上架与保存" description="本页所有修改将一起保存。离开前请确认商品内容与上架状态。">
          <LsSwitchField id="product-active" :model-value="form.is_active === 1" label="上架状态" description="关闭后商品不会在商城展示。" @update:model-value="value => form.is_active = value ? 1 : 0" />
      <p class="product-draft-status" role="status">{{ hasUnsavedChanges ? '有未保存的修改' : '当前没有未保存的修改' }}</p>
      <LsInlineError v-if="!routeAccess.restricted.value && detail.isError.value" :message="friendlyError(detail.error.value)" />
      <LsInlineError v-if="!routeAccess.restricted.value && options.isError.value" :message="friendlyError(options.error.value)" />
      <LsInlineError v-if="save.isError.value" :message="friendlyError(save.error.value)" />
      <LsFormActions>
        <LsButton type="button" variant="ghost" @click="router.back()"><template #icon><ArrowLeft :size="16" /></template>取消</LsButton>
        <LsButton type="submit" :disabled="routeAccess.restricted.value || !hasUnsavedChanges || Boolean(uploading) || !valid || !canManage(management.permission) || (personal && !expectedEntityId)" :disabled-reason="routeAccess.reason.value || (!canManage(management.permission) ? managePermissionReason(management.permission) : '')" :loading="save.isPending.value">保存商品</LsButton>
      </LsFormActions>
      </LsFormSection>
      </fieldset>
    </form>
  </LsFormPage>
</template>

<style scoped>
.product-focused-form { display: grid; gap: 1.5rem; min-width: 0; }
.product-chapters { display: flex; flex-wrap: wrap; gap: .25rem 1.25rem; border-bottom: 1px solid var(--border); padding-bottom: .5rem; }
.product-chapters a { display: inline-flex; align-items: center; min-height: 44px; color: var(--muted-ink); font-size: .82rem; text-decoration: none; }
.product-chapters a:hover { color: var(--ink); text-decoration: underline; text-underline-offset: .3em; }
.product-chapters a:focus-visible { outline: 2px solid var(--sky-lost-strong); outline-offset: 3px; border-radius: 4px; }
.product-draft-status { margin: 0; color: var(--muted-ink); font-size: .82rem; line-height: 1.6; }
.product-edit-fields { display: contents; border: 0; padding: 0; margin: 0; min-width: 0; }
.pricing-breakdown { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem; margin: 0; }
.pricing-breakdown div { padding: .8rem; background: var(--cloud); border-radius: 10px; }
.pricing-breakdown dt { color: var(--muted-ink); font-size: .75rem; }
.pricing-breakdown dd { margin: .2rem 0 0; color: var(--ink); font-weight: 700; font-variant-numeric: tabular-nums; }
@media (max-width: 767px) { .pricing-breakdown { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 479px) { .pricing-breakdown { grid-template-columns: 1fr; } }
</style>
