<script setup lang="ts">
import { NRadio, NRadioGroup } from 'naive-ui'
import { computed, useId } from 'vue'

export interface LsRadioGroupOption {
  value: string | number
  label: string
  description?: string
}

const props = withDefaults(defineProps<{
  modelValue: string | number | null
  label: string
  options: LsRadioGroupOption[]
  id?: string
  hint?: string
  disabled?: boolean
}>(), { disabled: false })
const emit = defineEmits<{ 'update:modelValue': [value: string | number] }>()
const generatedId = useId()
const fieldId = computed(() => props.id ?? `ls-radio-group-${generatedId}`)
function update(value: string | number) {
  if (!props.disabled) emit('update:modelValue', value)
}
</script>

<template>
  <fieldset class="ls-radio-group-field" :aria-describedby="hint ? `${fieldId}-hint` : undefined">
    <legend :id="`${fieldId}-label`">{{ label }}</legend>
    <p v-if="hint" :id="`${fieldId}-hint`" class="ls-radio-group-field__hint">{{ hint }}</p>
    <NRadioGroup :value="modelValue" :disabled="disabled" :name="fieldId" :aria-labelledby="`${fieldId}-label`" :aria-describedby="hint ? `${fieldId}-hint` : undefined" @update:value="update">
      <div class="ls-radio-group-field__options">
        <NRadio v-for="option in options" :key="String(option.value)" :value="option.value">
          <span class="ls-radio-group-field__copy"><strong>{{ option.label }}</strong><small v-if="option.description">{{ option.description }}</small></span>
        </NRadio>
      </div>
    </NRadioGroup>
  </fieldset>
</template>

<style scoped>
.ls-radio-group-field { min-width: 0; margin: 0; padding: 0; border: 0; }
.ls-radio-group-field legend { padding: 0; color: var(--ink); font-size: .875rem; font-weight: 650; }
.ls-radio-group-field__hint { margin: .3rem 0 .75rem; color: var(--muted-ink); font-size: .8125rem; line-height: 1.55; }
.ls-radio-group-field > :deep(.n-radio-group) { width: 100%; }
.ls-radio-group-field__options { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(14rem, 100%), 1fr)); gap: .75rem; }
.ls-radio-group-field__options :deep(.n-radio) { min-width: 0; min-height: 64px; margin: 0; align-items: flex-start; padding: 1rem; border: 1px solid var(--radio-idle-border, var(--line)); border-radius: var(--radius-md); background: var(--surface); }
.ls-radio-group-field__options :deep(.n-radio--checked) { border-color: var(--primary); background: color-mix(in srgb, var(--primary) 6%, var(--surface)); }
.ls-radio-group-field__options :deep(.n-radio:hover:not(.n-radio--checked)) { border-color: var(--radio-hover-border, var(--primary)); background: var(--radio-hover-surface, color-mix(in srgb, var(--primary) 6%, var(--surface))); }
.ls-radio-group-field__options :deep(.n-radio:focus-within) { outline: 2px solid var(--primary); outline-offset: 2px; }
.ls-radio-group-field__options :deep(.n-radio__label) { min-width: 0; }
.ls-radio-group-field__copy { display: grid; gap: .3rem; overflow-wrap: anywhere; }
.ls-radio-group-field__copy strong { color: var(--ink); font-size: .875rem; line-height: 1.4; }
.ls-radio-group-field__copy small { color: var(--muted-ink); font-size: .8125rem; line-height: 1.5; }
</style>
