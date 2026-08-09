<script setup lang="ts">
import { api, friendlyError, uploadFileUrl } from '@lostsky/api/client'
import { formatAbilityDenied } from '@lostsky/api/error-format'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsFormActions from '@lostsky/ui/components/LsFormActions.vue'
import LsFormSection from '@lostsky/ui/components/LsFormSection.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsMarkdownEditor from '@lostsky/ui/components/LsMarkdownEditor.vue'
import LsMediaUploadField from '@lostsky/ui/components/LsMediaUploadField.vue'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import LsSwitchField from '@lostsky/ui/components/LsSwitchField.vue'
import { feedback } from '@lostsky/ui/feedback'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { NInput, NInputNumber, NSelect, useDialog } from 'naive-ui'
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { canManage, loadManageAccess, productManagement } from '../../lib'

const route = useRoute()
const router = useRouter()
const dialog = useDialog()
const id = computed(() => Number(route.params.id || 0))
const editing = computed(() => id.value > 0)
const scope = computed(() => route.meta.workspace === 'personal' ? 'personal' : 'team')
const management = computed(() => productManagement(scope.value))
const personal = computed(() => management.value.personal)
const access = useQuery({ queryKey: ['shop-manage-access'], queryFn: () => loadManageAccess() })
const expectedEntityId = computed(() => access.data.value?.identity?.entity_id ?? 0)
const uploading = ref<'cover' | 'markdown' | ''>('')
const uploadDisabledReason = computed(() => {
  if (access.isPending.value) return '正在核对文件上传能力'
  if (access.isError.value) return friendlyError(access.error.value)
  const fileAbility = access.data.value?.abilities?.file
  if (fileAbility && !fileAbility.enabled) return formatAbilityDenied('file', fileAbility.label ?? '文件上传')
  return ''
})
const form = reactive({
  name: '', description: '', cover_image: '', introduction_markdown: '', price: 0, cost: 0,
  handler_cut: null as number | null, sender_cut: null as number | null,
  cs_cut: null as number | null, team_cut: null as number | null,
  entity_id: null as number | null, kind: 1, benefit_package_id: null as number | null,
  redemption_campaign_id: null as number | null, is_active: 1,
  handler_entity_ids: [] as number[],
})
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
  Object.assign(form, data, {
    kind: kindNumber(data.kind),
    price: Number(data.price),
    cost: Number(data.cost),
    handler_cut: data.handler_cut == null ? null : Number(data.handler_cut),
    sender_cut: data.sender_cut == null ? null : Number(data.sender_cut),
    cs_cut: data.cs_cut == null ? null : Number(data.cs_cut),
    team_cut: data.team_cut == null ? null : Number(data.team_cut),
    handler_entity_ids: (data.handlers ?? []).map((handler: any) => Number(handler.entity_id)),
  })
}, { immediate: true })
const entities = computed(() => (options.data.value?.entities ?? []).map(entity => ({
  label: entity.name,
  value: Number(entity.entity_id ?? entity.id),
})))
const packages = computed(() => (options.data.value?.packages ?? []).map(item => ({ label: item.name, value: item.id })))
const campaigns = computed(() => (options.data.value?.campaigns ?? []).map(item => ({ label: item.name, value: item.id })))
watch(() => form.kind, value => {
  if (value !== 2) form.benefit_package_id = null
  if (value !== 3) form.redemption_campaign_id = null
})
async function uploadMarkdownImage(file: File) {
  if (uploadDisabledReason.value) throw new Error(uploadDisabledReason.value)
  uploading.value = 'markdown'
  try {
    return await uploadFileUrl(file)
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
      team_cut: form.team_cut,
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
    return { id: productId }
  },
  onSuccess: data => {
    feedback.success('商品已保存')
    void router.push(`${management.value.routeBase}/${data.id}`)
  },
})
const disable = useMutation({
  mutationFn: () => management.value.disableProduct(id.value, expectedEntityId.value),
  onSuccess: () => router.push(management.value.routeBase),
})
function stop() {
  dialog.warning({
    title: '下架商品',
    content: '下架后前台不再展示，历史订单和已交付权益保持不变。',
    positiveText: '确认下架',
    negativeText: '返回',
    onPositiveClick: () => disable.mutate(),
  })
}
const valid = computed(() => Boolean(
  form.name.trim() && form.cover_image.trim() && form.price >= 0
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
        <RouterLink v-if="editing" class="secondary-link" :to="`${management.routeBase}/${id}/fields`">核销字段</RouterLink>
        <a v-if="editing" class="secondary-link" :href="`/product/${id}`" target="_blank" rel="noopener noreferrer">预览前台</a>
        <LsButton v-if="editing && canManage(management.permission)" variant="danger" @click="stop">下架商品</LsButton>
      </template>
    </LsPageHeader>
    <form class="manage-form" @submit.prevent="save.mutate()">
      <LsFormSection title="基本信息">
          <LsField label="商品名称" for-id="product-name" required><NInput id="product-name" v-model:value="form.name" maxlength="100" /></LsField>
          <LsField label="简短说明" for-id="product-description"><NInput id="product-description" v-model:value="form.description" type="textarea" maxlength="500" show-count /></LsField>
          <LsField label="封面" for-id="product-cover" required hint="可粘贴已登记媒体 URL，或从本地上传图片。"><LsMediaUploadField id="product-cover" v-model="form.cover_image" :upload="uploadFileUrl" accept="image/*" placeholder="图片 URL 或上传文件" button-label="上传封面" :disabled="Boolean(uploading || uploadDisabledReason)" :disabled-reason="uploading ? '正在上传图片，请稍候' : uploadDisabledReason" @uploading="uploading = $event ? 'cover' : ''" @uploaded="feedback.success('商品封面已上传')" /></LsField>
          <LsField label="详情" for-id="product-markdown"><LsMarkdownEditor id="product-markdown" v-model="form.introduction_markdown" :draft-key="`shop-product-${scope}-${id || 'new'}`" :upload-image="uploadMarkdownImage" :upload-disabled-reason="uploading ? '正在上传图片，请稍候' : uploadDisabledReason" /></LsField>
          <LsSwitchField id="product-active" :model-value="form.is_active === 1" label="上架状态" description="关闭后商品不会在商城展示。" @update:model-value="value => form.is_active = value ? 1 : 0" />
      </LsFormSection>
      <LsFormSection title="销售与履约">
          <p v-if="personal" class="form-intro" role="note">此商品自动归属当前已领取的 Entity，个人工作台不能转移归属。</p>
          <LsField label="商品类型" for-id="product-kind" required><NSelect id="product-kind" v-model:value="form.kind" :options="[{ label: '普通商品', value: 1 }, { label: '服务套餐', value: 2 }, { label: '权益卡密', value: 3 }]" /></LsField>
          <LsField v-if="form.kind === 2" label="服务权益包" for-id="product-package" required><NSelect id="product-package" v-model:value="form.benefit_package_id" :options="packages" filterable /></LsField>
          <LsField v-if="form.kind === 3" label="卡密活动" for-id="product-campaign" required><NSelect id="product-campaign" v-model:value="form.redemption_campaign_id" :options="campaigns" filterable /></LsField>
          <LsField label="售价" for-id="product-price" required><NInputNumber id="product-price" v-model:value="form.price" :min="0" :precision="2" /></LsField>
          <LsField label="成本" for-id="product-cost"><NInputNumber id="product-cost" v-model:value="form.cost" :min="0" :precision="2" /></LsField>
          <LsField v-if="!personal" label="专属 Entity" for-id="product-owner"><NSelect id="product-owner" v-model:value="form.entity_id" :options="entities" filterable clearable placeholder="留空表示团队公用商品" /></LsField>
          <LsField label="可选接单人" for-id="product-handlers" hint="普通商品用于下单选择；服务商品的核销接单池由服务定义控制。"><NSelect id="product-handlers" v-model:value="form.handler_entity_ids" :options="entities" multiple filterable clearable /></LsField>
      </LsFormSection>
      <LsFormSection title="默认分配" description="留空时由服务端按商品规则补齐；填写的金额由订单创建时冻结。">
          <LsField label="接单分配" for-id="product-handler-cut"><NInputNumber id="product-handler-cut" v-model:value="form.handler_cut" :min="0" :precision="2" clearable /></LsField>
          <LsField label="发单分配" for-id="product-sender-cut"><NInputNumber id="product-sender-cut" v-model:value="form.sender_cut" :min="0" :precision="2" clearable /></LsField>
          <LsField label="客服分配" for-id="product-cs-cut"><NInputNumber id="product-cs-cut" v-model:value="form.cs_cut" :min="0" :precision="2" clearable /></LsField>
          <LsField label="团队分配" for-id="product-team-cut"><NInputNumber id="product-team-cut" v-model:value="form.team_cut" :min="0" :precision="2" clearable /></LsField>
      </LsFormSection>
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
