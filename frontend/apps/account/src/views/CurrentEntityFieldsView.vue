<script setup lang="ts">
import { ApiError, api, friendlyError } from '@lostsky/api/client'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsPage from '@lostsky/ui/components/LsPage.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsUploadField from '@lostsky/ui/components/LsUploadField.vue'
import { feedback } from '@lostsky/ui/feedback'
import { useMutation } from '@tanstack/vue-query'
import { NAlert, NCheckbox, NDatePicker, NInput, NInputNumber, NSelect, NSwitch } from 'naive-ui'
import { computed, reactive, ref, watch } from 'vue'
import { useUnsavedGuard } from '../composables/useUnsavedGuard'
import { useCurrentEntityQuery, type CurrentEntityField, type CurrentFieldValue } from '../lib/current-entity'

type FieldValue = string | number | boolean | string[] | null
const query = useCurrentEntityQuery()
const values = reactive<Record<number, FieldValue>>({})
const loadedEntityId = ref(0)
const snapshot = ref('')
const stale = ref(false)
const uploading = ref(0)
const fields = computed(() => query.data.value?.custom_fields ?? [])
const serialized = computed(() => JSON.stringify(values))
const dirty = computed(() => loadedEntityId.value > 0 && serialized.value !== snapshot.value)
const draftKey = computed(() => `lostsky:current-entity:fields:${loadedEntityId.value}`)
const uploadDisabledReason = computed(() => query.data.value?.upload?.enabled
  ? ''
  : query.data.value?.upload?.reason || '当前实体不能上传文件')

function storedValue(item: CurrentFieldValue): FieldValue {
  const value = item.value_string ?? item.value_text ?? item.value_int
    ?? item.value_decimal ?? item.value_datetime ?? item.value_json ?? null
  return Array.isArray(value) ? value.map(String) : value as FieldValue
}

function hydrate() {
  const data = query.data.value
  if (!data?.identity) return
  const nextId = data.identity.entity_id
  if (loadedEntityId.value && nextId !== loadedEntityId.value && dirty.value) {
    stale.value = true
    return
  }
  if (dirty.value && nextId === loadedEntityId.value) return
  loadedEntityId.value = nextId
  stale.value = false
  const stored = new Map((data.custom_field_values ?? []).map(item => [item.field_id, storedValue(item)]))
  for (const key of Object.keys(values)) delete values[Number(key)]
  for (const field of data.custom_fields ?? []) {
    values[field.id] = stored.has(field.id)
      ? stored.get(field.id) ?? null
      : field.default_value as FieldValue ?? null
  }
  const remoteSnapshot = JSON.stringify(values)
  const draft = localStorage.getItem(`lostsky:current-entity:fields:${nextId}`)
  if (draft) {
    try { Object.assign(values, JSON.parse(draft) as Record<number, FieldValue>) } catch { localStorage.removeItem(draftKey.value) }
  }
  snapshot.value = remoteSnapshot
}

watch(() => query.data.value, hydrate, { immediate: true, deep: true })
watch(serialized, value => {
  if (!loadedEntityId.value || value === snapshot.value) localStorage.removeItem(draftKey.value)
  else localStorage.setItem(draftKey.value, value)
})
useUnsavedGuard(dirty)

function normalizedOptions(field: CurrentEntityField) {
  let source = field.options
  if (typeof source === 'string') {
    const text = source
    try { source = JSON.parse(text) } catch { source = text.split(',') }
  }
  return Array.isArray(source) ? source.map(item => {
    if (item && typeof item === 'object') {
      const option = item as Record<string, unknown>
      return { label: String(option.label ?? option.name ?? option.value ?? ''), value: String(option.value ?? option.label ?? option.name ?? '') }
    }
    return { label: String(item), value: String(item) }
  }) : []
}

function editable(field: CurrentEntityField) {
  return field.can_edit === true
}

function displayValue(field: CurrentEntityField) {
  const value = values[field.id]
  if (value == null || value === '' || (Array.isArray(value) && !value.length)) return '未填写'
  if (field.value_type === 'bool') return Number(value) ? '是' : '否'
  const options = normalizedOptions(field)
  if (Array.isArray(value)) return value.map(item => options.find(option => option.value === item)?.label ?? item).join('、')
  return options.find(option => option.value === String(value))?.label ?? String(value)
}

