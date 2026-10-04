<script setup lang="ts">
import ServiceCompletionSettings from '../../components/ServiceCompletionSettings.vue'
import { friendlyError } from '@lostsky/api/client'
import { isValidQuantityStep } from '@lostsky/shared/quantity'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsEntitySelect from '@lostsky/ui/components/LsEntitySelect.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsFormActions from '@lostsky/ui/components/LsFormActions.vue'
import LsFormSection from '@lostsky/ui/components/LsFormSection.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import LsPagePrimaryAction from '@lostsky/ui/components/LsPagePrimaryAction.vue'
import LsSwitchField from '@lostsky/ui/components/LsSwitchField.vue'
import { feedback } from '@lostsky/ui/feedback'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { Eye } from '@lucide/vue'
import { NInput, NInputNumber } from 'naive-ui'
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ServiceFieldsEditor from '../../components/ServiceFieldsEditor.vue'
import { canManage, entitlementManagement, loadManageAccess, managePermissionReason } from '../../lib'
import { calculateDefaultServiceDistribution, calculateServiceTeamCut } from '../../service-distribution'
import { hydrateServiceRedemptionFields, serializeServiceRedemptionFields, validServiceRedemptionFields } from '../../service-redemption-fields'
import type { ServiceRedemptionFieldDraft } from '../../types'
import { personalDistributionLocked, withoutPersonnelCuts } from '../../personal-pricing'
import { validAutoCompleteAfterMinutes } from '../../product-variants'
import { useQueryDraft } from '@lostsky/shared/useQueryDraft'
import { useUnsavedChangesGuard } from '@lostsky/shared/useUnsavedChangesGuard'

type ServiceFormState = {
  name: string
  description: string
  unit_name: string
  quantity_step: number | null
  auto_complete_after_minutes: number | null
  unused_auto_complete_after_minutes: number | null
  default_total_price: number | null
  default_cost: number | null
  default_handler_cut: number | null
  default_sender_cut: number | null
  default_cs_cut: number | null
  is_active: 0 | 1
}

const route = useRoute()
const routeAccess = useRouteAccess()
const router = useRouter()
const client = useQueryClient()
const id = computed(() => Number(route.params.id || 0))
const editing = computed(() => id.value > 0)
const scope = computed(() => route.meta.workspace === 'personal' ? 'personal' : 'team')
const management = computed(() => entitlementManagement(scope.value))
const personal = computed(() => management.value.personal)
const access = useQuery({ queryKey: ['shop-manage-access'], queryFn: () => loadManageAccess() })
const expectedEntityId = computed(() => access.data.value?.identity?.entity_id ?? 0)
const distributionLocked = computed(() => personalDistributionLocked(personal.value, access.data.value?.permissions))
const form = reactive<ServiceFormState>({
  name: '', description: '', unit_name: '次', quantity_step: 1, auto_complete_after_minutes: null, unused_auto_complete_after_minutes: null,
  default_total_price: 0, default_cost: 0, default_handler_cut: 0,
  default_sender_cut: 0, default_cs_cut: 0, is_active: 1,
})
const distributionRates = reactive({ handler: 80, sender: 15, customerService: 0 })
let autoCompleteDefaultApplied = false
let autoCompleteTouched = false
function updateAutoComplete(value: number | null) {
  autoCompleteTouched = true
  form.auto_complete_after_minutes = value
}
let hydratingAmounts = false
const handlerIds = ref<number[]>([])
const redemptionFields = ref<ServiceRedemptionFieldDraft[]>([])
const draftSnapshot = () => JSON.stringify({ form, handlerIds: handlerIds.value, redemptionFields: redemptionFields.value })
const draft = useQueryDraft({
  key: () => `${access.data.value?.team?.id ?? 0}:${expectedEntityId.value}:${scope.value}:service:${id.value}`,
  read: draftSnapshot,
  apply: snapshot => {
    hydratingAmounts = true
    const value = JSON.parse(snapshot)
    Object.assign(form, value.form)
    handlerIds.value = value.handlerIds
    redemptionFields.value = value.redemptionFields
    hydratingAmounts = false
  },
})
const hasUnsavedChanges = draft.dirty
useUnsavedChangesGuard(hasUnsavedChanges, { shouldConfirm: (to, from) => to.path !== from.path })
watch([id, scope, expectedEntityId, () => access.data.value?.team?.id], () => { autoCompleteDefaultApplied = false; autoCompleteTouched = false }, { flush: 'sync' })
const options = useQuery({ queryKey: computed(() => [scope.value, 'manage-options']), queryFn: () => management.value.options(), enabled: computed(() => !routeAccess.restricted.value) })
const detail = useQuery({ queryKey: computed(() => [scope.value, 'manage-service', id.value]), queryFn: () => routeAccess.read(() => management.value.service(id.value)), enabled: computed(() => editing.value && !routeAccess.restricted.value) })

