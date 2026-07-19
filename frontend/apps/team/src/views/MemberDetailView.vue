<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsMarkdownRenderer from '@lostsky/ui/components/LsMarkdownRenderer.vue'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { BookOpen, Upload } from '@lucide/vue'
import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AdminPageHeader from '../components/AdminPageHeader.vue'
import { resolveEntities } from '../lib/markdown'

interface Field {
  id: number
  name: string
  field_key?: string
  value_type?: string
  input_type?: string
  options?: unknown
  is_required?: 0 | 1
  is_editable?: 0 | 1
}
type Value = string | number | boolean | string[] | null

const route = useRoute()
const memberId = computed(() => Number(route.query.id))
const values = reactive<Record<number, Value>>({})
const uploading = ref<number | null>(null)
const member = useQuery({ queryKey: computed(() => ['member', memberId.value]), queryFn: () => api.get<Record<string, unknown>>('/member/get', { member_id: memberId.value }), enabled: computed(() => memberId.value > 0) })
const fields = useQuery({ queryKey: ['member-fields'], queryFn: () => api.get<Field[]>('/memberField/index') })
const stored = useQuery({ queryKey: computed(() => ['member-field-values', memberId.value]), queryFn: () => api.get<Record<string, unknown>[]>('/memberField/values', { member_id: memberId.value }), enabled: computed(() => memberId.value > 0) })
const profile = computed(() => member.data.value?.profile as Record<string, unknown> | undefined)
const introduction = computed(() => String(profile.value?.introduction_markdown ?? member.data.value?.introduction_markdown ?? ''))

watch(() => stored.data.value, (list) => {
  for (const item of list ?? []) {
    const id = Number(item.field_id)
    values[id] = (item.value_string ?? item.value_text ?? item.value_int ?? item.value_decimal ?? item.value_datetime ?? item.value_json ?? '') as Value
  }
}, { immediate: true })

const save = useMutation({ mutationFn: () => api.post('/memberField/saveValues', { member_id: memberId.value, values: { ...values } }) })

function options(field: Field) {
  let source = field.options
  if (typeof source === 'string') {
    const text = source
    try { source = JSON.parse(text) } catch { source = text.split(',') }
  }
  return Array.isArray(source) ? source.map(item => typeof item === 'object' && item
    ? { label: String((item as Record<string, unknown>).label ?? (item as Record<string, unknown>).name ?? (item as Record<string, unknown>).value), value: String((item as Record<string, unknown>).value ?? (item as Record<string, unknown>).label ?? (item as Record<string, unknown>).name) }
    : { label: String(item), value: String(item) }) : []
}
function toggle(field: Field, value: string, on: boolean) {
  const current = Array.isArray(values[field.id]) ? values[field.id] as string[] : []
  values[field.id] = on ? [...new Set([...current, value])] : current.filter(item => item !== value)
}
async function upload(field: Field, event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploading.value = field.id
  try {
    const result = await api.upload<Record<string, unknown>>(file)
    values[field.id] = String(result.url ?? result.path ?? result.id ?? '')
  } finally {
    uploading.value = null
  }
}
</script>

<template>
  <div class="member-detail">
    <AdminPageHeader title="成员详情" :description="memberId ? `成员 #${memberId} 的公开介绍和团队自定义资料。` : '缺少成员编号'" back-to="/members" back-label="返回成员列表">
      <template #actions><RouterLink class="document-link" :to="`/docs?target_type=teamMember&target_id=${memberId}`"><BookOpen :size="18" />成员文档</RouterLink></template>
    </AdminPageHeader>
    <p v-if="member.isError.value" class="feedback error" role="alert">{{ friendlyError(member.error.value) }}</p>
    <section v-else-if="member.data.value" class="identity">
      <div class="avatar"><img v-if="profile?.avatar || member.data.value.avatar" :src="String(profile?.avatar || member.data.value.avatar)" alt="成员头像"><span v-else>{{ String(profile?.nickname || member.data.value.nickname || '成').slice(0, 1) }}</span></div>
      <div><small>USER #{{ member.data.value.user_id }}</small><h2>{{ profile?.nickname || member.data.value.nickname || `成员 #${memberId}` }}</h2><p>{{ profile?.description || member.data.value.description || '暂无成员简介' }}</p></div>
      <strong>{{ Number(member.data.value.is_blocked) ? '已封禁' : '正常' }}</strong>
    </section>

    <section v-if="introduction" class="introduction" aria-labelledby="member-introduction-title">
      <h2 id="member-introduction-title">详细介绍</h2>
      <LsMarkdownRenderer :content="introduction" :resolve-entities="resolveEntities" />
    </section>

    <form class="fields" @submit.prevent="save.mutate()">
      <div class="section-title"><div><h2>自定义资料</h2><p>团队定义的业务字段会显示在这里。</p></div><LsButton type="submit" :loading="save.isPending.value">保存资料</LsButton></div>
      <p v-if="fields.isPending.value">正在读取字段…</p>
      <div v-else-if="!fields.data.value?.length" class="empty">团队尚未配置成员字段。</div>
      <div v-else class="field-grid">
        <label v-for="field in fields.data.value" :key="field.id">
          <span>{{ field.name }} <b v-if="field.is_required">*</b><small>{{ field.field_key }}</small></span>
          <textarea v-if="field.input_type === 'textarea'" v-model="values[field.id] as string" rows="4" :disabled="field.is_editable === 0" />
          <select v-else-if="field.input_type === 'select'" v-model="values[field.id] as string" :disabled="field.is_editable === 0"><option value="">请选择</option><option v-for="item in options(field)" :key="item.value" :value="item.value">{{ item.label }}</option></select>
          <div v-else-if="field.input_type === 'radio'" class="choices"><label v-for="item in options(field)" :key="item.value"><input v-model="values[field.id]" type="radio" :name="`field-${field.id}`" :value="item.value" :disabled="field.is_editable === 0">{{ item.label }}</label></div>
          <div v-else-if="field.input_type === 'checkbox' && field.value_type !== 'bool'" class="choices"><label v-for="item in options(field)" :key="item.value"><input type="checkbox" :checked="Array.isArray(values[field.id]) && (values[field.id] as string[]).includes(item.value)" :disabled="field.is_editable === 0" @change="toggle(field, item.value, ($event.target as HTMLInputElement).checked)">{{ item.label }}</label></div>
          <label v-else-if="field.value_type === 'bool'" class="bool"><input v-model="values[field.id]" type="checkbox" :disabled="field.is_editable === 0">是</label>
          <div v-else-if="field.input_type === 'upload'" class="upload"><input v-model="values[field.id] as string" :disabled="field.is_editable === 0"><label><Upload :size="16" />{{ uploading === field.id ? '上传中' : '上传' }}<input type="file" :disabled="field.is_editable === 0" @change="upload(field, $event)"></label></div>
          <input v-else v-model="values[field.id] as string" :type="field.input_type === 'date' ? 'date' : field.input_type === 'datetime' ? 'datetime-local' : ['int', 'decimal'].includes(field.value_type ?? '') ? 'number' : 'text'" :disabled="field.is_editable === 0">
        </label>
      </div>
      <p v-if="save.isError.value" class="feedback error" role="alert">{{ friendlyError(save.error.value) }}</p>
      <p v-if="save.isSuccess.value" class="feedback success" role="status">成员资料已保存。</p>
    </form>
  </div>
