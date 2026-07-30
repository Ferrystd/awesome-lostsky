<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import { enumOptionValue } from '@lostsky/ui/lib/enum'
import { Eye, Pencil, Plus, RefreshCw, Trash2 } from '@lucide/vue'
import { computed, nextTick, ref } from 'vue'
import type { ResourceMeta } from '../router'

const props = defineProps<{ resource: ResourceMeta }>()
const client = useQueryClient()
const search = ref('')
const selected = ref<Record<string, unknown> | null>(null)
const mode = ref<'detail' | 'create' | 'edit'>('detail')
const dialog = ref<HTMLDialogElement | null>(null)
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
  onSuccess: async () => { await client.invalidateQueries({ queryKey: ['resource', props.resource.endpoint] }); dialog.value?.close() },
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
async function openDialog(nextMode: typeof mode.value, row?: Record<string, unknown>) { mode.value = nextMode; selected.value = row ?? null; form.value = initialForm(row); save.reset(); await nextTick(); dialog.value?.showModal() }
async function confirmRemove(row: Record<string, unknown>) { if (!props.resource.deleteEndpoint || !confirm(`确认删除“${display(row.name ?? row.title ?? row.id)}”？`)) return; await remove.mutateAsync(row) }
</script>

<template>
  <div class="resource">
    <header class="page-head"><p>{{ resource.description }}</p><div><LsButton variant="secondary" size="sm" :loading="query.isFetching.value" @click="query.refetch()"><RefreshCw :size="16" />刷新</LsButton><LsButton v-if="resource.createEndpoint" size="sm" @click="openDialog('create')"><Plus :size="16" />新建</LsButton></div></header>
    <LsListToolbar v-model="search" :placeholder="`搜索${resource.title}`" :aria-label="`搜索${resource.title}`" :count-label="`${filtered.length} 项`" />
    <p v-if="query.isError.value" class="state error" role="alert">{{ friendlyError(query.error.value) }}</p>
    <div v-else-if="query.isPending.value" class="loading" aria-label="正在加载"><span v-for="i in 5" :key="i" /></div>
    <div v-else-if="!filtered.length" class="state"><h2>{{ resource.empty }}</h2><p>可以调整搜索条件，或创建第一条记录。</p></div>
    <div v-else class="records">
      <article v-for="row in filtered" :key="String(row.id ?? JSON.stringify(row))"><div v-for="field in resource.fields.slice(0, 3)" :key="field"><span>{{ label(field) }}</span><strong>{{ display(row[field]) }}</strong></div><footer><button type="button" @click="openDialog('detail', row)"><Eye :size="17" />详情</button><button v-if="resource.editEndpoint" type="button" @click="openDialog('edit', row)"><Pencil :size="17" />编辑</button><button v-if="resource.deleteEndpoint" type="button" class="danger" @click="confirmRemove(row)"><Trash2 :size="17" />删除</button></footer></article>
    </div>
    <div v-if="filtered.length" class="table-wrap"><table><thead><tr><th v-for="field in resource.fields" :key="field">{{ label(field) }}</th><th>操作</th></tr></thead><tbody><tr v-for="row in filtered" :key="String(row.id ?? JSON.stringify(row))"><td v-for="field in resource.fields" :key="field">{{ display(row[field]) }}</td><td><div class="actions"><button type="button" aria-label="查看详情" @click="openDialog('detail', row)"><Eye :size="17" /></button><button v-if="resource.editEndpoint" type="button" aria-label="编辑" @click="openDialog('edit', row)"><Pencil :size="17" /></button><button v-if="resource.deleteEndpoint" type="button" class="danger" aria-label="删除" @click="confirmRemove(row)"><Trash2 :size="17" /></button></div></td></tr></tbody></table></div>
    <p v-if="remove.isError.value" class="state error" role="alert">{{ friendlyError(remove.error.value) }}</p>
    <dialog ref="dialog" @click.self="dialog?.close()"><form @submit.prevent="save.mutate()"><header><h2>{{ mode === 'create' ? `新建${resource.title}` : mode === 'edit' ? `编辑${resource.title}` : `${resource.title}详情` }}</h2><button type="button" aria-label="关闭" @click="dialog?.close()">×</button></header><dl v-if="mode === 'detail' && selected"><template v-for="(value, key) in selected" :key="key"><dt>{{ label(String(key)) }}</dt><dd>{{ display(value) }}</dd></template></dl><div v-else class="form-fields"><label v-for="field in resource.formFields" :key="field.key"><span>{{ field.label }} <b v-if="field.required">*</b></span><textarea v-if="field.type === 'textarea'" v-model="form[field.key] as string" rows="4" :required="field.required" /><select v-else-if="field.type === 'select'" v-model="form[field.key] as string" :required="field.required"><option value="">请选择</option><option v-for="option in field.options" :key="String(option.value)" :value="option.value">{{ option.label }}</option></select><input v-else-if="field.type === 'checkbox'" v-model="form[field.key]" type="checkbox" true-value="1" false-value="0"><input v-else v-model="form[field.key] as string" :type="field.type === 'number' ? 'number' : 'text'" :required="field.required" :disabled="mode === 'edit' && field.createOnly"></label><p v-if="save.isError.value" class="error" role="alert">{{ friendlyError(save.error.value) }}</p><div class="dialog-actions"><LsButton type="button" variant="secondary" @click="dialog?.close()">取消</LsButton><LsButton type="submit" :loading="save.isPending.value">保存</LsButton></div></div></form></dialog>
  </div>
