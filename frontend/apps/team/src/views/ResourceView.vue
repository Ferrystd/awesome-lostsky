<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import { enumOptionValue } from '@lostsky/ui/lib/enum'
import { Eye, Pencil, Plus, Trash2 } from '@lucide/vue'
import { NButton, NCheckbox, NInput, NInputNumber, NModal, NSelect } from 'naive-ui'
import { computed, ref } from 'vue'
import type { ResourceMeta } from '../router'

const props = defineProps<{ resource: ResourceMeta }>()
const client = useQueryClient()
const search = ref('')
const selected = ref<Record<string, unknown> | null>(null)
const mode = ref<'detail' | 'create' | 'edit'>('detail')
const dialogOpen = ref(false)
const form = ref<Record<string, string | number | boolean>>({})
const query = useQuery({ queryKey: computed(() => ['resource', props.resource.endpoint]), queryFn: () => api.get<unknown>(props.resource.endpoint) })
const rows = computed<Record<string, unknown>[]>(() => {
  const data = query.data.value
  if (Array.isArray(data)) return data as Record<string, unknown>[]
  if (data && typeof data === 'object') {
    const object = data as Record<string, unknown>; const list = object.list ?? object.data ?? object.items
    if (Array.isArray(list)) return list as Record<string, unknown>[]
  }
  return []
})
const filtered = computed(() => { const term = search.value.trim().toLowerCase(); return term ? rows.value.filter((row) => JSON.stringify(row).toLowerCase().includes(term)) : rows.value })
const save = useMutation({
  mutationFn: async () => {
    const endpoint = mode.value === 'create' ? props.resource.createEndpoint : props.resource.editEndpoint
    if (!endpoint) return
    const payload: Record<string, unknown> = { ...form.value }
    if (mode.value === 'edit' && selected.value) payload[props.resource.idKey ?? 'id'] = selected.value.id
    await api.post(endpoint, payload)
  },
  onSuccess: async () => { await client.invalidateQueries({ queryKey: ['resource', props.resource.endpoint] }); dialogOpen.value = false },
})
const remove = useMutation({ mutationFn: (row: Record<string, unknown>) => api.post(props.resource.deleteEndpoint!, { [props.resource.deleteKey ?? 'id']: row.id }), onSuccess: () => client.invalidateQueries({ queryKey: ['resource', props.resource.endpoint] }) })

function display(value: unknown) { if (value == null || value === '') return '—'; if (typeof value === 'object') return Array.isArray(value) ? value.map((item) => typeof item === 'object' ? (item as Record<string, unknown>).name ?? (item as Record<string, unknown>).title ?? '项目' : item).join('、') : JSON.stringify(value); return String(value) }
function label(key: string) { return ({ name: '名称', nickname: '昵称', phone: '手机', status: '状态', created_at: '创建时间', create_time: '创建时间', updated_at: '更新时间', update_time: '更新时间', description: '说明', member_count: '成员数', title: '标题', content: '内容', ext: '格式', size: '大小', type: '类型', value_type: '值类型', input_type: '输入类型', source: '来源', required: '必填', is_required: '必填', sort: '顺序', summary: '摘要', visibility: '可见范围', field_key: '字段标识', role_key: '角色标识' } as Record<string, string>)[key] ?? key }
function initialForm(row?: Record<string, unknown>) {
  const next: Record<string, string | number | boolean> = {}
  props.resource.formFields?.forEach((field) => {
    const value = row?.[field.key] ?? field.defaultValue ?? (field.type === 'checkbox' ? false : '')
    if (field.type === 'checkbox') {
      next[field.key] = value === true || Number(value) === 1
    } else if (field.type === 'select' && field.options?.length) {
      const fallback = typeof field.defaultValue === 'string' || typeof field.defaultValue === 'number'
        ? field.defaultValue
        : field.options[0].value
      next[field.key] = enumOptionValue(value, field.options, fallback)
    } else {
      next[field.key] = typeof value === 'number' ? value : String(value ?? '')
    }
  })
  return next
}
function openDialog(nextMode: typeof mode.value, row?: Record<string, unknown>) { mode.value = nextMode; selected.value = row ?? null; form.value = initialForm(row); save.reset(); dialogOpen.value = true }
async function confirmRemove(row: Record<string, unknown>) { if (!props.resource.deleteEndpoint || !confirm(`确认删除“${display(row.name ?? row.title ?? row.id)}”？`)) return; await remove.mutateAsync(row) }
</script>