</template>

<style scoped>
.member-detail { display: grid; gap: 20px; }
.document-link { min-height: 40px; display: inline-flex; align-items: center; gap: 7px; padding: 0 14px; border: 1px solid var(--line); border-radius: var(--radius-md); color: var(--sky-lost-strong); text-decoration: none; }
.identity { display: grid; grid-template-columns: 64px minmax(0, 1fr) auto; align-items: center; gap: 16px; padding: 20px; color: white; background: var(--sky-night); border-radius: var(--radius-lg); }
.avatar { width: 64px; height: 64px; display: grid; place-items: center; overflow: hidden; border-radius: var(--radius-md); background: var(--sky-lost-strong); font-size: 1.4rem; font-weight: 700; }
.avatar img { width: 100%; height: 100%; object-fit: cover; }
.identity small { color: var(--sky-lost); }
.identity h2, .identity p { margin: 0; }
.identity p { margin-top: 5px; color: oklch(.74 .012 210); }
.identity > strong { padding: 5px 9px; border-radius: var(--radius-sm); color: var(--sky-night); background: var(--afterglow); font-size: .78rem; }
.introduction, .fields { display: grid; gap: 16px; padding: 20px; border: 1px solid var(--line); border-radius: var(--radius-lg); background: white; }
.introduction > h2 { margin: 0; font-size: 1rem; }
.section-title { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.section-title h2, .section-title p { margin: 0; }
.section-title h2 { font-size: 1rem; }
.section-title p { color: var(--muted-ink); font-size: .8rem; }
.field-grid { display: grid; gap: 16px; }
.field-grid > label { display: grid; gap: 6px; font-size: .84rem; font-weight: 650; }
.field-grid > label > span small { display: block; color: var(--muted-ink); font-weight: 400; }
.field-grid b { color: var(--danger); }
.field-grid input:not([type=checkbox]):not([type=radio]):not([type=file]), .field-grid textarea, .field-grid select { width: 100%; min-height: 44px; padding: 9px 11px; border: 1px solid var(--line); border-radius: var(--radius-sm); }
.choices { display: flex; flex-wrap: wrap; gap: 6px; }
.choices label, .bool { min-height: 42px; display: flex !important; align-items: center; gap: 6px; padding: 0 10px; border-radius: var(--radius-sm); background: var(--cloud); }
.upload { display: grid; grid-template-columns: 1fr auto; }
.upload > label { display: flex; align-items: center; gap: 6px; padding: 0 13px; border-radius: 0 var(--radius-sm) var(--radius-sm) 0; color: white; background: var(--sky-lost-strong); }
.upload input[type=file] { display: none; }
.feedback, .empty { padding: 14px; border: 1px solid var(--line); border-radius: var(--radius-sm); }
.error { color: var(--danger); }
.success { color: var(--success); }
.empty { color: var(--muted-ink); text-align: center; }
@media (max-width: 680px) { .identity { grid-template-columns: 56px minmax(0, 1fr); } .avatar { width: 56px; height: 56px; } .identity > strong { grid-column: 1 / -1; } .section-title { align-items: stretch; flex-direction: column; } }
</style>
