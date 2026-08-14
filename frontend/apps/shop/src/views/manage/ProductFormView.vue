<script setup lang="ts">
import { api, friendlyError, uploadFileUrl } from '@lostsky/api/client'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsEntitySelect from '@lostsky/ui/components/LsEntitySelect.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsFormActions from '@lostsky/ui/components/LsFormActions.vue'
import LsFormSection from '@lostsky/ui/components/LsFormSection.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsMarkdownEditor from '@lostsky/ui/components/LsMarkdownEditor.vue'
import LsMediaUploadField from '@lostsky/ui/components/LsMediaUploadField.vue'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import LsPagePrimaryAction from '@lostsky/ui/components/LsPagePrimaryAction.vue'
import LsSwitchField from '@lostsky/ui/components/LsSwitchField.vue'
import { feedback } from '@lostsky/ui/feedback'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { Eye } from '@lucide/vue'
import { NInput, NInputNumber, NSelect } from 'naive-ui'
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ProductFieldsEditor from '../../components/ProductFieldsEditor.vue'
import { canManage, fileUploadReason, loadManageAccess, productManagement, resourceOwnerLabel } from '../../lib'
import { calculateDefaultServiceDistribution, calculateServiceTeamCut } from '../../service-distribution'
import type { ManagePricingSummary } from '../../types'

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
const router = useRouter()
const id = computed(() => Number(route.params.id || 0))
const editing = computed(() => id.value > 0)
const scope = computed(() => route.meta.workspace === 'personal' ? 'personal' : 'team')
const management = computed(() => productManagement(scope.value))
const personal = computed(() => management.value.personal)
const access = useQuery({ queryKey: ['shop-manage-access'], queryFn: () => loadManageAccess(true) })
const expectedEntityId = computed(() => access.data.value?.identity?.entity_id ?? 0)
const fieldsEditor = ref<InstanceType<typeof ProductFieldsEditor> | null>(null)
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
let hydratingAmounts = false
const options = useQuery({
  queryKey: computed(() => ['manage-product-options', scope.value]),
  queryFn: () => management.value.options(),
})
const detail = useQuery({
  queryKey: computed(() => ['manage-product', scope.value, id.value]),
  queryFn: () => management.value.product(id.value),
  enabled: editing,
})
function kindNumber(value: unknown) {
  if (typeof value === 'number') return value
  const mapped: Record<string, number> = { '普通商品': 1, '服务套餐': 2, '权益卡密': 3 }
  return mapped[String(value)] ?? (Number(value) || 1)
}
watch(() => detail.data.value, data => {
  if (!data) return
  hydratingAmounts = true
  Object.assign(form, data, {
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
  hydratingAmounts = false
}, { immediate: true })
const entities = computed(() => options.data.value?.entities ?? [])
const resourceOwnerEntityId = computed(() => personal.value ? expectedEntityId.value : form.entity_id)
const compatibleOwner = (ownerEntityId?: number | null) => ownerEntityId == null || ownerEntityId === resourceOwnerEntityId.value
const availablePackages = computed(() => {
  const items = [...(options.data.value?.packages ?? [])]
  const linked = detail.data.value?.benefit_package
  if (linked && !items.some(item => item.id === linked.id)) items.push(linked)
  return items.filter(item => item.id === form.benefit_package_id || compatibleOwner(item.owner_entity_id))
})
const availableCampaigns = computed(() => {
  const items = [...(options.data.value?.campaigns ?? [])]
  const linked = detail.data.value?.redemption_campaign
  if (linked && !items.some(item => item.id === linked.id)) items.push(linked)
  return items.filter(item => item.id === form.redemption_campaign_id || compatibleOwner(item.owner_entity_id))
})
const packages = computed(() => availablePackages.value.map(item => ({
  label: `${item.name} · ${resourceOwnerLabel(item, expectedEntityId.value)}`,
  value: item.id,
  disabled: !item.is_active,
})))
const campaigns = computed(() => availableCampaigns.value.map(item => ({
  label: `${item.name} · ${resourceOwnerLabel(item, expectedEntityId.value)}`,
  value: item.id,
  disabled: !item.is_active,
})))
watch(resourceOwnerEntityId, () => {
  const selectedPackage = availablePackages.value.find(item => item.id === form.benefit_package_id)
  if (selectedPackage && !compatibleOwner(selectedPackage.owner_entity_id)) form.benefit_package_id = null
  const selectedCampaign = availableCampaigns.value.find(item => item.id === form.redemption_campaign_id)
  if (selectedCampaign && !compatibleOwner(selectedCampaign.owner_entity_id)) form.redemption_campaign_id = null
})
const benefitPricingSummary = computed<ManagePricingSummary | null>(() => {
  if (form.kind === 2) {
    return availablePackages.value.find(item => item.id === form.benefit_package_id)?.pricing_summary ?? null
  }
  if (form.kind === 3) {
    return availableCampaigns.value.find(item => item.id === form.redemption_campaign_id)?.package?.pricing_summary ?? null
  }
  return null
})
const pricingLocked = computed(() => benefitPricingSummary.value !== null)
function recalculatePersonnelCuts() {
  if (hydratingAmounts || pricingLocked.value) return
  const distribution = calculateDefaultServiceDistribution(form.price, form.cost, distributionRates)
  Object.assign(form, {
    handler_cut: distribution.handler,
    sender_cut: distribution.sender,
    cs_cut: distribution.customerService,
  })
}
watch(() => options.data.value?.service_defaults, defaults => {
  if (!defaults) return
  Object.assign(distributionRates, {
    handler: defaults.default_handler_rate_percent,
    sender: defaults.default_sender_rate_percent,
    customerService: defaults.default_cs_rate_percent,
  })
  if (!editing.value) recalculatePersonnelCuts()
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
  ? '成本与人员分配超过售价，请调低金额后再保存。'
  : '自动取售价扣除成本与人员分配后的余额。')
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
    const url = await uploadFileUrl(file)
    await access.refetch()
    return url
  } finally {
    uploading.value = ''
  }
}
const save = useMutation({
  mutationFn: async () => {
    const body: Record<string, unknown> = {
      name: form.name,
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
    }
    if (!personal.value) body.entity_id = form.entity_id || null
    const result = await management.value.saveProduct(
      editing.value ? id.value : null,
      body,
      expectedEntityId.value,
    )
    const productId = editing.value ? id.value : result.id
    await management.value.setProductHandlers(productId, form.handler_entity_ids, expectedEntityId.value)
    if (editing.value) await fieldsEditor.value?.save()
    return { id: productId }
  },
  onSuccess: data => {
    feedback.success('商品已保存')
    void router.push(`${management.value.routeBase}/${data.id}`)
  },
})
const finite = (value: number | null) => typeof value === 'number' && Number.isFinite(value)
const nonNegative = (value: number | null) => finite(value) && (value as number) >= 0
const valid = computed(() => Boolean(
  form.name.trim() && form.cover_image.trim()
  && nonNegative(form.price) && nonNegative(form.cost)
  && (form.cost as number) <= (form.price as number)
  && (pricingLocked.value || (
    nonNegative(form.handler_cut) && nonNegative(form.sender_cut)
    && nonNegative(form.cs_cut) && teamCut.value >= 0
  ))
  && (form.kind !== 2 || form.benefit_package_id)
  && (form.kind !== 3 || form.redemption_campaign_id),
))
</script>

<template>
  <div class="manage-page">
    <LsPageHeader
      :title="editing ? (personal ? '编辑本人商品' : '编辑商品') : (personal ? '新建本人商品' : '新建商品')"
      description="商品类型决定订单完成时的履约结果；服务和卡密配置由后端再次校验。"
      :back-to="management.routeBase"
      :back-label="personal ? '返回我的商品' : '返回商品'"
    >
      <template #actions>
        <LsPagePrimaryAction v-if="editing" :icon="Eye" label="预览前台" :href="`/product/${id}`" target="_blank" rel="noopener noreferrer" />
      </template>
    </LsPageHeader>
    <form class="manage-form" @submit.prevent="save.mutate()">
      <LsFormSection title="基本信息">
          <LsField label="商品名称" for-id="product-name" required><NInput id="product-name" v-model:value="form.name" maxlength="100" /></LsField>
          <LsField label="简短说明" for-id="product-description"><NInput id="product-description" v-model:value="form.description" type="textarea" maxlength="500" show-count /></LsField>
          <LsField label="封面" for-id="product-cover" required hint="可粘贴已登记媒体 URL，或从本地上传图片。"><LsMediaUploadField id="product-cover" v-model="form.cover_image" :upload="uploadFileUrl" accept="image/*" placeholder="图片 URL 或上传文件" button-label="上传封面" :disabled="Boolean(uploading || uploadDisabledReason)" :disabled-reason="uploading ? '正在上传图片，请稍候' : uploadDisabledReason" @uploading="uploading = $event ? 'cover' : ''" @uploaded="access.refetch(); feedback.success('商品封面已上传')" /></LsField>
          <LsField label="详情" for-id="product-markdown"><LsMarkdownEditor id="product-markdown" v-model="form.introduction_markdown" :draft-key="`shop-product-${scope}-${id || 'new'}`" :upload-image="uploadMarkdownImage" :upload-disabled-reason="uploading ? '正在上传图片，请稍候' : uploadDisabledReason" /></LsField>
          <LsSwitchField id="product-active" :model-value="form.is_active === 1" label="上架状态" description="关闭后商品不会在商城展示。" @update:model-value="value => form.is_active = value ? 1 : 0" />
      </LsFormSection>
      <LsFormSection title="销售与履约">
          <p v-if="personal" class="form-intro" role="note">此商品自动归属当前已领取的 Entity，个人工作台不能转移归属。</p>
          <LsField label="商品类型" for-id="product-kind" required><NSelect id="product-kind" v-model:value="form.kind" :options="[{ label: '普通商品', value: 1 }, { label: '服务套餐', value: 2 }, { label: '权益卡密', value: 3 }]" /></LsField>
          <LsField v-if="form.kind === 2" label="服务权益包" for-id="product-package" required><NSelect id="product-package" v-model:value="form.benefit_package_id" :options="packages" filterable /></LsField>
          <LsField v-if="form.kind === 3" label="卡密活动" for-id="product-campaign" required><NSelect id="product-campaign" v-model:value="form.redemption_campaign_id" :options="campaigns" filterable /></LsField>
          <p v-if="pricingLocked" class="form-intro" role="note">售价、成本和分成由所选权益包的服务项目自动汇总。若要调整，请新建或修改尚未被引用的权益包。</p>
          <LsField label="售价" for-id="product-price" required :hint="pricingLocked ? '由权益包自动汇总' : undefined"><NInputNumber id="product-price" v-model:value="form.price" :min="0" :step="0.01" :precision="2" :disabled="pricingLocked" /></LsField>
          <LsField v-if="!personal" label="专属 Entity" for-id="product-owner"><LsEntitySelect id="product-owner" v-model="form.entity_id" :entities="entities" :loading="options.isPending.value" :disabled="options.isError.value" clearable placeholder="留空表示团队公用商品" /></LsField>
          <LsField label="可选接单人" for-id="product-handlers" hint="普通商品用于下单选择；服务商品的核销接单池由服务定义控制。"><LsEntitySelect id="product-handlers" v-model="form.handler_entity_ids" :entities="entities" :loading="options.isPending.value" :disabled="options.isError.value" multiple clearable placeholder="选择可选接单人" /></LsField>
      </LsFormSection>
      <LsFormSection v-if="pricingLocked" title="权益包分配汇总" description="订单创建后，实际金额继续按每个服务项冻结，不会平均分摊。">
          <dl class="pricing-breakdown">
            <div><dt>成本</dt><dd>¥{{ benefitPricingSummary?.cost }}</dd></div>
            <div><dt>接单分成</dt><dd>¥{{ benefitPricingSummary?.handler_cut }}</dd></div>
            <div><dt>发单分成</dt><dd>¥{{ benefitPricingSummary?.sender_cut }}</dd></div>
            <div><dt>客服分成</dt><dd>¥{{ benefitPricingSummary?.cs_cut }}</dd></div>
            <div><dt>团队分成</dt><dd>¥{{ benefitPricingSummary?.team_cut }}</dd></div>
          </dl>
      </LsFormSection>
      <LsFormSection v-else title="默认分配" description="修改售价或成本后，将按团队设置重算人员分配；订单创建时冻结当前金额。">
          <LsField label="成本" for-id="product-cost"><NInputNumber id="product-cost" v-model:value="form.cost" :min="0" :step="0.01" :precision="2" /></LsField>
          <LsField label="接单分配" for-id="product-handler-cut"><NInputNumber id="product-handler-cut" v-model:value="form.handler_cut" :min="0" :precision="2" clearable /></LsField>
          <LsField label="发单分配" for-id="product-sender-cut"><NInputNumber id="product-sender-cut" v-model:value="form.sender_cut" :min="0" :precision="2" clearable /></LsField>
          <LsField label="客服分配" for-id="product-cs-cut"><NInputNumber id="product-cs-cut" v-model:value="form.cs_cut" :min="0" :precision="2" clearable /></LsField>
          <LsField label="团队分配" for-id="product-team-cut" :hint="teamCutHint"><NInputNumber id="product-team-cut" :value="teamCut" :precision="2" disabled /></LsField>
      </LsFormSection>
      <ProductFieldsEditor
        v-if="editing"
        ref="fieldsEditor"
        :product-id="id"
        :scope="scope"
        :expected-entity-id="expectedEntityId"
      />
      <LsInlineError v-if="detail.isError.value" :message="friendlyError(detail.error.value)" />
      <LsInlineError v-if="options.isError.value" :message="friendlyError(options.error.value)" />
      <LsInlineError v-if="save.isError.value" :message="friendlyError(save.error.value)" />
      <LsFormActions>
        <LsButton type="button" variant="secondary" @click="router.back()">取消</LsButton>
        <LsButton type="submit" :disabled="Boolean(uploading) || !valid || !canManage(management.permission) || (personal && !expectedEntityId)" :loading="save.isPending.value">保存商品</LsButton>
      </LsFormActions>
    </form>
  </div>
</template>

<style scoped>
.pricing-breakdown { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .75rem; margin: 0; }
.pricing-breakdown div { padding: .8rem; background: var(--cloud); border-radius: 10px; }
.pricing-breakdown dt { color: var(--muted-ink); font-size: .75rem; }
.pricing-breakdown dd { margin: .2rem 0 0; color: var(--ink); font-weight: 700; font-variant-numeric: tabular-nums; }
@media (max-width: 767px) { .pricing-breakdown { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 479px) { .pricing-breakdown { grid-template-columns: 1fr; } }
</style>
