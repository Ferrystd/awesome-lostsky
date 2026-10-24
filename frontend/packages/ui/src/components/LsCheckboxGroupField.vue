<script setup lang="ts">
import { NCheckbox, NCheckboxGroup } from 'naive-ui'
import { computed, useId } from 'vue'
import { feedback } from '../feedback'

export interface LsCheckboxGroupOption {
  value: string | number
  label: string
  description?: string
  meta?: string
  disabled?: boolean
  disabledReason?: string
}

const props = withDefaults(defineProps<{
  modelValue: Array<string | number>
  label: string
  options: LsCheckboxGroupOption[]
  id?: string
  hint?: string
  error?: string
  required?: boolean
  disabled?: boolean
}>(), { disabled: false, required: false })

const emit = defineEmits<{ 'update:modelValue': [value: Array<string | number>] }>()
const generatedId = useId()
const fieldId = computed(() => props.id ?? `ls-checkbox-group-${generatedId}`)
const describedBy = computed(() => [props.error ? `${fieldId.value}-error` : '', !props.error && props.hint ? `${fieldId.value}-hint` : ''].filter(Boolean).join(' ') || undefined)
const reason = (option: LsCheckboxGroupOption) => option.disabledReason?.trim() ?? ''

function update(value: Array<string | number>) {
  const changed = props.options.find(option => value.includes(option.value) !== props.modelValue.includes(option.value))
  if (changed?.disabled && reason(changed)) {
    feedback.info(reason(changed))
    return
  }
  emit('update:modelValue', value)
}
</script>

<template>
  <fieldset class="ls-checkbox-group-field" :aria-describedby="describedBy" :aria-required="required || undefined" :data-invalid="Boolean(error)">
    <legend :id="`${fieldId}-label`">{{ label }} <span v-if="required" aria-hidden="true">*</span></legend>
    <NCheckboxGroup
      :value="modelValue"
      :disabled="disabled"
      :aria-labelledby="`${fieldId}-label`"
      @update:value="value => update(value as Array<string | number>)"
    >
      <div class="ls-checkbox-group-field__options">
        <NCheckbox
          v-for="option in options"
          :key="String(option.value)"
          :value="option.value"
          :class="{ 'ls-checkbox-group-field__option--explainable-disabled': option.disabled && reason(option) }"
          :disabled="disabled || (option.disabled && !reason(option))"
          :aria-disabled="option.disabled || undefined"
        >
          <span class="ls-checkbox-group-field__copy">
            <strong>{{ option.label }}</strong>
            <code v-if="option.meta">{{ option.meta }}</code>
            <small v-if="option.description">{{ option.description }}</small>
          </span>
        </NCheckbox>
      </div>
    </NCheckboxGroup>
    <p v-if="error" :id="`${fieldId}-error`" class="ls-checkbox-group-field__error" role="alert">{{ error }}</p>
    <p v-else-if="hint" :id="`${fieldId}-hint`" class="ls-checkbox-group-field__hint">{{ hint }}</p>
  </fieldset>
</template>

<style scoped>
.ls-checkbox-group-field { min-width: 0; margin: 0; padding: 0; border: 0; }
.ls-checkbox-group-field legend { margin-bottom: .45rem; color: var(--ink); font-size: .875rem; font-weight: 650; }
.ls-checkbox-group-field legend span,
.ls-checkbox-group-field__error { color: var(--danger); }
.ls-checkbox-group-field__options { display: grid; gap: 1px; overflow: hidden; background: var(--line); border: 1px solid var(--line); border-radius: 8px; }
.ls-checkbox-group-field__options :deep(.n-checkbox) { min-width: 0; min-height: 60px; align-items: center; padding: .65rem .75rem; background: var(--backoffice-control-surface, white); }
.ls-checkbox-group-field__options :deep(.n-checkbox:hover) { background: var(--cloud); }
.ls-checkbox-group-field__options :deep(.n-checkbox.n-checkbox--disabled) { opacity: 1; }
.ls-checkbox-group-field__copy { min-width: 0; display: grid; grid-template-columns: auto minmax(0, 1fr); gap: .15rem .6rem; }
.ls-checkbox-group-field__copy strong { color: var(--ink); font-size: .875rem; }
.ls-checkbox-group-field__copy code { align-self: center; color: var(--muted-ink); font-size: .72rem; overflow-wrap: anywhere; }
.ls-checkbox-group-field__copy small { grid-column: 1 / -1; color: var(--muted-ink); font-size: .75rem; line-height: 1.45; overflow-wrap: anywhere; }
.ls-checkbox-group-field__option--explainable-disabled { opacity: .5; cursor: not-allowed; }
.ls-checkbox-group-field__error,
.ls-checkbox-group-field__hint { margin: .45rem 0 0; font-size: .8125rem; }
.ls-checkbox-group-field__hint { color: var(--muted-ink); }
@media (max-width: 639px) {
  .ls-checkbox-group-field__options :deep(.n-checkbox) { min-height: 64px; }
  .ls-checkbox-group-field__copy { grid-template-columns: 1fr; gap: .15rem; }
  .ls-checkbox-group-field__copy code,
  .ls-checkbox-group-field__copy small { grid-column: auto; }
}
</style>