<template>
  <div class="resource">
    <p class="resource-description">{{ resource.description }}</p>
    <LsListToolbar v-model="search" :placeholder="`搜索${resource.title}`" :aria-label="`搜索${resource.title}`" :count-label="`${filtered.length} 项`"><template v-if="resource.createEndpoint" #actions><LsButton size="sm" @click="openDialog('create')"><Plus :size="16" />新建</LsButton></template></LsListToolbar>
    <p v-if="query.isError.value" class="state error" role="alert">{{ friendlyError(query.error.value) }}</p>
    <div v-else-if="query.isPending.value" class="loading" aria-label="正在加载"><span v-for="i in 5" :key="i" /></div>
    <LsEmptyState v-else-if="!filtered.length" :title="resource.empty" description="可以调整搜索条件，或创建第一条记录。" />
    <div v-else class="records">
      <article v-for="row in filtered" :key="String(row.id ?? JSON.stringify(row))"><div v-for="field in resource.fields.slice(0, 3)" :key="field"><span>{{ label(field) }}</span><strong>{{ display(row[field]) }}</strong></div><footer><NButton secondary @click="openDialog('detail', row)"><template #icon><Eye :size="17" /></template>详情</NButton><NButton v-if="resource.editEndpoint" secondary @click="openDialog('edit', row)"><template #icon><Pencil :size="17" /></template>编辑</NButton><NButton v-if="resource.deleteEndpoint" secondary type="error" @click="confirmRemove(row)"><template #icon><Trash2 :size="17" /></template>删除</NButton></footer></article>
    </div>
    <div v-if="filtered.length" class="table-wrap"><table><thead><tr><th v-for="field in resource.fields" :key="field">{{ label(field) }}</th><th>操作</th></tr></thead><tbody><tr v-for="row in filtered" :key="String(row.id ?? JSON.stringify(row))"><td v-for="field in resource.fields" :key="field">{{ display(row[field]) }}</td><td><div class="actions"><NButton quaternary circle aria-label="查看详情" @click="openDialog('detail', row)"><template #icon><Eye :size="17" /></template></NButton><NButton v-if="resource.editEndpoint" quaternary circle aria-label="编辑" @click="openDialog('edit', row)"><template #icon><Pencil :size="17" /></template></NButton><NButton v-if="resource.deleteEndpoint" quaternary circle type="error" aria-label="删除" @click="confirmRemove(row)"><template #icon><Trash2 :size="17" /></template></NButton></div></td></tr></tbody></table></div>
    <p v-if="remove.isError.value" class="state error" role="alert">{{ friendlyError(remove.error.value) }}</p>
    <NModal v-model:show="dialogOpen" preset="card" class="resource-dialog" :title="mode === 'create' ? `新建${resource.title}` : mode === 'edit' ? `编辑${resource.title}` : `${resource.title}详情`"><form @submit.prevent="save.mutate()"><dl v-if="mode === 'detail' && selected"><template v-for="(value, key) in selected" :key="key"><dt>{{ label(String(key)) }}</dt><dd>{{ display(value) }}</dd></template></dl><div v-else class="form-fields"><label v-for="field in resource.formFields" :key="field.key"><span>{{ field.label }} <b v-if="field.required">*</b></span><NInput v-if="field.type === 'textarea'" :value="String(form[field.key] ?? '')" type="textarea" :autosize="{ minRows: 4, maxRows: 8 }" @update:value="value => form[field.key] = value" /><NSelect v-else-if="field.type === 'select'" :value="form[field.key] as string | number" :options="field.options ?? []" placeholder="请选择" @update:value="value => form[field.key] = value" /><NCheckbox v-else-if="field.type === 'checkbox'" :checked="Boolean(form[field.key])" @update:checked="value => form[field.key] = value">启用</NCheckbox><NInputNumber v-else-if="field.type === 'number'" :value="Number(form[field.key]) || null" @update:value="value => form[field.key] = value ?? 0" /><NInput v-else :value="String(form[field.key] ?? '')" :disabled="mode === 'edit' && field.createOnly" @update:value="value => form[field.key] = value" /></label><p v-if="save.isError.value" class="error" role="alert">{{ friendlyError(save.error.value) }}</p><div class="dialog-actions"><LsButton type="button" variant="secondary" @click="dialogOpen = false">取消</LsButton><LsButton type="submit" :loading="save.isPending.value">保存</LsButton></div></div></form></NModal>
  </div>
</template>

<style scoped>
.resource{display:grid;gap:1rem}.page-head{display:flex;align-items:center;justify-content:space-between;gap:1rem}.page-head p{margin:0;color:var(--muted-ink);font-size:.9rem}.page-head>div{display:flex;gap:.5rem}.records{display:grid;gap:.75rem}.records article{padding:1rem;background:white;border:1px solid var(--line);border-radius:10px}.records article>div{display:grid;grid-template-columns:5rem 1fr;gap:.75rem;padding:.35rem 0}.records span{color:var(--muted-ink);font-size:.78rem}.records strong{min-width:0;font-size:.88rem;overflow-wrap:anywhere}.records footer{display:flex;justify-content:flex-end;gap:.5rem;margin-top:.75rem;padding-top:.75rem;border-top:1px solid var(--line)}.table-wrap{display:none;overflow:auto;background:white;border:1px solid var(--line);border-radius:10px}table{width:100%;border-collapse:collapse;font-size:.86rem}th,td{padding:.75rem 1rem;text-align:left;border-bottom:1px solid var(--line);white-space:nowrap}th{color:var(--muted-ink);background:var(--cloud);font-size:.75rem}.actions{display:flex;gap:.25rem}.state{padding:3.5rem 1rem;text-align:center;background:white;border:1px solid var(--line);border-radius:10px}.state.error{padding:1rem;color:var(--danger);text-align:left}.loading{display:grid;gap:.7rem}.loading span{height:100px;background:var(--line);border-radius:10px;opacity:.6}.resource-dialog{width:min(92vw,40rem)}dl{display:grid;grid-template-columns:minmax(5rem,.5fr) 1.5fr;margin:0}dt,dd{margin:0;padding:.65rem 0;border-bottom:1px solid var(--line);overflow-wrap:anywhere}dt{color:var(--muted-ink);font-size:.8rem}dd{font-size:.88rem}.form-fields{display:grid;gap:1rem}.form-fields>label{display:grid;gap:.4rem;font-size:.85rem;font-weight:650}.form-fields b{color:var(--danger)}.dialog-actions{display:flex;justify-content:flex-end;gap:.5rem}@media(min-width:760px){.records{display:none}.table-wrap{display:block}}
</style>
