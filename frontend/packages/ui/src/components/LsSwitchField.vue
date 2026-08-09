<script setup lang="ts">
import { NSwitch } from 'naive-ui'
import { computed, useId } from 'vue'

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
  checkedText?: string
  uncheckedText?: string
}>(), {
  description: '',
  id: '',
  ariaLabel: '',
  disabledReason: '',
  checkedText: '',
  uncheckedText: '',
})

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()
const generatedId = useId()
const controlId = computed(() => props.id || `ls-switch-field-${generatedId}`)
const labelId = computed(() => `${controlId.value}-label`)
const descriptionId = computed(() => `${controlId.value}-description`)
const reasonId = computed(() => `${controlId.value}-reason`)
const labelTag = computed(() => props.headingLevel ? `h${props.headingLevel}` : 'span')
const unavailable = computed(() => props.disabled || props.readOnly)
const describedBy = computed(() => {
  const ids = []
  if (props.description) ids.push(descriptionId.value)
  if (unavailable.value && props.disabledReason) ids.push(reasonId.value)
  return ids.join(' ') || undefined
})
</script>

<template>
  <div class="ls-switch-field" :data-disabled="unavailable || undefined" :title="unavailable ? disabledReason : undefined">
    <span class="ls-switch-field__copy">
      <component :is="labelTag" :id="labelId" class="ls-switch-field__label">{{ label }}</component>
      <span v-if="description" :id="descriptionId" class="ls-switch-field__description">{{ description }}</span>
      <span v-if="unavailable && disabledReason" :id="reasonId" class="ls-switch-field__reason">{{ disabledReason }}</span>
    </span>
    <NSwitch
      :id="controlId"
      class="ls-switch-field__control"
      :value="modelValue"
      :disabled="unavailable"
      :loading="loading"
      :aria-label="ariaLabel || undefined"
      :aria-labelledby="ariaLabel ? undefined : labelId"
      :aria-describedby="describedBy"
      :aria-readonly="readOnly || undefined"
      @update:value="emit('update:modelValue', $event)"
    >
      <template v-if="checkedText" #checked>{{ checkedText }}</template>
      <template v-if="uncheckedText" #unchecked>{{ uncheckedText }}</template>
    </NSwitch>
  </div>
</template>

<style scoped>
.ls-switch-field{min-width:0;min-height:56px;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:1rem;padding:.75rem;background:var(--cloud);border-radius:9px}.ls-switch-field__copy{min-width:0;display:grid;gap:.2rem}.ls-switch-field__label{margin:0;color:var(--ink);font-size:.875rem;font-weight:650;line-height:1.4}.ls-switch-field__description,.ls-switch-field__reason{color:var(--muted-ink);font-size:.76rem;line-height:1.5;overflow-wrap:anywhere}.ls-switch-field__reason{color:var(--danger)}.ls-switch-field__control{min-height:44px;justify-self:end}.ls-switch-field[data-disabled="true"]{background:color-mix(in oklch,var(--cloud),white 35%)}
@media(max-width:639px){.ls-switch-field{align-items:start}}
</style>
