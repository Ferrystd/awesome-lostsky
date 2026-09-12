<script setup lang="ts">
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
import { NAlert, NFormItem, NInput, NInputNumber, NSelect } from 'naive-ui'
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AdminPageHeader from '../components/AdminPageHeader.vue'
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
    form.field_key = field.field_key
    form.name = field.name
    form.value_type = field.value_type
    form.input_type = field.input_type
    form.options = normalizeJoinOptions(field.options).map((option) => ({
      key: nextOptionKey(),
      ...option,
    }))
    form.default_value = field.default_value ?? ''
    form.is_apply_fillable = Boolean(field.is_apply_fillable)
    form.is_apply_required = Boolean(field.is_apply_required)
    form.is_transfer_entity_field = Boolean(field.is_transfer_entity_field)
    form.entity_field_id = field.entity_field_id ? Number(field.entity_field_id) : null
    form.is_active = Boolean(field.is_active)
    form.sort = Number(field.sort ?? 0)
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

function payload() {
  return {
    name: form.name.trim(),
    value_type: form.value_type,
    input_type: form.input_type,
    options: usesJoinOptions(form.input_type)
      ? form.options.map((option) => ({
          label: option.label.trim(),
          value: option.value.trim(),
        }))
      : null,
    default_value: form.default_value || null,
    is_apply_fillable: form.is_apply_fillable ? 1 : 0,
    is_apply_required: form.is_apply_fillable && form.is_apply_required ? 1 : 0,
    is_transfer_entity_field: form.is_transfer_entity_field ? 1 : 0,
    entity_field_id: form.is_transfer_entity_field ? form.entity_field_id : null,
    is_active: form.is_active ? 1 : 0,
    sort: form.sort,
  }
}

