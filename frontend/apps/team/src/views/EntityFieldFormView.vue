<script setup lang="ts">
import LsFormActions from '@lostsky/ui/components/LsFormActions.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import { useQueryDraft } from '@lostsky/shared/useQueryDraft'
import { useUnsavedChangesGuard } from '@lostsky/shared/useUnsavedChangesGuard'
import { teamDraftScope, teamDraftNavigationChanged } from '../lib/draftScope'
import { api, friendlyError } from '@lostsky/api/client'
import { enumOptionValue } from '@lostsky/ui/lib/enum'
import LsEntitySelect from '@lostsky/ui/components/LsEntitySelect.vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { NInput, NInputNumber, NSelect } from 'naive-ui'
import { computed, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsSectionHeader from '@lostsky/ui/components/LsSectionHeader.vue'
import LsSwitchField from '@lostsky/ui/components/LsSwitchField.vue'
import AdminPageHeader from '../components/AdminPageHeader.vue'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'

type EntityType = 'entity' | 'customer' | 'virtual'
interface EntityField {
  id: number
  entity_type: EntityType
  field_key: string
  name: string
  value_type: string
  input_type: string
  options: unknown[] | null
  manager_scope: number
  visibility: number
  visibility_targets?: Array<{ entity_id: number }>
  is_required: number
  is_searchable: number
  sort: number
}
const route = useRoute()
const router = useRouter()
const client = useQueryClient()
const routeAccess = useRouteAccess()
const id = computed(() => Number(route.query.id ?? 0))
const editing = computed(() => id.value > 0)
const form = reactive({
  entity_type: String(route.query.type ?? 'entity') as EntityType,
  field_key: '',
  name: '',
  value_type: 'string',
  input_type: 'text',
  optionsText: '',
  manager_scope: 1,
  visibility: 1,
  visibility_target_ids: [] as number[],
  is_required: false,
  sort: 0,
})
const draftKey = () => teamDraftScope('EntityFieldFormView', id.value)
const draft = useQueryDraft({ key: draftKey, read: () => form, apply: value => Object.assign(form, value) })
useUnsavedChangesGuard(draft.dirty, { shouldConfirm: teamDraftNavigationChanged })

interface EntityOption {
  entity_id: number
  slug: string
  name: string
  type: 'team' | 'teamMember' | 'teamCustomer' | 'teamVirtual'
}
const entities = useQuery({
  queryKey: ['entity-options'],
  queryFn: () => api.get<EntityOption[]>('/entity/options'),
  enabled: computed(() => form.visibility === 6 && !routeAccess.restricted.value),
})
const managerScopeOptions = [
  { label: '仅字段管理员', value: 1 },
  { label: '对象本人和字段管理员', value: 2 },
]
const visibilityOptions = [
  { label: '仅字段管理员可见', value: 1 },
  { label: '对象本人和字段管理员可见', value: 3 },
  { label: '团队人员可见', value: 4 },
  { label: '公开可见', value: 5 },
  { label: '指定对象可见', value: 6 },
]
const detail = useQuery({
  queryKey: computed(() => ['entity-field', id.value]),
  queryFn: () => routeAccess.read(() => api.get<EntityField>('/entityField/get', { id: id.value })),
  enabled: computed(() => editing.value && !routeAccess.restricted.value),
})
watch(() => detail.data.value, value => {
  if (!value || value.id !== id.value) return
    const next = { ...form }
  next.entity_type = value.entity_type
  next.field_key = value.field_key
  next.name = value.name
  next.value_type = value.value_type
  next.input_type = value.input_type
  next.optionsText = Array.isArray(value.options) ? value.options.join('\n') : ''
  next.manager_scope = enumOptionValue(value.manager_scope, managerScopeOptions, 1)
  next.visibility = enumOptionValue(value.visibility, visibilityOptions, 1)
  next.visibility_target_ids = (value.visibility_targets ?? []).map(target => Number(target.entity_id))
  next.is_required = Boolean(value.is_required)
  next.sort = value.sort
  draft.hydrate(next)
}, { immediate: true })
const payload = (value = form) => ({
  entity_type: value.entity_type,
  field_key: value.field_key,
  name: value.name,
  value_type: value.value_type,
  input_type: value.input_type,
  options: value.optionsText.trim() ? value.optionsText.split('\n').map(item => item.trim()).filter(Boolean) : null,
  manager_scope: value.manager_scope,
  visibility: value.visibility,
  visibility_targets: value.visibility === 6
    ? value.visibility_target_ids.map(entity_id => ({ entity_id }))
    : [],
  is_required: value.is_required ? 1 : 0,
  sort: value.sort,
})
const save = useMutation({
  mutationFn: async () => {
    const submitted = draft.capture()
    const form = submitted.value
    const data = await ( editing.value
    ? api.post('/entityField/update', { id: id.value, ...payload(form) })
    : api.post('/entityField/create', payload(form))
    )
    return { data, submitted }
  },
  onSuccess: async ({ submitted }) => {
    if (!draft.accept(submitted) || draft.dirty.value) return
    await client.invalidateQueries({ queryKey: ['entity-fields'] })
    if (!draft.isCurrent(submitted) || draft.dirty.value) return
    router.replace('/fields')
  },
})
const remove = useMutation({
  mutationFn: async () => {
    const submitted = draft.capture()
    await api.post('/entityField/delete', { id: id.value })
    return submitted
  },
  onSuccess: submitted => {
    if (!draft.accept(submitted) || draft.dirty.value) return
    return router.replace('/fields')
  },
})
const typeOptions = [{ label: '人员', value: 'entity' }, { label: '顾客', value: 'customer' }, { label: '虚拟人员', value: 'virtual' }]
const valueOptions = [
  ['string', '短文本'], ['text', '长文本'], ['int', '整数'], ['decimal', '小数'],
  ['bool', '布尔值'], ['date', '日期'], ['datetime', '日期时间'], ['select', '单选值'],
  ['multi_select', '多选值'], ['json', 'JSON'],
].map(([value, label]) => ({ value, label }))
const inputOptions = [
  ['text', '单行输入'], ['textarea', '多行输入'], ['radio', '单选按钮'],
  ['checkbox', '复选项'], ['select', '下拉选择'], ['date', '日期选择'],
  ['datetime', '日期时间选择'],
].map(([value, label]) => ({ value, label }))
function deleteField() {
  if (routeAccess.restricted.value) return
  if (confirm('删除字段会同步删除全部对象的对应字段值，确认继续？')) remove.mutate()
}
function submit() {
  if (routeAccess.restricted.value) return
  save.mutate()
}
</script>

<template>
    <div class="field-form-page">
      <AdminPageHeader :title="editing ? '编辑对象字段' : '创建对象字段'" description="不同字段需要使用不同字段类型，以此更好的适配您的业务。" back-to="/fields" back-label="返回对象字段" />
      <LsPanel><form class="field-form" @submit.prevent="submit">
        <LsField label="对象类型" for-id="entity-field-type"><NSelect id="entity-field-type" v-model:value="form.entity_type" :disabled="editing" :options="typeOptions" /></LsField>
        <LsField label="字段标识" for-id="entity-field-key"><NInput :input-props="{ id: 'entity-field-key' }" v-model:value="form.field_key" :disabled="editing" maxlength="64" placeholder="department" /></LsField>
        <LsField label="字段名称" for-id="entity-field-name"><NInput :input-props="{ id: 'entity-field-name' }" v-model:value="form.name" maxlength="50" placeholder="部门" /></LsField>
        <LsField label="值类型" for-id="entity-field-value-type"><NSelect id="entity-field-value-type" v-model:value="form.value_type" :options="valueOptions" /></LsField>
        <LsField label="输入控件" for-id="entity-field-input-type"><NSelect id="entity-field-input-type" v-model:value="form.input_type" :options="inputOptions" /></LsField>
        <LsField v-if="['select','multi_select'].includes(form.value_type)" label="选项" for-id="entity-field-options"><NInput :input-props="{ id: 'entity-field-options' }" v-model:value="form.optionsText" type="textarea" :autosize="{ minRows: 3, maxRows: 8 }" placeholder="每行一个选项" /></LsField>
        <section class="access-policy" aria-labelledby="field-access-title">
          <LsSectionHeader id="field-access-title" title="访问与维护规则" description="可见范围不会授予页面访问权；能看见字段值的人员也不会因此自动获得编辑权。" />
          <LsField label="值维护范围" for-id="entity-field-manager"><NSelect id="entity-field-manager" v-model:value="form.manager_scope" :options="managerScopeOptions" /></LsField>
          <LsField label="值可见范围" for-id="entity-field-visibility"><NSelect id="entity-field-visibility" v-model:value="form.visibility" :options="visibilityOptions" /></LsField>
          <LsField v-if="form.visibility === 6" label="指定可见对象" for-id="entity-field-targets" hint="所选对象可在其原本有权打开的所有对象资料中查看该字段。">
            <LsEntitySelect
              :input-props="{ id: 'entity-field-targets', 'aria-label': '指定可见对象' }"
              v-model="form.visibility_target_ids"
              :entities="entities.data.value ?? []"
              :loading="entities.isPending.value"
              :disabled="entities.isError.value || !entities.data.value?.length"
              multiple
              clearable
              placeholder="选择可以查看此字段的对象"
            />
          </LsField>
          <p v-if="form.visibility === 5" class="policy-note">公开字段只有在所属人员有效且已开启公开主页展示时，才会向未登录访客显示。</p>
        </section>
        <LsSwitchField v-model="form.is_required" label="必填" description="在允许编辑该字段的资料保存时校验不能为空。" />
        <LsField label="排序" for-id="entity-field-sort"><NInputNumber :input-props="{ id: 'entity-field-sort' }" v-model:value="form.sort" :precision="0" /></LsField>
        <p v-if="(save.isError.value || remove.isError.value) && !routeAccess.restricted.value" class="error" role="alert">{{ friendlyError(save.error.value || remove.error.value) }}</p>
        <LsFormActions><LsButton type="submit" :disabled="routeAccess.restricted.value || !draft.dirty.value" :disabled-reason="routeAccess.reason.value" :loading="save.isPending.value">保存字段</LsButton><LsButton v-if="editing" type="button" variant="danger" :disabled="routeAccess.restricted.value" :disabled-reason="routeAccess.reason.value" :loading="remove.isPending.value" @click="deleteField">删除字段</LsButton></LsFormActions>
      </form></LsPanel>
    </div>
</template>

<style scoped>
.field-form-page,.field-form{display:grid;gap:1rem}.access-policy{display:grid;gap:1rem;padding:1.25rem 0 0;border-top:1px solid var(--line)}.policy-note{margin:0;padding:.75rem;color:var(--ink);background:var(--cloud);border-radius:9px;font-size:.8rem;line-height:1.55}.error{margin:0;color:var(--danger)}
</style>
