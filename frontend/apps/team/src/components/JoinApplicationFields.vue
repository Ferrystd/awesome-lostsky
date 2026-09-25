<script setup lang="ts">
import { computed, ref } from 'vue'
import { NCheckbox, NCheckboxGroup, NDatePicker, NFlex, NInput, NRadioButton, NRadioGroup, NSelect } from 'naive-ui'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsUploadField from '@lostsky/ui/components/LsUploadField.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import { friendlyError } from '@lostsky/api/client'
export interface JoinField {
  id?: number
  field_key?: string
  name?: string
  input_type?: 'text' | 'textarea' | 'radio' | 'checkbox' | 'select' | 'date' | 'datetime' | 'upload'
  options?: unknown
  default_value?: string | null
  is_apply_required?: 0 | 1
}
export type FieldValue = string | number | boolean | string[]

const props = defineProps<{
  fields: JoinField[]
  modelValue: Record<string, FieldValue>
  uploadFile: (file: File) => Promise<string>
  uploadDisabledReason?: string
  disabled?: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [value: Record<string, FieldValue>]; 'update:uploading': [value: boolean] }>()
const values = computed(() => props.modelValue)
const uploading = ref<string | null>(null)
const uploadError = ref('')
function keyOf(field: JoinField) { return field.field_key || String(field.id ?? '') }
function choices(field: JoinField): Array<{ label: string; value: string }> {
  let source = field.options
  if (typeof source === 'string') { try { source = JSON.parse(source) } catch { source = (source as string).split(',') } }
  if (Array.isArray(source)) return source.map((item) => typeof item === 'object' && item !== null ? { label: String((item as Record<string, unknown>).label ?? (item as Record<string, unknown>).name ?? (item as Record<string, unknown>).value ?? ''), value: String((item as Record<string, unknown>).value ?? (item as Record<string, unknown>).id ?? (item as Record<string, unknown>).label ?? '') } : { label: String(item), value: String(item) })
  return []
}

function update(field: JoinField, value: FieldValue) {
  emit('update:modelValue', { ...props.modelValue, [keyOf(field)]: value })
}
async function upload(field: JoinField, event: Event) {
  if (props.disabled || props.uploadDisabledReason || uploading.value) return
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  uploading.value = keyOf(field)
  emit('update:uploading', true)
  uploadError.value = ''
  try { update(field, await props.uploadFile(file)) }
  catch (error) { uploadError.value = friendlyError(error) }
  finally { uploading.value = null; emit('update:uploading', false); input.value = '' }
}
</script>
<template>
  <NFlex vertical size="large" class="join-application-fields">
      <LsField v-for="field in fields" :key="keyOf(field)" :label="field.name || field.field_key || '入职字段'" :required="Boolean(field.is_apply_required)" :for-id="`join-field-${keyOf(field)}`">
        <NInput :input-props="{ id: `join-field-${keyOf(field)}`, 'aria-label': field.name || field.field_key }" :disabled="disabled" v-if="field.input_type === 'textarea'" :value="String(values[keyOf(field)] ?? '')" type="textarea" :autosize="{ minRows: 4, maxRows: 8 }" @update:value="value => update(field, value)" />
        <NSelect :id="`join-field-${keyOf(field)}`" :disabled="disabled" v-else-if="field.input_type === 'select'" :value="String(values[keyOf(field)] ?? '') || null" :options="choices(field)" placeholder="请选择" @update:value="value => update(field, value)" />
        <NRadioGroup :id="`join-field-${keyOf(field)}`" :disabled="disabled" v-else-if="field.input_type === 'radio'" :value="String(values[keyOf(field)] ?? '')" class="choices" :name="keyOf(field)" @update:value="value => update(field, value)"><NRadioButton v-for="option in choices(field)" :key="option.value" :value="option.value">{{ option.label }}</NRadioButton></NRadioGroup>
        <NCheckboxGroup :id="`join-field-${keyOf(field)}`" :disabled="disabled" v-else-if="field.input_type === 'checkbox'" :value="Array.isArray(values[keyOf(field)]) ? values[keyOf(field)] as string[] : []" class="choices" @update:value="value => update(field, value as string[])"><NCheckbox v-for="option in choices(field)" :key="option.value" :value="option.value">{{ option.label }}</NCheckbox></NCheckboxGroup>
        <LsUploadField v-else-if="field.input_type === 'upload'" :show-url="false" :button-label="values[keyOf(field)] ? '重新选择文件' : '选择文件'" :loading="uploading === keyOf(field)" :disabled="Boolean(disabled || uploading || uploadDisabledReason)" :disabled-reason="uploadDisabledReason" @change="upload(field, $event)" />
        <NDatePicker :id="`join-field-${keyOf(field)}`" :disabled="disabled" v-else-if="field.input_type === 'date' || field.input_type === 'datetime'" :formatted-value="String(values[keyOf(field)] ?? '') || null" :type="field.input_type === 'date' ? 'date' : 'datetime'" :value-format="field.input_type === 'date' ? 'yyyy-MM-dd' : 'yyyy-MM-dd HH:mm:ss'" clearable @update:formatted-value="value => update(field, value ?? '')" />
        <NInput :input-props="{ id: `join-field-${keyOf(field)}`, 'aria-label': field.name || field.field_key }" :disabled="disabled" v-else :value="String(values[keyOf(field)] ?? '')" :placeholder="field.default_value || ''" @update:value="value => update(field, value)" />
      </LsField>

    <LsInlineError v-if="uploadError" :message="uploadError" />
  </NFlex>
</template>
<style scoped>
.choices{display:flex;flex-wrap:wrap;gap:.5rem}.choices :deep(.n-radio-button),.choices :deep(.n-checkbox){min-height:44px}
</style>