const save = useMutation({
  mutationFn: () =>
    editing.value
      ? api.post('/joinField/edit', { id: id.value, ...payload() })
      : api.post('/joinField/add', {
          field_key: form.field_key.trim(),
          ...payload(),
        }),
  onSuccess: async () => {
    feedback.success(editing.value ? '申请字段已更新' : '申请字段已创建')
    await client.invalidateQueries({ queryKey: ['join-fields'] })
    await router.replace('/join-fields')
  },
})
const remove = useMutation({
  mutationFn: () => api.post('/joinField/delete', { id: id.value }),
  onSuccess: async () => {
    feedback.success('申请字段已删除')
    await client.invalidateQueries({ queryKey: ['join-fields'] })
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
  <div class="join-field-form-page">
    <AdminPageHeader :title="editing ? (canWrite ? '编辑申请字段' : '查看申请字段') : '创建申请字段'" description="字段标识创建后保持不变；停用字段不会出现在新的加入申请表中。" back-to="/join-fields" back-label="返回申请字段" />

    <LsAsyncState v-if="access.isPending.value" state="loading" :rows="5" />
    <LsAsyncState v-else-if="access.isError.value" state="error" title="暂时无法确认申请字段权限" :description="friendlyError(access.error.value)" />
    <LsAsyncState v-else-if="editing && canRead && fieldsQuery.isPending.value" state="loading" :rows="7" />
    <LsAsyncState v-else-if="editing && canRead && fieldsQuery.isError.value" state="error" title="暂时无法读取申请字段" :description="friendlyError(fieldsQuery.error.value)" />
    <NAlert v-else-if="editing && !detail" type="warning" title="申请字段不存在">该字段可能已删除，或不属于当前团队。</NAlert>
    <form v-else @submit.prevent="submit">
      <LsField label="字段标识" for-id="join-field-key" :required="!editing" :error="errors.field_key" hint="创建后不可修改；用于稳定识别提交数据。">
        <template #default="{ invalid }"><NInput v-model:value="form.field_key" :input-props="{ id: 'join-field-key', 'aria-label': '字段标识' }" :disabled="editing || !canWrite" :status="invalid ? 'error' : undefined" maxlength="64" placeholder="experience" /></template>
      </LsField>
      <LsField label="字段名称" for-id="join-field-name" required :error="errors.name">
        <template #default="{ invalid }"><NInput v-model:value="form.name" :input-props="{ id: 'join-field-name', 'aria-label': '字段名称' }" :disabled="!canWrite" :status="invalid ? 'error' : undefined" maxlength="50" placeholder="相关经验" /></template>
      </LsField>
      <LsField label="值类型" for-id="join-field-value-type" hint="决定提交值的存储方式。">
        <NSelect id="join-field-value-type" v-model:value="form.value_type" :disabled="!canWrite" :options="valueTypeOptions" aria-label="值类型" />
      </LsField>
      <LsField label="输入控件" for-id="join-field-input-type" hint="决定申请人在加入页面看到的控件。">
        <NSelect id="join-field-input-type" v-model:value="form.input_type" :disabled="!canWrite" :options="inputTypeOptions" aria-label="输入控件" />
      </LsField>

      <NFormItem v-if="usesJoinOptions(form.input_type)" label="选项" :validation-status="errors.options ? 'error' : undefined" :feedback="errors.options || '申请人看到显示名称，提交时保存对应的提交值。'">
        <LsFormList v-model="form.options" :item-key="(option) => option.key" :create-item="() => ({ key: nextOptionKey(), label: '', value: '' })" item-label="选项" add-label="添加选项" empty-text="尚未添加选项" :disabled="!canWrite">
          <template #item="{ item, index }">
            <div class="option-grid">
              <label><span>显示名称</span><NInput :id="index === 0 ? 'join-field-options' : undefined" v-model:value="item.label" :disabled="!canWrite" placeholder="例如：有相关经验" :aria-label="`选项 ${index + 1} 显示名称`" /></label>
              <label><span>提交值</span><NInput v-model:value="item.value" :disabled="!canWrite" placeholder="例如：experienced" :aria-label="`选项 ${index + 1} 提交值`" /></label>
            </div>
          </template>
        </LsFormList>
      </NFormItem>

      <LsField label="默认值" for-id="join-field-default" :error="errors.default_value" hint="申请人未填写时由服务端采用；选项字段应填写对应提交值。">
        <template #default="{ invalid }"><NInput v-model:value="form.default_value" :input-props="{ id: 'join-field-default', 'aria-label': '默认值' }" :disabled="!canWrite" :status="invalid ? 'error' : undefined" maxlength="500" clearable /></template>
      </LsField>

      <section class="settings" aria-labelledby="application-settings-title">
        <LsSectionHeader id="application-settings-title" title="申请表规则" description="这些设置只影响新的加入申请，不改写历史提交。" />
        <LsSwitchField v-model="form.is_apply_fillable" label="允许申请人填写" description="关闭后字段不会出现在申请表，也不会保存新的字段值。" :disabled="!canWrite" />
        <LsSwitchField v-model="form.is_apply_required" label="申请时必填" description="提交申请前必须填写；只有允许填写时才能开启。" :disabled="!canWrite || !form.is_apply_fillable" />
        <LsSwitchField v-model="form.is_active" label="启用字段" description="停用后从申请表隐藏，但仍保留历史数据并可重新启用。" :disabled="!canWrite" />
      </section>

      <section class="settings" aria-labelledby="transfer-settings-title">
        <LsSectionHeader id="transfer-settings-title" title="审批后转存" description="申请通过并创建成员后，可把该值写入一位人员对象字段。" />
        <LsSwitchField v-model="form.is_transfer_entity_field" label="自动转存" description="目标必须是当前团队的人员对象字段。" :disabled="!canWrite" />
        <LsField v-if="form.is_transfer_entity_field" label="转存目标" for-id="join-field-transfer" required :error="errors.entity_field_id">
          <NSelect id="join-field-transfer" v-model:value="form.entity_field_id" :disabled="!canWrite || transferQuery.isError.value" :loading="transferQuery.isPending.value" :options="transferSelectOptions" filterable placeholder="选择人员对象字段" aria-label="转存目标" />
        </LsField>
        <LsInlineError v-if="form.is_transfer_entity_field && transferQuery.isError.value" :message="friendlyError(transferQuery.error.value)" />
      </section>

      <LsField label="排序" for-id="join-field-sort" hint="数值越小越靠前；相同数值按字段 ID 排序。">
        <NInputNumber id="join-field-sort" v-model:value="form.sort" :disabled="!canWrite" :precision="0" aria-label="排序" />
      </LsField>
      <LsInlineError v-if="save.isError.value || remove.isError.value" :message="friendlyError(save.error.value || remove.error.value)" />
      <div class="actions">
        <LsButton type="submit" :loading="save.isPending.value" :disabled="!canWrite" :disabled-reason="!canWrite ? permissionReason('team.join_field.write') : undefined">保存字段</LsButton>
        <LsButton v-if="editing" type="button" variant="danger" :loading="remove.isPending.value" :disabled="!canWrite" :disabled-reason="!canWrite ? permissionReason('team.join_field.write') : undefined" @click="deleteField">删除字段</LsButton>
      </div>
    </form>
  </div>
</template>

<style scoped>
.join-field-form-page {
  display: grid;
  gap: 1.5rem;
}
form {
  display: grid;
  gap: 1.25rem;
  padding: 1.25rem;
  background: white;
  border: 1px solid var(--line);
  border-radius: 12px;
}
.settings {
  display: grid;
  gap: 1rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--line);
}
.option-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 0.75rem;
}
.option-grid label {
  display: grid;
  gap: 0.35rem;
}
.option-grid label span {
  color: var(--muted-ink);
  font-size: 0.76rem;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding-top: 0.25rem;
}
@media (max-width: 639px) {
  .join-field-form-page {
    gap: 1rem;
  }
  form {
    padding: 1rem;
  }
  .option-grid {
    grid-template-columns: 1fr;
  }
  .actions {
    display: grid;
  }
  .actions > * {
    width: 100%;
  }
}
</style>