watch([() => detail.data.value, expectedEntityId, () => access.data.value?.team?.id], ([data]) => {
  if (!data || data.id !== id.value || hasUnsavedChanges.value) return
  hydratingAmounts = true
  Object.assign(form, {
    name: data.name,
    description: data.description ?? '',
    unit_name: data.unit_name,
    quantity_step: Number(data.quantity_step),
    unused_auto_complete_after_minutes: data.unused_auto_complete_after_minutes ?? null,
    auto_complete_after_minutes: data.auto_complete_after_minutes ?? null,
    default_total_price: Number(data.default_total_price),
    default_cost: Number(data.default_cost),
    default_handler_cut: Number(data.default_handler_cut),
    default_sender_cut: Number(data.default_sender_cut),
    default_cs_cut: Number(data.default_cs_cut),
    is_active: data.is_active,
  })
  handlerIds.value = (data.handlers ?? []).map(item => Number(item.entity_id))
  redemptionFields.value = hydrateServiceRedemptionFields(data.redemption_fields)
  hydratingAmounts = false
  draft.reset(draftSnapshot())
}, { immediate: true })
watch([() => options.data.value?.service_defaults, expectedEntityId, () => access.data.value?.team?.id], ([defaults]) => {
  if (!defaults || hasUnsavedChanges.value) return
  Object.assign(distributionRates, {
    handler: defaults.default_handler_rate_percent,
    sender: defaults.default_sender_rate_percent,
    customerService: defaults.default_cs_rate_percent,
  })
  if (editing.value) return
  if (!autoCompleteDefaultApplied) {
    if (!autoCompleteTouched) form.auto_complete_after_minutes = defaults.default_auto_complete_after_minutes ?? null
    autoCompleteDefaultApplied = true
  }
  Object.assign(form, {
    unit_name: defaults.default_unit_name,
    quantity_step: Number(defaults.default_quantity_step),
  })
  recalculatePersonnelCuts()
  draft.reset(draftSnapshot())
}, { immediate: true })

function recalculatePersonnelCuts() {
  if (hydratingAmounts || (editing.value && distributionLocked.value)) return
  const distribution = calculateDefaultServiceDistribution(
    form.default_total_price,
    form.default_cost,
    distributionRates,
  )
  Object.assign(form, {
    default_handler_cut: distribution.handler,
    default_sender_cut: distribution.sender,
    default_cs_cut: distribution.customerService,
  })
}

watch(
  () => [form.default_total_price, form.default_cost] as const,
  recalculatePersonnelCuts,
  { flush: 'sync' },
)

const teamCut = computed(() => calculateServiceTeamCut(
  form.default_total_price,
  form.default_cost,
  form.default_handler_cut,
  form.default_sender_cut,
  form.default_cs_cut,
))
const teamCutHint = computed(() => teamCut.value < 0
  ? '人员分成超过可分成金额，请调低分成后再保存。'
  : '自动取单位服务价值扣除成本与人员分成后的余额。')

