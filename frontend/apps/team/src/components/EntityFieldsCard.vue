<script setup lang="ts">
import { useQueryDraft, type DraftSubmission } from '@lostsky/shared/useQueryDraft'
import { friendlyError, uploadFileUrl } from '@lostsky/api/client'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsMediaUploadField from '@lostsky/ui/components/LsMediaUploadField.vue'
import LsSwitch from '@lostsky/ui/components/LsSwitch.vue'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsFormFields from '@lostsky/ui/components/LsFormFields.vue'
import { NCheckbox, NDatePicker, NInput, NInputNumber, NSelect } from 'naive-ui'
import { reactive, ref, watch } from 'vue'

export interface EntityFieldDefinition {
  id: number
  name: string
  field_key?: string
  value_type?: string
  input_type?: string
  options?: unknown
  default_value?: unknown
  is_required?: number
  can_edit?: boolean
}

type FieldValue = string | number | boolean | string[] | null
type StoredValue = Record<string, unknown>

const props = withDefaults(defineProps<{
  fields: EntityFieldDefinition[]
  storedValues?: StoredValue[]
  mode?: 'self' | 'manager' | 'readonly'
  loading?: boolean
  saving?: boolean
  error?: unknown
  success?: boolean
  uploadDisabledReason?: string
}>(), {
  storedValues: () => [],
  mode: 'readonly',
  loading: false,
  saving: false,
  success: false,
  uploadDisabledReason: '',
})

const emit = defineEmits<{
  save: [values: Record<number, FieldValue>]
  dirty: [value: boolean]
}>()

const values = reactive<Record<number, FieldValue>>({})
const uploading = ref<number | null>(null)
const draft = useQueryDraft({ key: () => 'fields', read: () => values, apply: value => {
  for (const key of Object.keys(values)) delete values[Number(key)]
  Object.assign(values, value)
} })
const isDirty = draft.dirty
let submitted: DraftSubmission<Record<number, FieldValue>> | undefined

function storedValue(item: StoredValue): FieldValue {
  const value = item.value_string ?? item.value_text ?? item.value_int
    ?? item.value_decimal ?? item.value_datetime ?? item.value_json ?? null
  if (Array.isArray(value)) return value.map(String)
  return value as FieldValue
}

function hydrate() {
  const stored = new Map(props.storedValues.map(item => [Number(item.field_id), storedValue(item)]))
  const next: Record<number, FieldValue> = {}
  for (const field of props.fields) {
    next[field.id] = stored.has(field.id)
      ? stored.get(field.id) ?? null
      : (field.default_value as FieldValue | undefined) ?? null
  }
  draft.hydrate(next)
}

watch(() => [props.fields, props.storedValues] as const, hydrate, { immediate: true, deep: true })
watch(isDirty, value => emit('dirty', value), { immediate: true, flush: 'sync' })
watch(() => props.success, (success) => {
  if (!success) return
  if (submitted) draft.accept(submitted)
})

function editable(field: EntityFieldDefinition) {
  if (props.mode === 'manager') return true
  if (props.mode === 'self') return field.can_edit === true
  return false
}

function normalizedOptions(field: EntityFieldDefinition) {
  let source = field.options
  if (typeof source === 'string') {
    const text = source
    try { source = JSON.parse(text) } catch { source = text.split(',') }
  }
  return Array.isArray(source) ? source.map(item => {
    if (item && typeof item === 'object') {
      const record = item as Record<string, unknown>
      return {
        label: String(record.label ?? record.name ?? record.value ?? ''),
        value: String(record.value ?? record.label ?? record.name ?? ''),
      }
    }
    return { label: String(item), value: String(item) }
  }) : []
}