</template>

<style scoped>
.resource{display:grid;gap:1rem}.page-head{display:flex;align-items:center;justify-content:space-between;gap:1rem}.page-head p{margin:0;color:var(--muted-ink);font-size:.9rem}.page-head>div{display:flex;gap:.5rem}.records{display:grid;gap:.75rem}.records article{padding:1rem;background:white;border:1px solid var(--line);border-radius:10px}.records article>div{display:grid;grid-template-columns:5rem 1fr;gap:.75rem;padding:.35rem 0}.records span{color:var(--muted-ink);font-size:.78rem}.records strong{min-width:0;font-size:.88rem;overflow-wrap:anywhere}.records footer{display:flex;justify-content:flex-end;gap:.25rem;margin-top:.75rem;padding-top:.75rem;border-top:1px solid var(--line)}.records button,.actions button{min-width:44px;min-height:40px;display:inline-flex;align-items:center;justify-content:center;gap:.3rem;color:var(--muted-ink);background:transparent;border:0;border-radius:7px}.records button:hover,.actions button:hover{background:var(--cloud)}button.danger{color:var(--danger)}.table-wrap{display:none;overflow:auto;background:white;border:1px solid var(--line);border-radius:10px}table{width:100%;border-collapse:collapse;font-size:.86rem}th,td{padding:.75rem 1rem;text-align:left;border-bottom:1px solid var(--line);white-space:nowrap}th{color:var(--muted-ink);background:var(--cloud);font-size:.75rem}.actions{display:flex}.state{padding:3.5rem 1rem;text-align:center;background:white;border:1px solid var(--line);border-radius:10px}.state.error{padding:1rem;color:var(--danger);text-align:left}.loading{display:grid;gap:.7rem}.loading span{height:100px;background:var(--line);border-radius:10px;opacity:.6}dialog{width:min(92vw,40rem);max-height:84dvh;padding:0;border:0;border-radius:12px;box-shadow:0 8px 24px oklch(.1 0 0/.24)}dialog::backdrop{background:oklch(.06 0 0/.62)}dialog header{position:sticky;top:0;display:flex;align-items:center;justify-content:space-between;padding:1rem;background:white;border-bottom:1px solid var(--line);z-index:1}dialog h2{margin:0;font-size:1.05rem}dialog header button{width:44px;height:44px;background:transparent;border:0;font-size:1.5rem}dl{display:grid;grid-template-columns:minmax(5rem,.5fr) 1.5fr;margin:0;padding:1rem}dt,dd{margin:0;padding:.65rem 0;border-bottom:1px solid var(--line);overflow-wrap:anywhere}dt{color:var(--muted-ink);font-size:.8rem}dd{font-size:.88rem}.form-fields{display:grid;gap:1rem;padding:1rem}.form-fields>label{display:grid;gap:.4rem;font-size:.85rem;font-weight:650}.form-fields b{color:var(--danger)}.form-fields input:not([type='checkbox']),.form-fields textarea,.form-fields select{width:100%;min-height:44px;padding:.65rem .75rem;border:1px solid var(--line);border-radius:8px}.form-fields input[type='checkbox']{width:22px;height:22px}.dialog-actions{display:flex;justify-content:flex-end;gap:.5rem}@media(min-width:760px){.records{display:none}.table-wrap{display:block}}
</style>