const save = useMutation({
  mutationFn: () => {
    if (stale.value) throw new Error('身份已切换，未保存内容没有提交。请重新加载当前身份。')
    const payload: Record<number, FieldValue> = {}
    for (const field of fields.value) if (editable(field)) payload[field.id] = values[field.id] ?? null
    return api.post('/identity/current/fields', { expected_entity_id: loadedEntityId.value, values: payload })
  },
  onSuccess: async () => {
    snapshot.value = serialized.value
    localStorage.removeItem(draftKey.value)
    await query.refetch()
    feedback.success('对象字段已保存')
  },
  onError: error => {
    if (error instanceof ApiError && error.status === 409) stale.value = true
  },
})

async function upload(field: CurrentEntityField, event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  uploading.value = field.id
  try {
    const result = await api.uploadTo<{ url: string }>(file, '/identity/current/upload', { expected_entity_id: loadedEntityId.value })
    values[field.id] = result.url
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) stale.value = true
    feedback.error(friendlyError(error))
  } finally {
    uploading.value = 0
    input.value = ''
  }
}

function reloadCurrent() {
  localStorage.removeItem(draftKey.value)
  snapshot.value = serialized.value
  stale.value = false
  void query.refetch().then(hydrate)
}
</script>

<template>
  <LsPage width="form" class="fields-page">
    <header class="task-heading"><p>当前实体</p><h1>对象字段</h1><span>只可维护团队配置为“主体本人和团队管理”且允许编辑的字段。</span></header>
    <NAlert v-if="stale" type="warning" title="身份已切换，未保存内容没有提交">
      <div class="stale-copy"><span>当前字段已冻结，避免误改新身份。</span><LsButton size="sm" variant="secondary" @click="reloadCurrent">重新加载</LsButton></div>
    </NAlert>
    <LsEmptyState v-if="!fields.length" title="当前没有对象字段" description="字段由所属团队统一配置；这里会在团队提供可见字段后保持稳定入口。" />
    <form v-else @submit.prevent="save.mutate()">
      <LsPanel>
        <div class="field-list">
          <div v-for="field in fields" :key="field.id" class="field-row">
            <div :id="`current-field-${field.id}-label`" class="field-label">
              <strong>{{ field.name }} <span v-if="field.is_required" aria-label="必填">*</span></strong>
              <small>{{ editable(field) ? '可由当前实体编辑' : '由团队管理，仅供查看' }}</small>
            </div>
            <div v-if="!editable(field)" class="readonly" :aria-labelledby="`current-field-${field.id}-label`">{{ displayValue(field) }}</div>
            <NInput v-else-if="field.input_type === 'textarea' || ['text', 'json'].includes(field.value_type || '')" v-model:value="values[field.id] as string" type="textarea" :input-props="{ 'aria-label': field.name }" :autosize="{ minRows: 3, maxRows: 7 }" />
            <NSelect v-else-if="field.value_type === 'multi_select'" v-model:value="values[field.id] as string[]" multiple :options="normalizedOptions(field)" :aria-label="field.name" />
            <NSelect v-else-if="['select', 'radio'].includes(field.input_type || '') || field.value_type === 'select'" v-model:value="values[field.id] as string" clearable :options="normalizedOptions(field)" :aria-label="field.name" />
            <div v-else-if="field.input_type === 'checkbox' && field.value_type !== 'bool'" class="choices" role="group" :aria-labelledby="`current-field-${field.id}-label`">
              <NCheckbox v-for="option in normalizedOptions(field)" :key="option.value" :checked="Array.isArray(values[field.id]) && (values[field.id] as string[]).includes(option.value)" @update:checked="checked => values[field.id] = checked ? [...new Set([...(Array.isArray(values[field.id]) ? values[field.id] as string[] : []), option.value])] : (Array.isArray(values[field.id]) ? values[field.id] as string[] : []).filter(value => value !== option.value)">{{ option.label }}</NCheckbox>
            </div>
            <NSwitch v-else-if="field.value_type === 'bool'" :value="Boolean(Number(values[field.id]))" :aria-label="field.name" @update:value="value => values[field.id] = value ? 1 : 0"><template #checked>是</template><template #unchecked>否</template></NSwitch>
            <NInputNumber v-else-if="['int', 'decimal'].includes(field.value_type || '')" v-model:value="values[field.id] as number" :precision="field.value_type === 'int' ? 0 : undefined" :aria-label="field.name" />
            <LsUploadField v-else-if="field.input_type === 'upload'" :model-value="String(values[field.id] ?? '')" :loading="uploading === field.id" :disabled="Boolean(uploading) || Boolean(uploadDisabledReason) || stale" :disabled-reason="stale ? '身份已切换，请重新加载' : uploadDisabledReason" @update:model-value="value => values[field.id] = value" @change="upload(field, $event)" />
            <NDatePicker v-else-if="['date', 'datetime'].includes(field.value_type || '')" :formatted-value="typeof values[field.id] === 'string' && values[field.id] ? values[field.id] as string : null" :type="field.value_type === 'date' ? 'date' : 'datetime'" :value-format="field.value_type === 'date' ? 'yyyy-MM-dd' : 'yyyy-MM-dd HH:mm:ss'" clearable :aria-label="field.name" @update:formatted-value="value => values[field.id] = value" />
            <NInput v-else v-model:value="values[field.id] as string" :input-props="{ 'aria-label': field.name }" />
          </div>
        </div>
      </LsPanel>
      <LsInlineError v-if="save.isError.value" :message="save.error.value instanceof Error ? save.error.value.message : friendlyError(save.error.value)" />
      <footer class="save-bar"><span>{{ dirty ? '有未保存的修改' : '所有修改已保存' }}</span><LsButton type="submit" :loading="save.isPending.value" :disabled="!dirty || stale || Boolean(uploading)">保存字段</LsButton></footer>
    </form>
  </LsPage>
