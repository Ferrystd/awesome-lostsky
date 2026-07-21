<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { NCheckbox, NConfigProvider, NInput, NInputNumber, NSelect } from 'naive-ui'
import { computed, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { lostskyNaiveTheme } from '@lostsky/ui/naive-theme'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import AdminPageHeader from '../components/AdminPageHeader.vue'

type EntityType = 'member' | 'customer' | 'virtual'
interface EntityField {
  id: number
  entity_type: EntityType
  field_key: string
  name: string
  value_type: string
  input_type: string
  options: unknown[] | null
  is_required: number
  is_editable: number
  is_searchable: number
  is_visible: number
  sort: number
}
const route = useRoute()
const router = useRouter()
const client = useQueryClient()
const id = computed(() => Number(route.query.id ?? 0))
const editing = computed(() => id.value > 0)
const form = reactive({
  entity_type: String(route.query.type ?? 'member') as EntityType,
  field_key: '',
  name: '',
  value_type: 'string',
  input_type: 'text',
  optionsText: '',
  is_required: false,
  is_editable: true,
  is_searchable: false,
  is_visible: false,
  sort: 0,
})
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
  form.is_required = Boolean(value.is_required)
  form.is_editable = Boolean(value.is_editable)
  form.is_searchable = Boolean(value.is_searchable)
  form.is_visible = Boolean(value.is_visible)
  form.sort = value.sort
}, { immediate: true })
const payload = () => ({
  entity_type: form.entity_type,
  field_key: form.field_key,
  name: form.name,
  value_type: form.value_type,
  input_type: form.input_type,
  options: form.optionsText.trim() ? form.optionsText.split('\n').map(item => item.trim()).filter(Boolean) : null,
  is_required: form.is_required ? 1 : 0,
  is_editable: form.is_editable ? 1 : 0,
  is_searchable: form.is_searchable ? 1 : 0,
  is_visible: form.entity_type === 'member' && form.is_visible ? 1 : 0,
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
const typeOptions = [{ label: '成员', value: 'member' }, { label: '客户', value: 'customer' }, { label: '虚拟实体', value: 'virtual' }]
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
        <div class="checks">
          <NCheckbox v-model:checked="form.is_required">必填</NCheckbox>
          <NCheckbox v-model:checked="form.is_editable">允许编辑</NCheckbox>
          <NCheckbox v-model:checked="form.is_searchable">允许搜索</NCheckbox>
          <NCheckbox v-if="form.entity_type === 'member'" v-model:checked="form.is_visible">成员可见</NCheckbox>
        </div>
        <label>排序<NInputNumber v-model:value="form.sort" :precision="0" /></label>
        <p v-if="save.isError.value || remove.isError.value" class="error" role="alert">{{ friendlyError(save.error.value || remove.error.value) }}</p>
        <div class="actions"><LsButton type="submit" :loading="save.isPending.value">保存字段</LsButton><LsButton v-if="editing" type="button" variant="danger" :loading="remove.isPending.value" @click="deleteField">删除字段</LsButton></div>
      </form>
    </div>
  </NConfigProvider>
</template>

<style scoped>
.field-form-page{display:grid;gap:1rem}form{max-width:42rem;display:grid;gap:1rem;padding:1.25rem;background:white;border:1px solid var(--line);border-radius:12px}form>label{display:grid;gap:.4rem;font-size:.82rem;font-weight:650}.checks{display:flex;flex-wrap:wrap;gap:.9rem;padding:.8rem;background:var(--cloud);border-radius:9px}.actions{display:flex;gap:.6rem}.error{margin:0;color:var(--danger)}@media(max-width:520px){.actions{display:grid}.actions>*{width:100%}}
</style>
