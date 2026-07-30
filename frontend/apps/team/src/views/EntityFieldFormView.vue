<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import { enumOptionValue } from '@lostsky/ui/lib/enum'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { NConfigProvider, NInput, NInputNumber, NSelect, NSwitch } from 'naive-ui'
import type { SelectOption, SelectRenderLabel } from 'naive-ui'
import { computed, h, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { lostskyNaiveTheme } from '@lostsky/ui/naive-theme'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import AdminPageHeader from '../components/AdminPageHeader.vue'
import EntitySelectOption from '../components/EntitySelectOption.vue'

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
  is_editable: number
  is_searchable: number
  sort: number
}
const route = useRoute()
const router = useRouter()
const client = useQueryClient()
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
  is_editable: true,
  sort: 0,
})
interface EntityOption {
  entity_id: number
  slug: string
  name: string
  type: 'team' | 'teamMember' | 'teamCustomer' | 'teamVirtual'
}
interface FieldEntitySelectOption extends SelectOption, EntityOption {}
const entitySelectMenuProps = { class: 'entity-select-menu' }
const entities = useQuery({
  queryKey: ['entity-options'],
  queryFn: () => api.get<EntityOption[]>('/entity/options'),
  enabled: computed(() => form.visibility === 6),
})
const entityOptions = computed<FieldEntitySelectOption[]>(() => (entities.data.value ?? []).map(entity => ({
  label: `${entity.name} ${entity.slug ? `@${entity.slug}` : ''}`,
  value: entity.entity_id,
  ...entity,
})))
const renderEntityLabel: SelectRenderLabel = option => h(EntitySelectOption, { entity: option as FieldEntitySelectOption })
const managerScopeOptions = [
  { label: '仅字段管理员', value: 1 },
  { label: '对象本人和字段管理员', value: 2 },
]
const visibilityOptions = [
  { label: '仅字段管理员可见', value: 1 },
  { label: '对象本人和字段管理员可见', value: 3 },
  { label: '团队实体可见', value: 4 },
  { label: '公开可见', value: 5 },
  { label: '指定对象可见', value: 6 },
]
const detail = useQuery({
  queryKey: computed(() => ['entity-field', id.value]),
  queryFn: () => api.get<EntityField>('/entityField/get', { id: id.value }),
  enabled: editing,
})
watch(() => detail.data.value, value => {
  if (!value) return
  form.entity_type = value.entity_type
  form.field_key = value.field_key
  form.name = value.name
  form.value_type = value.value_type
  form.input_type = value.input_type
  form.optionsText = Array.isArray(value.options) ? value.options.join('\n') : ''
  form.manager_scope = enumOptionValue(value.manager_scope, managerScopeOptions, 1)
  form.visibility = enumOptionValue(value.visibility, visibilityOptions, 1)
  form.visibility_target_ids = (value.visibility_targets ?? []).map(target => Number(target.entity_id))
  form.is_required = Boolean(value.is_required)
  form.is_editable = Boolean(value.is_editable)
  form.sort = value.sort
}, { immediate: true })
const payload = () => ({
  entity_type: form.entity_type,
  field_key: form.field_key,
  name: form.name,
  value_type: form.value_type,
  input_type: form.input_type,
  options: form.optionsText.trim() ? form.optionsText.split('\n').map(item => item.trim()).filter(Boolean) : null,
  manager_scope: form.manager_scope,
  visibility: form.visibility,
  visibility_targets: form.visibility === 6
    ? form.visibility_target_ids.map(entity_id => ({ entity_id }))
    : [],
  is_required: form.is_required ? 1 : 0,
  is_editable: form.is_editable ? 1 : 0,
  sort: form.sort,
})
const save = useMutation({
  mutationFn: () => editing.value
    ? api.post('/entityField/update', { id: id.value, ...payload() })
    : api.post('/entityField/create', payload()),
  onSuccess: async () => {
    await client.invalidateQueries({ queryKey: ['entity-fields'] })
    router.replace('/fields')
  },
})
const remove = useMutation({
  mutationFn: () => api.post('/entityField/delete', { id: id.value }),
  onSuccess: () => router.replace('/fields'),
})
const typeOptions = [{ label: '人员', value: 'entity' }, { label: '客户', value: 'customer' }, { label: '虚拟实体', value: 'virtual' }]
const valueOptions = ['string','text','int','decimal','bool','date','datetime','select','multi_select','json'].map(value => ({ label: value, value }))
const inputOptions = ['text','textarea','radio','checkbox','select','date','datetime'].map(value => ({ label: value, value }))
function deleteField() {
  if (confirm('删除字段会同步删除全部对象的对应字段值，确认继续？')) remove.mutate()
}
</script>

