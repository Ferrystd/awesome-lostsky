<script setup lang="ts">
import { Search } from '@lucide/vue'
import { NInput } from 'naive-ui'

withDefaults(defineProps<{
  modelValue?: string
  placeholder?: string
  ariaLabel?: string
  autofocus?: boolean
}>(), {
  modelValue: '',
  placeholder: '搜索',
  ariaLabel: '搜索',
  autofocus: false,
})

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <NInput
    class="ls-search-input"
    :value="modelValue"
    :placeholder="placeholder"
    :autofocus="autofocus"
    :input-props="{ type: 'search', 'aria-label': ariaLabel }"
    clearable
    @update:value="emit('update:modelValue', $event)"
  >
    <template #prefix><Search :size="18" aria-hidden="true" /></template>
  </NInput>
</template>

<style scoped>
.ls-search-input{
  width:100%;
  min-height:44px;
  --n-height:44px!important;
  --n-border-radius:10px!important;
  --n-color:var(--surface, white)!important;
  --n-color-focus:var(--surface, white)!important;
  --n-border:1px solid var(--border, var(--line))!important;
  --n-border-hover:1px solid var(--primary, var(--sky-lost-strong))!important;
  --n-border-focus:1px solid var(--primary, var(--sky-lost-strong))!important;
  --n-box-shadow-focus:0 0 0 3px color-mix(in oklch,var(--primary, var(--sky-lost-strong)),transparent 84%)!important;
}
.ls-search-input :deep(.n-input-wrapper){padding-inline:.8rem}
.ls-search-input :deep(.n-input__prefix){margin-right:.45rem;color:var(--text-secondary, var(--muted-ink))}
.ls-search-input :deep(.n-input__input-el){font-size:.9rem}
</style>