</template>

<style scoped>
.fields-page{padding-bottom:5rem}.task-heading p,.task-heading h1,.task-heading span{margin:0}.task-heading p{color:var(--sky-lost-strong);font-size:.72rem;font-weight:750;letter-spacing:.06em}.task-heading h1{margin-top:.2rem;font-size:1.55rem}.task-heading span{color:var(--muted-ink);font-size:.85rem}.fields-page form{display:grid;gap:1rem}.stale-copy{display:flex;align-items:center;justify-content:space-between;gap:1rem}.field-list{display:grid}.field-row{display:grid;grid-template-columns:minmax(10rem,.38fr) minmax(0,1fr);align-items:center;gap:1rem;padding:1rem 0;border-bottom:1px solid var(--line)}.field-row:first-child{padding-top:0}.field-row:last-child{padding-bottom:0;border-bottom:0}.field-label{display:grid;gap:.15rem}.field-label strong{font-size:.875rem}.field-label strong span{color:var(--danger)}.field-label small{color:var(--muted-ink);font-size:.72rem}.readonly{overflow-wrap:anywhere;padding:.65rem .75rem;color:var(--muted-ink);background:var(--cloud);border-radius:8px;font-size:.85rem}.choices{display:flex;flex-wrap:wrap;gap:.75rem 1rem}.save-bar{position:fixed;z-index:var(--z-sticky);right:0;bottom:0;left:0;min-height:68px;display:flex;align-items:center;justify-content:flex-end;gap:1rem;padding:calc(.65rem + env(safe-area-inset-bottom)) max(1rem,calc((100vw - 76rem)/2));background:color-mix(in oklch,white,transparent 4%);border-top:1px solid var(--line)}.save-bar span{color:var(--muted-ink);font-size:.78rem}
@media(max-width:767px){.fields-page{padding-bottom:6rem}.field-row{grid-template-columns:1fr;gap:.55rem}.save-bar{justify-content:space-between;padding:.65rem .75rem calc(.65rem + env(safe-area-inset-bottom))}.save-bar :deep(.ls-button){min-width:8rem}}
</style>