function typeLabel(field: EntityFieldDefinition) {
  const value = ({
    string: '文本', text: '长文本', int: '整数', decimal: '数值', bool: '是/否',
    date: '日期', datetime: '日期时间', select: '单选', multi_select: '多选', json: '结构化数据',
  } as Record<string, string>)[field.value_type ?? 'string'] ?? '文本'
  const input = ({ textarea: '多行输入', radio: '单选按钮', checkbox: '复选框', select: '选择器', upload: '文件' } as Record<string, string>)[field.input_type ?? ''] ?? ''
  return input && input !== value ? `${value} · ${input}` : value
}

function displayValue(field: EntityFieldDefinition) {
  const value = values[field.id]
  if (value == null || value === '' || (Array.isArray(value) && !value.length)) return '未填写'
  if (field.value_type === 'bool') return Number(value) ? '是' : '否'
  const options = normalizedOptions(field)
  if (Array.isArray(value)) return value.map(item => options.find(option => option.value === String(item))?.label ?? item).join('、')
  return options.find(option => option.value === String(value))?.label ?? String(value)
}

function submit() {
  submitted = draft.capture()
  const payload: Record<number, FieldValue> = {}
  for (const field of props.fields) {
    if (editable(field)) payload[field.id] = submitted.value[field.id] ?? null
  }
  emit('save', payload)
}
</script>

