<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsUploadField from '@lostsky/ui/components/LsUploadField.vue'
import { NCheckbox, NDatePicker, NInput, NInputNumber, NSelect, NSwitch } from 'naive-ui'
import { computed, reactive, ref, watch } from 'vue'

export interface EntityFieldDefinition {
  id: number
  name: string
  field_key?: string
  value_type?: string
  input_type?: string
  options?: unknown
  default_value?: unknown
  is_required?: number
  is_editable?: number
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
}>(), {
  storedValues: () => [],
  mode: 'readonly',
  loading: false,
  saving: false,
  success: false,
})

const emit = defineEmits<{
  save: [values: Record<number, FieldValue>]
  dirty: [value: boolean]
}>()

const values = reactive<Record<number, FieldValue>>({})
const snapshot = ref('')
const uploading = ref<number | null>(null)
const uploadError = ref<unknown>(null)
const isDirty = computed(() => JSON.stringify(values) !== snapshot.value)

function storedValue(item: StoredValue): FieldValue {
  const value = item.value_string ?? item.value_text ?? item.value_int
    ?? item.value_decimal ?? item.value_datetime ?? item.value_json ?? null
  if (Array.isArray(value)) return value.map(String)
  return value as FieldValue
}

function hydrate() {
  const stored = new Map(props.storedValues.map(item => [Number(item.field_id), storedValue(item)]))
  for (const key of Object.keys(values)) delete values[Number(key)]
  for (const field of props.fields) {
    values[field.id] = stored.has(field.id)
      ? stored.get(field.id) ?? null
      : (field.default_value as FieldValue | undefined) ?? null
  }
  snapshot.value = JSON.stringify(values)
  emit('dirty', false)
}

watch(() => [props.fields, props.storedValues] as const, hydrate, { immediate: true, deep: true })
watch(values, () => emit('dirty', isDirty.value), { deep: true })
watch(() => props.success, (success) => {
  if (!success) return
  snapshot.value = JSON.stringify(values)
  emit('dirty', false)
})

