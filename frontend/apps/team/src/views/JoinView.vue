<script setup lang="ts">
import { api, auth, friendlyError } from '@lostsky/api/client'
import { useMutation, useQuery } from '@tanstack/vue-query'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsStatusTag from '@lostsky/ui/components/LsStatusTag.vue'
import LsUploadField from '@lostsky/ui/components/LsUploadField.vue'
import { syncReferral } from '@lostsky/shared/referral'
import { ArrowLeft } from '@lucide/vue'
import { NCheckbox, NCheckboxGroup, NDatePicker, NFormItem, NInput, NRadioButton, NRadioGroup, NSelect } from 'naive-ui'
import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { fileAvailabilityReason, type FileUploadAvailability } from '../lib/teamAccess'

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
interface JoinForm {
  purpose_code: 'join' | 'reinstate'
  purpose_label: string
  refill_required: boolean
  fields: JoinField[]
  file_upload: FileUploadAvailability
}

const route = useRoute()
const form = useQuery({ queryKey: ['join-form'], queryFn: () => api.get<JoinForm>('/join/form') })
const mine = useQuery({ queryKey: ['join-mine'], queryFn: () => api.get<Record<string, unknown>[]>('/join/mine'), enabled: Boolean(auth.token()) })
const values = reactive<Record<string, FieldValue>>({})
const memo = ref('')
const inviterSlug = ref('')
const uploading = ref<string | null>(null)
const purpose = computed(() => form.data.value?.purpose_code ?? 'join')
const isReinstate = computed(() => purpose.value === 'reinstate')
const fields = computed(() => form.data.value?.fields ?? [])
const uploadDisabledReason = computed(() => fileAvailabilityReason(form.data.value?.file_upload))
const missingRequired = computed(() => fields.value.some((field) => {
  if (!field.is_apply_required) return false
  const value = values[keyOf(field)]
  return Array.isArray(value) ? value.length === 0 : value === undefined || value === null || String(value).trim() === ''
}))
const mutation = useMutation({ mutationFn: () => api.post('/join/apply', {
  values: { ...values },
  ...(!isReinstate.value ? { memo: memo.value.trim() || null } : {}),
  ...(!isReinstate.value && inviterSlug.value ? { inviter_slug: inviterSlug.value } : {}),
}) })
const cancel = useMutation({ mutationFn: (id: number) => api.post('/join/cancel', { id }), onSuccess: () => mine.refetch() })

watch(() => route.query.ref, value => { inviterSlug.value = syncReferral(value) }, { immediate: true })

function keyOf(field: JoinField) { return field.field_key || String(field.id ?? '') }
function choices(field: JoinField): Array<{ label: string; value: string }> {
  let source = field.options
  if (typeof source === 'string') { try { source = JSON.parse(source) } catch { source = (source as string).split(',') } }
  if (Array.isArray(source)) return source.map((item) => typeof item === 'object' && item !== null ? { label: String((item as Record<string, unknown>).label ?? (item as Record<string, unknown>).name ?? (item as Record<string, unknown>).value ?? ''), value: String((item as Record<string, unknown>).value ?? (item as Record<string, unknown>).id ?? (item as Record<string, unknown>).label ?? '') } : { label: String(item), value: String(item) })
  return []
}
async function upload(field: JoinField, event: Event) {
  if (uploadDisabledReason.value) return
  const file = (event.target as HTMLInputElement).files?.[0]; if (!file) return
  const key = keyOf(field); const body = new FormData(); body.append('file', file); body.append('field_id', String(field.id ?? ''))
  uploading.value = key
  try {
    const result = await api.post<Record<string, unknown>>('/join/upload', body)
    values[key] = String(result.id ?? result.file_id ?? result.url ?? '')
    await form.refetch()
  } finally { uploading.value = null }
}
</script>

