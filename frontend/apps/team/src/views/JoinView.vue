<script setup lang="ts">
import { api, auth, friendlyError } from '@lostsky/api/client'
import { useMutation, useQuery } from '@tanstack/vue-query'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import { ArrowLeft } from '@lucide/vue'
import { computed, reactive, ref } from 'vue'

interface JoinField {
  id?: number
  field_key?: string
  name?: string
  input_type?: 'text' | 'textarea' | 'radio' | 'checkbox' | 'select' | 'date' | 'datetime' | 'upload'
  options?: unknown
  default_value?: string | null
  is_apply_required?: 0 | 1
}
type FieldValue = string | number | boolean | string[]

const form = useQuery({ queryKey: ['join-form'], queryFn: () => api.get<JoinField[]>('/join/form') })
const mine = useQuery({ queryKey: ['join-mine'], queryFn: () => api.get<Record<string, unknown>[]>('/join/mine'), enabled: Boolean(auth.token()) })
const values = reactive<Record<string, FieldValue>>({})
const memo = ref('')
const uploading = ref<string | null>(null)
const fields = computed(() => Array.isArray(form.data.value) ? form.data.value : [])
const mutation = useMutation({ mutationFn: () => api.post('/join/apply', { values: { ...values }, memo: memo.value.trim() || null }) })
const cancel = useMutation({ mutationFn: (id: number) => api.post('/join/cancel', { id }), onSuccess: () => mine.refetch() })

function keyOf(field: JoinField) { return field.field_key || String(field.id ?? '') }
function choices(field: JoinField): Array<{ label: string; value: string }> {
  let source = field.options
  if (typeof source === 'string') { try { source = JSON.parse(source) } catch { source = (source as string).split(',') } }
  if (Array.isArray(source)) return source.map((item) => typeof item === 'object' && item !== null ? { label: String((item as Record<string, unknown>).label ?? (item as Record<string, unknown>).name ?? (item as Record<string, unknown>).value ?? ''), value: String((item as Record<string, unknown>).value ?? (item as Record<string, unknown>).id ?? (item as Record<string, unknown>).label ?? '') } : { label: String(item), value: String(item) })
  return []
}
function toggle(field: JoinField, value: string, checked: boolean) {
  const key = keyOf(field); const current = Array.isArray(values[key]) ? values[key] as string[] : []
  values[key] = checked ? [...new Set([...current, value])] : current.filter((item) => item !== value)
}
async function upload(field: JoinField, event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]; if (!file) return
  const key = keyOf(field); const body = new FormData(); body.append('file', file); body.append('field_id', String(field.id ?? ''))
  uploading.value = key
  try { const result = await api.post<Record<string, unknown>>('/join/upload', body); values[key] = String(result.id ?? result.file_id ?? result.url ?? '') } finally { uploading.value = null }
}
</script>