<template>
  <NConfigProvider :theme-overrides="lostskyNaiveTheme">
    <div class="field-form-page">
      <AdminPageHeader :title="editing ? '编辑对象字段' : '创建对象字段'" description="字段定义属于团队；值按对象类型与内部 ID 关联，不把数字 ID 暴露到权限 key。" back-to="/fields" back-label="返回对象字段" />
      <form @submit.prevent="save.mutate()">
        <label>对象类型<NSelect v-model:value="form.entity_type" :disabled="editing" :options="typeOptions" /></label>
        <label>字段标识<NInput v-model:value="form.field_key" :disabled="editing" maxlength="64" placeholder="department" /></label>
        <label>字段名称<NInput v-model:value="form.name" maxlength="50" placeholder="部门" /></label>
        <label>值类型<NSelect v-model:value="form.value_type" :options="valueOptions" /></label>
        <label>输入控件<NSelect v-model:value="form.input_type" :options="inputOptions" /></label>
        <label v-if="['select','multi_select'].includes(form.value_type)">选项<NInput v-model:value="form.optionsText" type="textarea" :autosize="{ minRows: 3, maxRows: 8 }" placeholder="每行一个选项" /></label>
        <section class="access-policy" aria-labelledby="field-access-title">
          <div class="section-heading">
            <h2 id="field-access-title">访问与维护规则</h2>
            <p>可见范围不会授予页面访问权；能看见字段值的实体也不会因此自动获得编辑权。</p>
          </div>
          <label>值维护范围<NSelect v-model:value="form.manager_scope" :options="managerScopeOptions" /></label>
          <label>值可见范围<NSelect v-model:value="form.visibility" :options="visibilityOptions" /></label>
          <label v-if="form.visibility === 6">
            指定可见对象
            <NSelect
              v-model:value="form.visibility_target_ids"
              :options="entityOptions"
              :render-label="renderEntityLabel"
              :menu-props="entitySelectMenuProps"
              :loading="entities.isPending.value"
              :disabled="entities.isError.value || !entityOptions.length"
              :virtual-scroll="false"
              multiple
              filterable
              clearable
              placeholder="选择可以查看此字段的对象"
            />
            <small>所选对象可在其原本有权打开的所有对象资料中查看该字段。</small>
          </label>
          <p v-if="form.visibility === 5" class="policy-note">公开字段只有在所属实体有效且已开启公开主页展示时，才会向未登录访客显示。</p>
          <div class="switch-row">
            <div><strong>允许修改字段值</strong><small>关闭后，字段管理员和对象本人都只能查看，不能手动修改。</small></div>
            <NSwitch v-model:value="form.is_editable" aria-label="允许修改字段值" />
          </div>
        </section>
        <div class="switch-row">
          <div><strong>必填</strong><small>在允许编辑该字段的资料保存时校验不能为空。</small></div>
          <NSwitch v-model:value="form.is_required" aria-label="必填" />
        </div>
        <label>排序<NInputNumber v-model:value="form.sort" :precision="0" /></label>
        <p v-if="save.isError.value || remove.isError.value" class="error" role="alert">{{ friendlyError(save.error.value || remove.error.value) }}</p>
        <div class="actions"><LsButton type="submit" :loading="save.isPending.value">保存字段</LsButton><LsButton v-if="editing" type="button" variant="danger" :loading="remove.isPending.value" @click="deleteField">删除字段</LsButton></div>
      </form>
    </div>
  </NConfigProvider>
</template>

<style scoped>
.field-form-page{display:grid;gap:1rem}form{max-width:42rem;display:grid;gap:1rem;padding:1.25rem;background:white;border:1px solid var(--line);border-radius:12px}form>label,.access-policy>label{display:grid;gap:.4rem;font-size:.82rem;font-weight:650}.access-policy{display:grid;gap:1rem;padding:1.25rem 0 0;border-top:1px solid var(--line)}.section-heading h2,.section-heading p{margin:0}.section-heading h2{font-size:1rem}.section-heading p{max-width:65ch;margin-top:.3rem;color:var(--muted-ink);font-size:.8rem;line-height:1.55}.access-policy label small,.switch-row small{color:var(--muted-ink);font-size:.76rem;font-weight:500;line-height:1.5}.policy-note{margin:0;padding:.75rem;color:var(--ink);background:var(--cloud);border-radius:9px;font-size:.8rem;line-height:1.55}.switch-row{min-height:52px;display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.75rem;background:var(--cloud);border-radius:9px}.switch-row>div{display:grid;gap:.2rem}.switch-row strong{font-size:.82rem}.actions{display:flex;gap:.6rem}.error{margin:0;color:var(--danger)}@media(max-width:520px){.actions{display:grid}.actions>*{width:100%}.switch-row{align-items:flex-start}}
</style>
