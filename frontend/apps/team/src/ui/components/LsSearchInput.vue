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
    size="small"
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
  min-height:40px;
  --n-height:40px!important;
  --n-border-radius:10px!important;
}
.ls-search-input :deep(.n-input-wrapper){padding-inline:.8rem}
.ls-search-input :deep(.n-input__prefix){margin-right:.45rem;color:var(--text-secondary, var(--muted-ink))}
.ls-search-input :deep(.n-input__input-el){font-size:.9rem}
@media(max-width:639px){.ls-search-input{min-height:44px;--n-height:44px!important}}
</style>
