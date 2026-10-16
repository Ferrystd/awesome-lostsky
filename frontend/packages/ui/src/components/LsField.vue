<script setup lang="ts">
import { useFormFields } from '../form-fields'
import FormFieldLayout from './internal/FormFieldLayout.vue'
defineProps<{ label: string; forId: string; error?: string; hint?: string; required?: boolean; description?: string; readOnly?: boolean }>()
const inFields = useFormFields()
</script>

<template>
  <div class="ls-field" :data-invalid="Boolean(error)">
    <FormFieldLayout v-if="inFields">
      <template #label>
        <component :is="readOnly ? 'span' : 'label'" :id="`${forId}-label`" :for="readOnly ? undefined : forId" class="ls-field__label">{{ label }} <span v-if="required" aria-hidden="true">*</span></component>
        <p v-if="description" class="ls-field__description">{{ description }}</p>
      </template>
      <div class="ls-field__control" :role="readOnly ? 'group' : undefined" :aria-labelledby="readOnly ? `${forId}-label` : undefined"><slot :invalid="Boolean(error)" :described-by="error || hint ? `${forId}-feedback` : undefined" /></div>
      <template v-if="error || hint" #feedback>
        <p v-if="error" :id="`${forId}-feedback`" class="ls-field__error" role="alert">{{ error }}</p>
        <p v-else-if="hint" :id="`${forId}-feedback`" class="ls-field__hint">{{ hint }}</p>
      </template>
    </FormFieldLayout>
    <template v-else>
    <label :for="forId">{{ label }} <span v-if="required" aria-hidden="true">*</span></label>
    <div class="ls-field__control"><slot :invalid="Boolean(error)" :described-by="error || hint ? `${forId}-feedback` : undefined" /></div>
    <p v-if="error" :id="`${forId}-feedback`" class="ls-field__error" role="alert">{{ error }}</p>
    <p v-else-if="hint" :id="`${forId}-feedback`" class="ls-field__hint">{{ hint }}</p>
    </template>
  </div>
</template>

<style scoped>
.ls-field { min-width: 0; display: grid; align-content: start; gap: .45rem; }
.ls-field__control { min-width: 0; width: 100%; }
.ls-field__control :deep(> *) { min-width: 0; width: 100%; max-width: 100%; }
label, .ls-field__label { color: var(--ink); font-size: .875rem; font-weight: 650; }
label span, .ls-field__label span, .ls-field__error { color: var(--danger); }
.ls-field__error, .ls-field__hint { margin: 0; font-size: .8125rem; }
.ls-field__hint { color: var(--muted-ink); }
.ls-field__description { margin: .25rem 0 0; color: var(--muted-ink); font-size: .75rem; line-height: 1.5; }
</style>
