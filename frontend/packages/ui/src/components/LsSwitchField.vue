<script setup lang="ts">
import { useFormFields } from '../form-fields'
import FormFieldLayout from './internal/FormFieldLayout.vue'
import { computed, useId } from 'vue'
import LsSwitch from './LsSwitch.vue'

const props = withDefaults(defineProps<{
  modelValue: boolean
  label: string
  description?: string
  id?: string
  ariaLabel?: string
  headingLevel?: 2 | 3
  disabled?: boolean
  readOnly?: boolean
  loading?: boolean
  disabledReason?: string
}>(), {
  description: '',
  id: '',
  ariaLabel: '',
  disabledReason: '',
})

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()
const generatedId = useId()
const controlId = computed(() => props.id || `ls-switch-field-${generatedId}`)
const labelId = computed(() => `${controlId.value}-label`)
const descriptionId = computed(() => `${controlId.value}-description`)
const labelTag = computed(() => props.headingLevel ? `h${props.headingLevel}` : 'span')
const unavailable = computed(() => props.disabled || props.readOnly)
const inFields = useFormFields()
const describedBy = computed(() => props.description ? descriptionId.value : undefined)
</script>

<template>
  <FormFieldLayout v-if="inFields" class="ls-switch-field-row" :data-disabled="unavailable || undefined">
    <template #label><component :is="labelTag" :id="labelId" class="ls-switch-field__label">{{ label }}</component></template>
    <LsSwitch :id="controlId" :model-value="modelValue" :disabled="disabled" :read-only="readOnly" :loading="loading" :disabled-reason="disabledReason" :aria-label="ariaLabel || undefined" :aria-labelledby="ariaLabel ? undefined : labelId" :aria-describedby="describedBy" @update:model-value="emit('update:modelValue', $event)" />
    <template v-if="description" #feedback><span :id="descriptionId" class="ls-switch-field__description">{{ description }}</span></template>
  </FormFieldLayout>
  <div v-else class="ls-switch-field" :data-disabled="unavailable || undefined">
    <span class="ls-switch-field__copy">
      <component :is="labelTag" :id="labelId" class="ls-switch-field__label">{{ label }}</component>
      <span v-if="description" :id="descriptionId" class="ls-switch-field__description">{{ description }}</span>
    </span>
    <LsSwitch
      :id="controlId"
      class="ls-switch-field__control"
      :model-value="modelValue"
      :disabled="disabled"
      :read-only="readOnly"
      :loading="loading"
      :disabled-reason="disabledReason"
      :aria-label="ariaLabel || undefined"
      :aria-labelledby="ariaLabel ? undefined : labelId"
      :aria-describedby="describedBy"
      @update:model-value="emit('update:modelValue', $event)"
    />
  </div>
</template>

<style scoped>
.ls-switch-field{min-width:0;min-height:56px;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:1rem;padding:.75rem;background:var(--cloud);border-radius:9px}.ls-switch-field__copy{min-width:0;display:grid;gap:.2rem}.ls-switch-field__label{margin:0;color:var(--ink);font-size:.875rem;font-weight:650;line-height:1.4}.ls-switch-field__description{color:var(--muted-ink);font-size:.76rem;line-height:1.5;overflow-wrap:anywhere}.ls-switch-field__control{min-height:44px;justify-self:end}.ls-switch-field[data-disabled="true"]{background:color-mix(in oklch,var(--cloud),white 35%)}
@media(max-width:639px){.ls-switch-field{align-items:start}}
</style>