const handlerEntities = computed(() => (options.data.value?.entities ?? []).filter(entity =>
  ['team', 'teamMember', 'teamVirtual'].includes(String(entity.type)),
))
const save = useMutation({
  mutationFn: async () => {
    if (!valid.value) throw new Error('请完整填写服务信息并检查自动结单时长。')
    const submission = draft.capture()
    const data = await management.value.saveService(editing.value ? id.value : null, {
    ...(distributionLocked.value && !editing.value ? withoutPersonnelCuts(form, 'default_') : form),
    default_team_cut: teamCut.value,
    handler_entity_ids: handlerIds.value,
    redemption_fields: serializeServiceRedemptionFields(redemptionFields.value),
    }, expectedEntityId.value)
    return { data, submission }
  },
  onSuccess: async ({ data, submission }) => {
    if (!draft.accept(submission)) return
    await Promise.all([
      client.invalidateQueries({ queryKey: [scope.value, 'manage-options'] }),
      client.invalidateQueries({ queryKey: [scope.value, 'manage-services'] }),
      client.invalidateQueries({ queryKey: [scope.value, 'manage-service', data.id] }),
    ])
    if (!draft.isCurrent(submission)) return
    feedback.success('服务已保存')
    if (!hasUnsavedChanges.value) await router.push(`${management.value.routePrefix}/services/${data.id}`)
  },
})
const finite = (value: number | null) => typeof value === 'number' && Number.isFinite(value)
const nonNegative = (value: number | null) => finite(value) && (value as number) >= 0
const valid = computed(() => Boolean(
  !options.isPending.value && !options.isError.value
  && (!editing.value || (!detail.isPending.value && !detail.isError.value))
  && form.name.trim()
  && form.unit_name.trim()
  && finite(form.quantity_step)
  && isValidQuantityStep(form.quantity_step as number)
  && validAutoCompleteAfterMinutes(form.unused_auto_complete_after_minutes) && validAutoCompleteAfterMinutes(form.auto_complete_after_minutes)
  && nonNegative(form.default_total_price)
  && nonNegative(form.default_cost)
  && (form.default_cost as number) <= (form.default_total_price as number)
  && nonNegative(form.default_handler_cut)
  && nonNegative(form.default_sender_cut)
  && nonNegative(form.default_cs_cut)
  && teamCut.value >= 0
  && validServiceRedemptionFields(redemptionFields.value)
))
</script>