<template>
  <main class="join">
    <a href="//www.lostsky.work"><ArrowLeft :size="18" />LostSky</a>
    <section><p>{{ isReinstate ? '返回团队' : '加入团队' }}</p><h1 class="ls-display">{{ isReinstate ? '申请复职' : '申请进入' }}<br>这片青空。</h1><span>{{ isReinstate ? '复职会继续使用原成员身份、对象标识和业务关系。' : '填写团队设置的申请资料，提交后由管理员审核。' }}</span></section>
    <form @submit.prevent="mutation.mutate()">
      <h2>{{ isReinstate ? '复职申请' : '加入申请' }}</h2>
      <p v-if="form.isPending.value" class="form-state">正在读取申请表…</p>
      <LsInlineError v-else-if="form.isError.value" :message="friendlyError(form.error.value)" />
      <div v-if="inviterSlug && !isReinstate" class="referral-confirmation" aria-label="当前邀请人">
        <span>邀请人</span>
        <strong>@{{ inviterSlug }}</strong>
        <small>邀请人来自当前链接，提交申请时会一并记录，无法在此修改。</small>
      </div>
      <NFormItem v-for="field in fields" :key="keyOf(field)" :label="field.name || field.field_key" :required="Boolean(field.is_apply_required)">
        <NInput v-if="field.input_type === 'textarea'" :value="String(values[keyOf(field)] ?? '')" type="textarea" :autosize="{ minRows: 4, maxRows: 8 }" @update:value="value => values[keyOf(field)] = value" />
        <NSelect v-else-if="field.input_type === 'select'" :value="String(values[keyOf(field)] ?? '') || null" :options="choices(field)" placeholder="请选择" @update:value="value => values[keyOf(field)] = value" />
        <NRadioGroup v-else-if="field.input_type === 'radio'" :value="String(values[keyOf(field)] ?? '')" class="choices" :name="keyOf(field)" @update:value="value => values[keyOf(field)] = value"><NRadioButton v-for="option in choices(field)" :key="option.value" :value="option.value">{{ option.label }}</NRadioButton></NRadioGroup>
        <NCheckboxGroup v-else-if="field.input_type === 'checkbox'" :value="Array.isArray(values[keyOf(field)]) ? values[keyOf(field)] as string[] : []" class="choices" @update:value="value => values[keyOf(field)] = value as string[]"><NCheckbox v-for="option in choices(field)" :key="option.value" :value="option.value">{{ option.label }}</NCheckbox></NCheckboxGroup>
        <LsUploadField v-else-if="field.input_type === 'upload'" :show-url="false" :button-label="values[keyOf(field)] ? '重新选择文件' : '选择文件'" :loading="uploading === keyOf(field)" :disabled="Boolean(uploading || uploadDisabledReason)" :disabled-reason="uploadDisabledReason" @change="upload(field, $event)" />
        <NDatePicker v-else-if="field.input_type === 'date' || field.input_type === 'datetime'" :formatted-value="String(values[keyOf(field)] ?? '') || null" :type="field.input_type === 'date' ? 'date' : 'datetime'" :value-format="field.input_type === 'date' ? 'yyyy-MM-dd' : 'yyyy-MM-dd HH:mm:ss'" clearable @update:formatted-value="value => values[keyOf(field)] = value ?? ''" />
        <NInput v-else :value="String(values[keyOf(field)] ?? '')" :placeholder="field.default_value || ''" @update:value="value => values[keyOf(field)] = value" />
      </NFormItem>
      <NFormItem v-if="!isReinstate" label="补充说明"><NInput v-model:value="memo" type="textarea" :autosize="{ minRows: 4, maxRows: 8 }" placeholder="还有什么希望团队了解的？" /></NFormItem>
      <LsInlineError v-if="mutation.isError.value" :message="friendlyError(mutation.error.value)" />
      <p v-if="mutation.isSuccess.value" class="success" role="status">{{ isReinstate ? '复职申请已提交，请等待审核。' : '加入申请已提交，请等待审核。' }}</p>
      <LsButton type="submit" size="lg" :loading="mutation.isPending.value" :disabled="form.isPending.value || Boolean(uploading) || missingRequired">提交{{ isReinstate ? '复职' : '加入' }}申请</LsButton>
      <section v-if="mine.data.value?.length" class="mine"><h2>我的申请</h2><article v-for="item in mine.data.value" :key="String(item.id)"><div><strong>{{ item.purpose_label || '加入' }}申请 #{{item.id}}</strong><LsStatusTag :label="String(item.status_label || item.status)" /></div><p>{{item.memo||'没有补充说明'}}</p><LsButton v-if="['applied','reviewing','已申请','审核中',1,2].includes((item.status_code ?? item.status) as string|number)" type="button" variant="danger" size="sm" :loading="cancel.isPending.value" @click="cancel.mutate(Number(item.id))">取消申请</LsButton></article></section>
    </form>
  </main>
</template>

<style scoped>
.join{min-height:100dvh;padding:1rem;color:white;background:var(--sky-void)}.join>a{min-height:44px;display:inline-flex;align-items:center;gap:.5rem;color:oklch(.72 .014 210)}.join>section{padding:3.5rem 0 2.5rem}.join>section p{color:var(--sky-lost);font-size:.75rem;font-weight:750;letter-spacing:.08em}.join h1{margin:.75rem 0;font-size:clamp(3.2rem,15vw,5.5rem)}.join>section span{color:oklch(.72 .014 210)}form{display:grid;gap:1.15rem;padding:1.25rem;color:var(--ink);background:white;border-radius:12px}form h2{margin:0}.referral-confirmation{display:grid;grid-template-columns:minmax(5rem,.35fr) minmax(0,1fr);gap:.25rem 1rem;padding:.875rem 0;border-block:1px solid var(--line)}.referral-confirmation span{color:var(--muted-ink);font-size:.8rem}.referral-confirmation strong{overflow-wrap:anywhere}.referral-confirmation small{grid-column:2;color:var(--muted-ink);font-size:.78rem;line-height:1.5}.field{display:grid;gap:.45rem;color:var(--ink);font-size:.875rem;font-weight:650}.field b{color:var(--danger)}.choices{display:flex;flex-wrap:wrap;gap:.5rem}.choices :deep(.n-radio-button),.choices :deep(.n-checkbox){min-height:40px}.form-state{color:var(--muted-ink)}.error,.success,.form-state{padding:.75rem;margin:0;border-radius:8px;font-size:.86rem}.error{color:var(--danger);background:color-mix(in oklch,var(--danger),white 93%)}.success{color:var(--success);background:color-mix(in oklch,var(--success),white 92%)}.mine{display:grid;gap:.65rem;margin-top:1rem;padding-top:1rem;border-top:1px solid var(--line)}.mine article{display:grid;gap:.5rem;padding:.75rem;background:var(--cloud);border-radius:8px}.mine article>div{display:flex;justify-content:space-between;gap:1rem}.mine p{margin:0;color:var(--muted-ink);font-size:.84rem}@media(max-width:479px){.referral-confirmation{grid-template-columns:1fr}.referral-confirmation small{grid-column:1}}@media(min-width:800px){.join{display:grid;grid-template-columns:1fr minmax(420px,.75fr);grid-template-rows:auto 1fr;gap:4rem;padding:2.5rem clamp(2rem,7vw,7rem)}.join>a{grid-column:1/3}.join>section{align-self:center}.join form{align-self:center;padding:2rem}}
</style>