function editable(field: EntityFieldDefinition) {
  if (props.mode === 'manager') return Number(field.is_editable) === 1
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

async function upload(field: EntityFieldDefinition, event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  uploading.value = field.id
  uploadError.value = null
  try {
    const result = await api.upload<Record<string, unknown>>(file)
    values[field.id] = String(result.url ?? result.path ?? result.id ?? '')
  } catch (error) {
    uploadError.value = error
  } finally {
    uploading.value = null
    input.value = ''
  }
}

function submit() {
  const payload: Record<number, FieldValue> = {}
  for (const field of props.fields) {
    if (editable(field)) payload[field.id] = values[field.id] ?? null
  }
  emit('save', payload)
}
</script>

<template>
  <LsPanel><section class="entity-fields-card" aria-labelledby="entity-fields-title">
    <header>
      <div>
        <h2 id="entity-fields-title">对象字段</h2>
        <p>{{ mode === 'manager' ? '维护团队为这个成员配置的字段。' : '团队为当前实体配置的补充资料。' }}</p>
      </div>
      <LsButton
        v-if="mode !== 'readonly' && fields.some(editable)"
        variant="secondary"
        :loading="saving"
        :disabled="loading || Boolean(uploading) || !isDirty"
        @click="submit"
      >
        保存字段
      </LsButton>
    </header>

    <p v-if="loading" class="state">正在读取对象字段…</p>
    <p v-else-if="!fields.length" class="state">当前没有可显示的对象字段。</p>
    <div v-else class="field-list">
      <div v-for="field in fields" :key="field.id" class="field-row">
        <div :id="`entity-field-${field.id}-label`" class="field-label">
          <span>{{ field.name }} <b v-if="field.is_required" aria-label="必填">*</b></span>
          <small>{{ typeLabel(field) }}</small>
        </div>

        <div
          v-if="!editable(field)"
          class="readonly-value"
          :aria-labelledby="`entity-field-${field.id}-label`"
        >
          {{ displayValue(field) }}
          <small v-if="mode === 'self'">仅展示</small>
        </div>
        <NInput
          v-else-if="field.input_type === 'textarea' || field.value_type === 'text' || field.value_type === 'json'"
          v-model:value="values[field.id] as string"
          type="textarea"
          :aria-label="field.name"
          :aria-describedby="`entity-field-${field.id}-label`"
          :autosize="{ minRows: 3, maxRows: 7 }"
          :placeholder="`填写${field.name}`"
        />
        <NSelect
          v-else-if="field.value_type === 'multi_select'"
          v-model:value="values[field.id] as string[]"
          multiple
          :aria-label="field.name"
          :aria-describedby="`entity-field-${field.id}-label`"
          :options="normalizedOptions(field)"
          :placeholder="`选择${field.name}`"
        />
        <NSelect
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
        <NSwitch
          v-else-if="field.value_type === 'bool'"
          :value="Boolean(Number(values[field.id]))"
          :aria-label="field.name"
          :aria-describedby="`entity-field-${field.id}-label`"
          @update:value="value => values[field.id] = value ? 1 : 0"
        >
          <template #checked>是</template>
          <template #unchecked>否</template>
        </NSwitch>
        <NInputNumber
          v-else-if="field.value_type === 'int' || field.value_type === 'decimal'"
          v-model:value="values[field.id] as number"
          :aria-label="field.name"
          :aria-describedby="`entity-field-${field.id}-label`"
          :precision="field.value_type === 'int' ? 0 : undefined"
          class="number-input"
        />
        <LsUploadField
          v-else-if="field.input_type === 'upload'"
          :model-value="String(values[field.id] ?? '')"
          :placeholder="`文件地址或上传${field.name}`"
          :loading="uploading === field.id"
          :disabled="Boolean(uploading)"
          @update:model-value="value => values[field.id] = value"
          @change="upload(field, $event)"
        />
        <NDatePicker
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
          v-else
          v-model:value="values[field.id] as string"
          :aria-label="field.name"
          :aria-describedby="`entity-field-${field.id}-label`"
          :placeholder="`填写${field.name}`"
        />
      </div>
    </div>

    <LsInlineError v-if="error || uploadError" :message="friendlyError(error || uploadError)" />
  </section></LsPanel>
</template>

<style scoped>
.entity-fields-card{display:grid;gap:1rem}.entity-fields-card>header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem}.entity-fields-card h2,.entity-fields-card p{margin:0}.entity-fields-card h2{font-size:1.05rem}.entity-fields-card header p{max-width:65ch;margin-top:.3rem;color:var(--muted-ink);font-size:.82rem;line-height:1.55}.field-list{border-top:1px solid var(--line)}.field-row{display:grid;grid-template-columns:minmax(9rem,.36fr) minmax(0,1fr);align-items:center;gap:1rem;padding:1rem 0;border-bottom:1px solid var(--line)}.field-label{display:grid;gap:.2rem}.field-label>span{font-size:.875rem;font-weight:680}.field-label b{color:var(--danger)}.field-label small,.readonly-value small{color:var(--muted-ink);font-size:.75rem}.readonly-value{min-width:0;display:grid;gap:.2rem;overflow-wrap:anywhere;color:var(--ink);line-height:1.55}.readonly-value small{font-weight:500}.number-input{width:100%}.choice-list{display:flex;flex-wrap:wrap;gap:.75rem 1rem}.state{padding:1rem;color:var(--muted-ink);background:var(--cloud);border-radius:8px;text-align:center}
@media(max-width:639px){.entity-fields-card>header{align-items:stretch;flex-direction:column}.entity-fields-card>header :deep(.ls-button){width:100%}.field-row{grid-template-columns:1fr;gap:.65rem}.upload-control{grid-template-columns:1fr}.upload-control>label{justify-content:center}}
</style>
