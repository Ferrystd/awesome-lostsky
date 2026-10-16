<script setup lang="ts">
import LsFormContent from '@lostsky/ui/components/LsFormContent.vue'
import LsFormFields from '@lostsky/ui/components/LsFormFields.vue'
import LsFormPage from '@lostsky/ui/components/LsFormPage.vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import { ArrowLeft } from '@lucide/vue'

import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsFormActions from '@lostsky/ui/components/LsFormActions.vue'
import { useQueryDraft } from '@lostsky/shared/useQueryDraft'
import { useUnsavedChangesGuard } from '@lostsky/shared/useUnsavedChangesGuard'
import { teamDraftScope, teamDraftNavigationChanged } from '../lib/draftScope'
import { api, friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsFormList from '@lostsky/ui/components/LsFormList.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsSectionHeader from '@lostsky/ui/components/LsSectionHeader.vue'
import LsSwitchField from '@lostsky/ui/components/LsSwitchField.vue'
import { feedback } from '@lostsky/ui/feedback'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { NAlert, NInput, NInputNumber, NSelect } from 'naive-ui'
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { hasPermission, permissionReason, useTeamAccess } from '../lib/teamAccess'
import { inputTypeOptions, normalizeJoinOptions, type JoinField, type JoinFieldOption, type JoinTransferOption, usesJoinOptions, valueTypeOptions } from '../lib/joinFields'

const route = useRoute()
const router = useRouter()
const client = useQueryClient()
const id = computed(() => Number(route.params.id ?? 0))
const editing = computed(() => id.value > 0)
const access = useTeamAccess()
const canRead = computed(() => hasPermission(access.data.value, 'team.join_field.read'))
const canWrite = computed(() => hasPermission(access.data.value, 'team.join_field.write'))
let optionSequence = 0
const nextOptionKey = () => `join-option-${++optionSequence}`

const form = reactive({
  field_key: '',
  name: '',
  value_type: 'string',
  input_type: 'text',
  options: [] as JoinFieldOption[],
  default_value: '',
  is_apply_fillable: true,
  is_apply_required: false,
  is_transfer_entity_field: false,
  entity_field_id: null as number | null,
  is_active: true,
  sort: 0,
})
const draftKey = () => teamDraftScope('JoinFieldFormView', id.value)
const draft = useQueryDraft({ key: draftKey, read: () => form, apply: value => Object.assign(form, value) })
useUnsavedChangesGuard(draft.dirty, { shouldConfirm: teamDraftNavigationChanged })

const errors = reactive({
  field_key: '',
  name: '',
  options: '',
  default_value: '',
  entity_field_id: '',
})

const fieldsQuery = useQuery({
  queryKey: ['join-fields'],
  queryFn: () => api.get<JoinField[]>('/joinField/index'),
  enabled: computed(() => editing.value && canRead.value),
})
const detail = computed(() => (fieldsQuery.data.value ?? []).find((field) => Number(field.id) === id.value))
const transferQuery = useQuery({
  queryKey: ['join-field-transfer-options'],
  queryFn: () => api.get<JoinTransferOption[]>('/joinField/transferOptions'),
  enabled: computed(() => canWrite.value && form.is_transfer_entity_field),
})
const transferSelectOptions = computed(() => {
  const result = (transferQuery.data.value ?? []).map((field) => ({
    label: `${field.name} (${field.field_key} · ${field.value_type})`,
    value: Number(field.id),
  }))
  const current = detail.value?.entity_field
  if (current && !result.some((option) => option.value === Number(current.id))) {
    result.push({
      label: `${current.name} (${current.field_key} · ${current.value_type})`,
      value: Number(current.id),
    })
  }
  return result
})

watch(
  detail,
  (field) => {
    if (!field) return
    const next = { ...form }
    next.field_key = field.field_key
    next.name = field.name
    next.value_type = field.value_type
    next.input_type = field.input_type
    next.options = normalizeJoinOptions(field.options).map((option) => ({
      key: nextOptionKey(),
      ...option,
    }))
    next.default_value = field.default_value ?? ''
    next.is_apply_fillable = Boolean(field.is_apply_fillable)
    next.is_apply_required = Boolean(field.is_apply_required)
    next.is_transfer_entity_field = Boolean(field.is_transfer_entity_field)
    next.entity_field_id = field.entity_field_id ? Number(field.entity_field_id) : null
    next.is_active = Boolean(field.is_active)
    next.sort = Number(field.sort ?? 0)
    draft.hydrate(next)
},
  { immediate: true },
)

watch(
  () => form.is_apply_fillable,
  (value) => {
    if (!value) form.is_apply_required = false
  },
)
watch(
  () => form.is_transfer_entity_field,
  (value) => {
    if (!value) form.entity_field_id = null
  },
)

function resetErrors() {
  errors.field_key = ''
  errors.name = ''
  errors.options = ''
  errors.default_value = ''
  errors.entity_field_id = ''
}

function validateForm() {
  resetErrors()
  if (!editing.value && !/^[a-z][a-z0-9_]{0,63}$/.test(form.field_key.trim())) {
    errors.field_key = '请使用小写字母开头，并只包含小写字母、数字或下划线。'
  }
  if (!form.name.trim()) errors.name = '字段名称不能为空。'
  if (form.name.trim().length > 50) errors.name = '字段名称不能超过 50 个字符。'
  if (form.default_value.length > 500) errors.default_value = '默认值不能超过 500 个字符。'
  if (usesJoinOptions(form.input_type)) {
    const normalized = form.options.map((option) => ({
      label: option.label.trim(),
      value: option.value.trim(),
    }))
    if (!normalized.length) errors.options = '当前输入控件至少需要一个选项。'
    else if (normalized.some((option) => !option.label || !option.value)) errors.options = '每个选项都需要显示名称和提交值。'
    else if (new Set(normalized.map((option) => option.value)).size !== normalized.length) errors.options = '选项的提交值不能重复。'
  }
  if (form.is_transfer_entity_field && !form.entity_field_id) errors.entity_field_id = '请选择审批通过后的转存目标。'
  return !Object.values(errors).some(Boolean)
}

function payload(value = form) {
  return {
    name: value.name.trim(),
    value_type: value.value_type,
    input_type: value.input_type,
    options: usesJoinOptions(value.input_type)
      ? value.options.map((option) => ({
          label: option.label.trim(),
          value: option.value.trim(),
        }))
      : null,
    default_value: value.default_value || null,
    is_apply_fillable: value.is_apply_fillable ? 1 : 0,
    is_apply_required: value.is_apply_fillable && value.is_apply_required ? 1 : 0,
    is_transfer_entity_field: value.is_transfer_entity_field ? 1 : 0,
    entity_field_id: value.is_transfer_entity_field ? value.entity_field_id : null,
    is_active: value.is_active ? 1 : 0,
    sort: value.sort,
  }
}

const save = useMutation({
  mutationFn: async () => {
    const submitted = draft.capture()
    const form = submitted.value
    const data = await (
    editing.value
      ? api.post('/joinField/edit', { id: id.value, ...payload(form) })
      : api.post('/joinField/add', {
          field_key: form.field_key.trim(),
          ...payload(form),
        })
    )
    return { data, submitted }
  },
  onSuccess: async ({ submitted }) => {
    if (!draft.accept(submitted) || draft.dirty.value) return
    feedback.success(editing.value ? '申请字段已更新' : '申请字段已创建')
    await client.invalidateQueries({ queryKey: ['join-fields'] })
    if (!draft.isCurrent(submitted) || draft.dirty.value) return
    await router.replace('/join-fields')
  },
})
const remove = useMutation({
  mutationFn: async () => {
    const submitted = draft.capture()
    await api.post('/joinField/delete', { id: id.value })
    return submitted
  },
  onSuccess: async submitted => {
    if (!draft.accept(submitted) || draft.dirty.value) return
    feedback.success('申请字段已删除')
    await client.invalidateQueries({ queryKey: ['join-fields'] })
    if (!draft.isCurrent(submitted) || draft.dirty.value) return
    await router.replace('/join-fields')
  },
})

function submit() {
  if (!canWrite.value || !validateForm()) return
  save.mutate()
}

function deleteField() {
  if (!canWrite.value) return
  if (confirm('确认删除这个申请字段？已有提交记录的字段不能删除，可以改为停用。')) remove.mutate()
}
</script>

<template>
  <LsFormPage :title="editing ? (canWrite ? '编辑申请字段' : '查看申请字段') : '创建申请字段'" description="字段标识创建后保持不变；停用字段不会出现在新的加入申请表中。">
    <template #actions>
      <LsPageLink to="/join-fields" :icon="ArrowLeft" label="返回申请字段" />
    </template>

    <LsAsyncState v-if="access.isPending.value" state="loading" :rows="5" />
    <LsAsyncState v-else-if="access.isError.value" state="error" title="暂时无法确认申请字段权限" :description="friendlyError(access.error.value)" />
    <LsAsyncState v-else-if="editing && canRead && fieldsQuery.isPending.value" state="loading" :rows="7" />
    <LsAsyncState v-else-if="editing && canRead && fieldsQuery.isError.value" state="error" title="暂时无法读取申请字段" :description="friendlyError(fieldsQuery.error.value)" />
    <NAlert v-else-if="editing && !detail" type="warning" title="申请字段不存在">该字段可能已删除，或不属于当前团队。</NAlert>
    <LsPanel v-else><form class="join-field-form" @submit.prevent="submit">
      <LsFormFields>
        <LsField label="字段标识" for-id="join-field-key" :required="!editing" :error="errors.field_key" hint="创建后不可修改；用于稳定识别提交数据。">
          <template #default="{ invalid, describedBy }"><NInput v-model:value="form.field_key" :input-props="{ 'aria-describedby': describedBy, id: 'join-field-key', 'aria-label': '字段标识' }" :disabled="editing || !canWrite" :status="invalid ? 'error' : undefined" maxlength="64" placeholder="experience" /></template>
        </LsField>
        <LsField label="字段名称" for-id="join-field-name" required :error="errors.name">
          <template #default="{ invalid, describedBy }"><NInput v-model:value="form.name" :input-props="{ 'aria-describedby': describedBy, id: 'join-field-name', 'aria-label': '字段名称' }" :disabled="!canWrite" :status="invalid ? 'error' : undefined" maxlength="50" placeholder="相关经验" /></template>
        </LsField>
        <LsField v-slot="{ describedBy }" label="值类型" for-id="join-field-value-type" hint="决定提交值的存储方式。">
          <NSelect :aria-describedby="describedBy" :input-props="{ 'aria-describedby': describedBy }" id="join-field-value-type" v-model:value="form.value_type" :disabled="!canWrite" :options="valueTypeOptions" aria-label="值类型" />
        </LsField>
        <LsField v-slot="{ describedBy }" label="输入控件" for-id="join-field-input-type" hint="决定申请人在加入页面看到的控件。">
          <NSelect :aria-describedby="describedBy" :input-props="{ 'aria-describedby': describedBy }" id="join-field-input-type" v-model:value="form.input_type" :disabled="!canWrite" :options="inputTypeOptions" aria-label="输入控件" />
        </LsField>

      </LsFormFields>
      <LsFormContent>
      <LsField v-if="usesJoinOptions(form.input_type)" label="选项" for-id="join-field-options" :error="errors.options" hint="申请人看到显示名称，提交时保存对应的提交值。">
        <LsFormList v-model="form.options" :item-key="(option) => option.key" :create-item="() => ({ key: nextOptionKey(), label: '', value: '' })" item-label="选项" add-label="添加选项" empty-text="尚未添加选项" :disabled="!canWrite" :disabled-reason="permissionReason('team.join_field.write')">
          <template #item="{ item, index }">
            <div class="option-grid">
              <LsField label="显示名称" :for-id="index === 0 ? 'join-field-options' : `join-option-label-${item.key}`"><NInput :input-props="{ id: index === 0 ? 'join-field-options' : `join-option-label-${item.key}`, 'aria-label': `选项 ${index + 1} 显示名称` }" v-model:value="item.label" :disabled="!canWrite" placeholder="例如：有相关经验" /></LsField>
              <LsField label="提交值" :for-id="`join-option-value-${item.key}`"><NInput :input-props="{ id: `join-option-value-${item.key}`, 'aria-label': `选项 ${index + 1} 提交值` }" v-model:value="item.value" :disabled="!canWrite" placeholder="例如：experienced" /></LsField>
            </div>
          </template>
        </LsFormList>
      </LsField>

      </LsFormContent>
      <LsFormFields>
        <LsField label="默认值" for-id="join-field-default" :error="errors.default_value" hint="申请人未填写时由服务端采用；选项字段应填写对应提交值。">
          <template #default="{ invalid, describedBy }"><NInput v-model:value="form.default_value" :input-props="{ 'aria-describedby': describedBy, id: 'join-field-default', 'aria-label': '默认值' }" :disabled="!canWrite" :status="invalid ? 'error' : undefined" maxlength="500" clearable /></template>
        </LsField>

      </LsFormFields>
      <section class="settings" aria-labelledby="application-settings-title">
        <LsSectionHeader id="application-settings-title" title="申请表规则" description="这些设置只影响新的加入申请，不改写历史提交。" />
        <LsFormFields>
          <LsSwitchField v-model="form.is_apply_fillable" label="允许申请人填写" description="关闭后字段不会出现在申请表，也不会保存新的字段值。" :disabled="!canWrite" />
          <LsSwitchField v-model="form.is_apply_required" label="申请时必填" description="提交申请前必须填写；只有允许填写时才能开启。" :disabled="!canWrite || !form.is_apply_fillable" />
          <LsSwitchField v-model="form.is_active" label="启用字段" description="停用后从申请表隐藏，但仍保留历史数据并可重新启用。" :disabled="!canWrite" />
        </LsFormFields>
      </section>

      <section class="settings" aria-labelledby="transfer-settings-title">
        <LsSectionHeader id="transfer-settings-title" title="审批后转存" description="申请通过并创建成员后，可把该值写入一位人员对象字段。" />
        <LsFormFields>
          <LsSwitchField v-model="form.is_transfer_entity_field" label="自动转存" description="目标必须是当前团队的人员对象字段。" :disabled="!canWrite" />
          <LsField v-slot="{ describedBy }" v-if="form.is_transfer_entity_field" label="转存目标" for-id="join-field-transfer" required :error="errors.entity_field_id">
            <NSelect :aria-describedby="describedBy" :input-props="{ 'aria-describedby': describedBy, id: 'join-field-transfer', 'aria-label': '转存目标' }" v-model:value="form.entity_field_id" :disabled="!canWrite || transferQuery.isError.value" :loading="transferQuery.isPending.value" :options="transferSelectOptions" filterable placeholder="选择人员对象字段" />
          </LsField>
        </LsFormFields>
        <LsInlineError v-if="form.is_transfer_entity_field && transferQuery.isError.value" :message="friendlyError(transferQuery.error.value)" />
      </section>

      <LsFormFields>
        <LsField v-slot="{ describedBy }" label="排序" for-id="join-field-sort" hint="数值越小越靠前；相同数值按字段 ID 排序。">
          <NInputNumber :input-props="{ 'aria-describedby': describedBy, id: 'join-field-sort' }" v-model:value="form.sort" :disabled="!canWrite" :precision="0" aria-label="排序" />
        </LsField>
      </LsFormFields>
      <LsInlineError v-if="save.isError.value || remove.isError.value" :message="friendlyError(save.error.value || remove.error.value)" />
      <LsFormActions>
        <LsButton type="submit" :loading="save.isPending.value" :disabled="!canWrite || !draft.dirty.value" :disabled-reason="!canWrite ? permissionReason('team.join_field.write') : undefined">保存字段</LsButton>
        <LsButton v-if="editing" type="button" variant="danger" :loading="remove.isPending.value" :disabled="!canWrite" :disabled-reason="!canWrite ? permissionReason('team.join_field.write') : undefined" @click="deleteField">删除字段</LsButton>
      </LsFormActions>
    </form></LsPanel>
  </LsFormPage>
</template>

<style scoped>
.join-field-form{display:grid;gap:1.25rem}.settings{display:grid;gap:1rem;padding-top:1.25rem;border-top:1px solid var(--line)}.option-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.75rem}@media(max-width:639px){.option-grid{grid-template-columns:1fr}}
</style>
