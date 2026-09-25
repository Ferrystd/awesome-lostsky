<script setup lang="ts">
import { uploadFileUrl } from '@lostsky/api/client'
import LsField from '@lostsky/ui/components/LsField.vue'
import LsMediaUploadField from '@lostsky/ui/components/LsMediaUploadField.vue'
import { NCheckbox, NDatePicker, NInput, NInputNumber, NSelect } from 'naive-ui'
import type { ServiceField } from '../types'

withDefaults(defineProps<{
  fields: ServiceField[]
  idPrefix?: string
}>(), {
  idPrefix: 'completion-field',
})

const values = defineModel<Record<number, unknown>>({ required: true })
const emit = defineEmits<{ uploading: [value: boolean] }>()
let uploads = 0
async function upload(file: File) {
  uploads++
  emit('uploading', true)
  try { return await uploadFileUrl(file) }
  finally { uploads--; emit('uploading', uploads > 0) }
}
const choices = (field: ServiceField) => (field.options ?? []).map(value => ({ label: value, value }))
const update = (fieldId: number, value: unknown) => {
  values.value = { ...values.value, [fieldId]: value }
}
</script>

<template>
  <div class="completion-fields">
    <LsField
      v-for="field in fields"
      :key="field.id"
      :label="field.name"
      :for-id="`${idPrefix}-${field.id}`"
      :required="Boolean(field.is_required)"
    >
      <LsMediaUploadField
        v-if="field.value_type === 'image'"
        :id="`${idPrefix}-${field.id}`"
        :model-value="String(values[field.id] ?? '')"
        :upload="upload"
        accept="image/*"
        placeholder="图片地址或上传图片"
        button-label="上传图片"
        @update:model-value="value => update(field.id, value)"
      />
      <NInput
        v-else-if="field.input_type === 'textarea' || field.value_type === 'text' || field.value_type === 'json'"
        :id="`${idPrefix}-${field.id}`"
        :value="values[field.id] as string | undefined"
        type="textarea"
        :input-props="{ 'aria-label': field.name }"
        @update:value="value => update(field.id, value)"
      />
      <NSelect
        v-else-if="['select', 'radio'].includes(field.input_type) || field.value_type === 'select'"
        :id="`${idPrefix}-${field.id}`"
        :value="values[field.id] as string | number | null | undefined"
        :options="choices(field)"
        @update:value="value => update(field.id, value)"
      />
      <NSelect
        v-else-if="field.value_type === 'multi_select' || field.input_type === 'checkbox'"
        :id="`${idPrefix}-${field.id}`"
        :value="values[field.id] as Array<string> | undefined"
        :options="choices(field)"
        multiple
        @update:value="value => update(field.id, value)"
      />
      <NCheckbox
        v-else-if="field.value_type === 'bool'"
        :id="`${idPrefix}-${field.id}`"
        :checked="Boolean(values[field.id])"
        @update:checked="value => update(field.id, value ? 1 : 0)"
      >是</NCheckbox>
      <NInputNumber
        v-else-if="['int', 'decimal'].includes(field.value_type)"
        :id="`${idPrefix}-${field.id}`"
        :value="values[field.id] as number | undefined"
        @update:value="value => update(field.id, value)"
      />
      <NDatePicker
        v-else-if="['date', 'datetime'].includes(field.value_type)"
        :id="`${idPrefix}-${field.id}`"
        :value="values[field.id] as number | undefined"
        :type="field.value_type === 'date' ? 'date' : 'datetime'"
        @update:value="value => update(field.id, value)"
      />
      <NInput
        v-else
        :id="`${idPrefix}-${field.id}`"
        :value="values[field.id] as string | undefined"
        :input-props="{ 'aria-label': field.name }"
        @update:value="value => update(field.id, value)"
      />
    </LsField>
  </div>
</template>

<style scoped>
.completion-fields { display: grid; gap: .75rem; }
</style>