<template>
  <div class="manage-page">
    <LsPageHeader :title="editing ? (personal ? '编辑本人服务' : '编辑服务') : (personal ? '新建本人服务' : '新建服务')" description="定义服务的计量、金额、接单池与核销字段；同一商品中的不同服务可以使用各自字段。" :back-to="`${management.routePrefix}/services`" back-label="返回服务">
      <template #actions>
        <LsPagePrimaryAction v-if="editing" :icon="Eye" label="预览商品" href="/" target="_blank" rel="noopener noreferrer" />
      </template>
    </LsPageHeader>

    <form class="manage-form" @submit.prevent="routeAccess.restricted.value ? feedback.info(routeAccess.reason.value) : !save.isPending.value && hasUnsavedChanges && valid && save.mutate()">
      <LsFormSection title="基本信息">
        <p v-if="personal" class="form-intro" role="note">此服务自动归属当前已领取的人员，个人工作台不能转移归属。</p>
        <LsField label="服务名称" for-id="service-name" required><NInput id="service-name" v-model:value="form.name" maxlength="100" /></LsField>
        <LsField label="说明" for-id="service-description"><NInput id="service-description" v-model:value="form.description" type="textarea" maxlength="1000" show-count /></LsField>
        <LsSwitchField id="service-active" :model-value="form.is_active === 1" label="启用状态" description="停用后不能用于新的权益配置或发起新任务。" @update:model-value="value => form.is_active = value ? 1 : 0" />
      </LsFormSection>
      <LsFormSection title="计量规则" description="同一套模型可表达按人、按次、按小时或其他可计量服务。">
        <ServiceCompletionSettings id-prefix="service" v-model:unused-minutes="form.unused_auto_complete_after_minutes" :confirmation-minutes="form.auto_complete_after_minutes" @update:confirmation-minutes="updateAutoComplete" />
        <LsField label="计量单位" for-id="service-unit" required hint="例如：人、次、小时"><NInput id="service-unit" v-model:value="form.unit_name" maxlength="20" /></LsField>
        <LsField label="最小核销单位" for-id="service-step" required hint="最多四位小数；数量精度自动确定，每次履约数量必须是该核销单位的整数倍。"><NInputNumber id="service-step" v-model:value="form.quantity_step" :min="0.0001" :step="0.0001" :validator="isValidQuantityStep" /></LsField>
      </LsFormSection>
      <LsFormSection title="默认单位金额与分成" :description="distributionLocked ? (editing ? '人员分成沿用已保存金额，团队分成取余额。' : '人员分成按团队默认比例生成，团队分成取余额。') : '修改服务价值或成本后，将按团队设置重算人员分成；团队分成始终取余额。'">
        <LsField label="单位服务价值" for-id="service-price"><NInputNumber id="service-price" v-model:value="form.default_total_price" :min="0" :step="0.01" :precision="2" /></LsField>
        <LsField label="单位成本" for-id="service-cost"><NInputNumber id="service-cost" v-model:value="form.default_cost" :min="0" :step="0.01" :precision="2" /></LsField>
        <LsField label="单位接单分成" for-id="service-handler-cut"><NInputNumber id="service-handler-cut" v-model:value="form.default_handler_cut" :min="0" :precision="2" :disabled="distributionLocked" /></LsField>
        <LsField label="单位发单分成" for-id="service-sender-cut"><NInputNumber id="service-sender-cut" v-model:value="form.default_sender_cut" :min="0" :precision="2" :disabled="distributionLocked" /></LsField>
        <LsField label="单位客服分成" for-id="service-cs-cut"><NInputNumber id="service-cs-cut" v-model:value="form.default_cs_cut" :min="0" :precision="2" :disabled="distributionLocked" /></LsField>
        <LsField label="单位团队分成" for-id="service-team-cut" :hint="teamCutHint"><NInputNumber id="service-team-cut" :value="teamCut" :precision="2" disabled /></LsField>
      </LsFormSection>
      <LsFormSection title="接单池" description="留空表示不限接单人；指定名单后，只有名单内的有效人员可以接受邀请或领取新任务。">
        <LsField label="可接单人员" for-id="service-handlers" hint="仅可选择当前团队内有效的 Team、TeamMember 或 TeamVirtual Entity。">
          <LsEntitySelect id="service-handlers" v-model="handlerIds" :entities="handlerEntities" :loading="options.isPending.value" :disabled="options.isError.value" multiple clearable placeholder="不限接单人" />
        </LsField>
      </LsFormSection>
      <ServiceFieldsEditor v-model="redemptionFields" />
      <LsInlineError v-if="!routeAccess.restricted.value && detail.isError.value" :message="friendlyError(detail.error.value)" />
      <LsInlineError v-if="!routeAccess.restricted.value && options.isError.value" :message="`接单人员暂时无法读取：${friendlyError(options.error.value)}`" />
      <LsInlineError v-if="save.isError.value" :message="friendlyError(save.error.value)" />
      <LsFormActions><LsButton type="button" variant="secondary" @click="router.back()">取消</LsButton><LsButton type="submit" :disabled="routeAccess.restricted.value || !hasUnsavedChanges || !valid || !canManage(management.permission) || (personal && !expectedEntityId)" :disabled-reason="routeAccess.reason.value || (!canManage(management.permission) ? managePermissionReason(management.permission) : '')" :loading="save.isPending.value">保存服务</LsButton></LsFormActions>
    </form>
  </div>
</template>