<template>
  <LsPanel><section class="entity-fields-card" aria-labelledby="entity-fields-title">
    <header>
      <div>
        <h2 id="entity-fields-title">对象字段</h2>
        <p>{{ mode === 'manager' ? '维护团队为这个成员配置的字段。' : '团队为当前人员配置的补充资料。' }}</p>
      </div>
      <LsButton
        v-if="mode !== 'readonly' && fields.some(editable)"
        class="entity-fields-save"
        variant="primary"
        :loading="saving"
        :disabled="loading || Boolean(uploading) || !isDirty"
        @click="submit"
      >
        保存字段
      </LsButton>
    </header>

    <p v-if="loading" class="state">正在读取对象字段…</p>
    <p v-else-if="!fields.length" class="state">当前没有可显示的对象字段。</p>
    <LsFormFields v-else>
      <template v-for="field in fields" :key="field.id">
      <LsField :label="field.name" :description="typeLabel(field)" :for-id="`entity-field-${field.id}`" :required="Boolean(field.is_required)" :read-only="!editable(field)">
        <div
          v-if="!editable(field)"
          class="readonly-value"
          :id="`entity-field-${field.id}`"
          :aria-labelledby="`entity-field-${field.id}-label`"
        >
          {{ displayValue(field) }}
          <small v-if="mode === 'self'">仅展示</small>
        </div>
        <div v-else-if="field.value_type === 'bool'">
          <LsSwitch :id="`entity-field-${field.id}`" :model-value="Boolean(Number(values[field.id]))" :aria-labelledby="`entity-field-${field.id}-label`" @update:model-value="value => values[field.id] = value ? 1 : 0" />
        </div>
        <NInput
          :input-props="{ id: `entity-field-${field.id}`, 'aria-label': field.name }"
          v-else-if="field.input_type === 'textarea' || field.value_type === 'text' || field.value_type === 'json'"
          v-model:value="values[field.id] as string"
          type="textarea"
          :aria-label="field.name"
          :aria-describedby="`entity-field-${field.id}-label`"
          :autosize="{ minRows: 3, maxRows: 7 }"
          :placeholder="`填写${field.name}`"
        />
        <NSelect
          :input-props="{ id: `entity-field-${field.id}`, 'aria-label': field.name }"
          v-else-if="field.value_type === 'multi_select'"
          v-model:value="values[field.id] as string[]"
          multiple
          :aria-label="field.name"
          :aria-describedby="`entity-field-${field.id}-label`"
          :options="normalizedOptions(field)"
          :placeholder="`选择${field.name}`"
        />
        <NSelect
          :input-props="{ id: `entity-field-${field.id}`, 'aria-label': field.name }"
          v-else-if="field.input_type === 'select' || field.input_type === 'radio' || field.value_type === 'select'"
          v-model:value="values[field.id] as string"
          clearable
          :aria-label="field.name"
          :aria-describedby="`entity-field-${field.id}-label`"
          :options="normalizedOptions(field)"
          :placeholder="`选择${field.name}`"
        />
        <div
          v-else-if="field.input_type === 'checkbox' && field.value_type !== 'bool'"
          class="choice-list"
          :id="`entity-field-${field.id}`"
          role="group"
          :aria-labelledby="`entity-field-${field.id}-label`"
        >
          <NCheckbox
            v-for="option in normalizedOptions(field)"
            :key="option.value"
            :checked="Array.isArray(values[field.id]) && (values[field.id] as string[]).includes(option.value)"
            @update:checked="checked => values[field.id] = checked
              ? [...new Set([...(Array.isArray(values[field.id]) ? values[field.id] as string[] : []), option.value])]
              : (Array.isArray(values[field.id]) ? values[field.id] as string[] : []).filter(item => item !== option.value)"
          >
            {{ option.label }}
          </NCheckbox>
        </div>
        <NInputNumber
          :input-props="{ id: `entity-field-${field.id}`, 'aria-label': field.name }"
          v-else-if="field.value_type === 'int' || field.value_type === 'decimal'"
          v-model:value="values[field.id] as number"
          :aria-label="field.name"
          :aria-describedby="`entity-field-${field.id}-label`"
          :precision="field.value_type === 'int' ? 0 : undefined"
          class="number-input"
        />
        <LsMediaUploadField
          :id="`entity-field-${field.id}`"
          v-else-if="field.input_type === 'upload'"
          :model-value="String(values[field.id] ?? '')"
          :upload="uploadFileUrl"
          :placeholder="`文件地址或上传${field.name}`"
          :disabled="Boolean(uploading) || Boolean(uploadDisabledReason)"
          :disabled-reason="uploadDisabledReason"
          @update:model-value="value => values[field.id] = value"
          @uploading="value => uploading = value ? field.id : null"
        />
        <NDatePicker
          :id="`entity-field-${field.id}`"
          v-else-if="field.value_type === 'date' || field.value_type === 'datetime'"
          :formatted-value="typeof values[field.id] === 'string' && values[field.id] ? values[field.id] as string : null"
          :type="field.value_type === 'date' ? 'date' : 'datetime'"
          :value-format="field.value_type === 'date' ? 'yyyy-MM-dd' : 'yyyy-MM-dd HH:mm:ss'"
          :aria-label="field.name"
          :aria-describedby="`entity-field-${field.id}-label`"
          clearable
          @update:formatted-value="value => values[field.id] = value"
        />
        <NInput
          :input-props="{ id: `entity-field-${field.id}`, 'aria-label': field.name }"
          v-else
          v-model:value="values[field.id] as string"
          :aria-label="field.name"
          :aria-describedby="`entity-field-${field.id}-label`"
          :placeholder="`填写${field.name}`"
        />
      </LsField>
      </template>
    </LsFormFields>

    <LsInlineError v-if="error" :message="friendlyError(error)" />
  </section></LsPanel>
</template>

<style scoped>
.entity-fields-card{display:grid;gap:1rem}.entity-fields-card>header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem}.entity-fields-card h2,.entity-fields-card p{margin:0}.entity-fields-card h2{font-size:1.05rem}.entity-fields-card header p{max-width:65ch;margin-top:.3rem;color:var(--muted-ink);font-size:.82rem;line-height:1.55}.readonly-value{min-width:0;display:grid;gap:.2rem;overflow-wrap:anywhere;color:var(--ink);line-height:1.55}.readonly-value small{font-weight:500;color:var(--muted-ink);font-size:.75rem}.choice-list{display:flex;flex-wrap:wrap;gap:.75rem 1rem}.state{padding:1rem;color:var(--muted-ink);background:var(--cloud);border-radius:8px;text-align:center}
@media(max-width:639px){.entity-fields-card>header{align-items:stretch;flex-direction:column}.entity-fields-save{width:100%}}
</style>