<template>
  <main class="join">
    <a href="//www.lostsky.work"><ArrowLeft :size="18" />LostSky</a>
    <section><p>JOIN THE TEAM</p><h1 class="ls-display">申请进入<br>这片青空。</h1><span>填写团队设置的申请资料，提交后由管理员审核。</span></section>
    <form @submit.prevent="mutation.mutate()">
      <h2>加入申请</h2>
      <p v-if="form.isPending.value" class="form-state">正在读取申请表…</p>
      <p v-else-if="form.isError.value" class="error" role="alert">{{ friendlyError(form.error.value) }}</p>
      <label v-for="field in fields" :key="keyOf(field)" class="field">
        <span>{{ field.name || field.field_key }} <b v-if="field.is_apply_required" aria-hidden="true">*</b></span>
        <textarea v-if="field.input_type === 'textarea'" v-model="values[keyOf(field)] as string" rows="4" :required="Boolean(field.is_apply_required)" />
        <select v-else-if="field.input_type === 'select'" v-model="values[keyOf(field)] as string" :required="Boolean(field.is_apply_required)"><option value="">请选择</option><option v-for="option in choices(field)" :key="option.value" :value="option.value">{{ option.label }}</option></select>
        <div v-else-if="field.input_type === 'radio'" class="choices"><label v-for="option in choices(field)" :key="option.value"><input v-model="values[keyOf(field)]" type="radio" :name="keyOf(field)" :value="option.value" :required="Boolean(field.is_apply_required)">{{ option.label }}</label></div>
        <div v-else-if="field.input_type === 'checkbox'" class="choices"><label v-for="option in choices(field)" :key="option.value"><input type="checkbox" :value="option.value" @change="toggle(field, option.value, ($event.target as HTMLInputElement).checked)">{{ option.label }}</label></div>
        <div v-else-if="field.input_type === 'upload'" class="upload"><input type="file" :required="Boolean(field.is_apply_required)" @change="upload(field, $event)"><small>{{ uploading === keyOf(field) ? '正在上传…' : values[keyOf(field)] ? '已上传' : '选择文件' }}</small></div>
        <input v-else v-model="values[keyOf(field)] as string" :type="field.input_type === 'datetime' ? 'datetime-local' : field.input_type === 'date' ? 'date' : 'text'" :required="Boolean(field.is_apply_required)" :placeholder="field.default_value || ''">
      </label>
      <label class="field"><span>补充说明</span><textarea v-model="memo" rows="4" placeholder="还有什么希望团队了解的？" /></label>
      <p v-if="mutation.isError.value" class="error" role="alert">{{ friendlyError(mutation.error.value) }}</p>
      <p v-if="mutation.isSuccess.value" class="success" role="status">申请已提交，请等待审核。</p>
      <LsButton type="submit" size="lg" :loading="mutation.isPending.value" :disabled="form.isPending.value || Boolean(uploading)">提交申请</LsButton>
      <section v-if="mine.data.value?.length" class="mine"><h2>我的申请</h2><article v-for="item in mine.data.value" :key="String(item.id)"><div><strong>申请 #{{item.id}}</strong><small>{{item.status}}</small></div><p>{{item.memo||'没有补充说明'}}</p><LsButton v-if="['已申请','审核中',1,2].includes(item.status as string|number)" type="button" variant="danger" size="sm" :loading="cancel.isPending.value" @click="cancel.mutate(Number(item.id))">取消申请</LsButton></article></section>
    </form>
  </main>
</template>

<style scoped>
.join{min-height:100dvh;padding:1rem;color:white;background:var(--sky-void)}.join>a{min-height:44px;display:inline-flex;align-items:center;gap:.5rem;color:oklch(.72 .014 210)}.join>section{padding:3.5rem 0 2.5rem}.join>section p{color:var(--sky-lost);font-size:.75rem;font-weight:750;letter-spacing:.08em}.join h1{margin:.75rem 0;font-size:clamp(3.2rem,15vw,5.5rem)}.join>section span{color:oklch(.72 .014 210)}form{display:grid;gap:1.15rem;padding:1.25rem;color:var(--ink);background:white;border-radius:12px}form h2{margin:0}.field{display:grid;gap:.45rem;color:var(--ink);font-size:.875rem;font-weight:650}.field b{color:var(--danger)}input:not([type='radio']):not([type='checkbox']):not([type='file']),textarea,select{width:100%;min-height:46px;padding:.7rem .8rem;color:var(--ink);background:white;border:1px solid var(--line);border-radius:8px}textarea{resize:vertical}.choices{display:grid;gap:.35rem}.choices label{min-height:42px;display:flex;align-items:center;gap:.55rem;padding:.4rem .65rem;background:var(--cloud);border-radius:7px}.choices input{width:18px;height:18px}.upload{display:grid;gap:.35rem;padding:.75rem;background:var(--cloud);border:1px dashed var(--line);border-radius:8px}.upload small,.form-state{color:var(--muted-ink)}.error,.success,.form-state{padding:.75rem;margin:0;border-radius:8px;font-size:.86rem}.error{color:var(--danger);background:color-mix(in oklch,var(--danger),white 93%)}.success{color:var(--success);background:color-mix(in oklch,var(--success),white 92%)}.mine{display:grid;gap:.65rem;margin-top:1rem;padding-top:1rem;border-top:1px solid var(--line)}.mine article{display:grid;gap:.5rem;padding:.75rem;background:var(--cloud);border-radius:8px}.mine article>div{display:flex;justify-content:space-between;gap:1rem}.mine small{color:var(--sky-lost-strong)}.mine p{margin:0;color:var(--muted-ink);font-size:.84rem}@media(min-width:800px){.join{display:grid;grid-template-columns:1fr minmax(420px,.75fr);grid-template-rows:auto 1fr;gap:4rem;padding:2.5rem clamp(2rem,7vw,7rem)}.join>a{grid-column:1/3}.join>section{align-self:center}.join form{align-self:center;padding:2rem}}
</style>
