<script setup lang="ts">
import LsSearchInput from './LsSearchInput.vue'

withDefaults(defineProps<{
  modelValue?: string
  placeholder?: string
  ariaLabel?: string
  countLabel?: string
}>(), {
  modelValue: '',
  placeholder: '搜索',
  ariaLabel: '搜索列表',
  countLabel: '',
})

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <section class="ls-list-toolbar" role="search">
    <LsSearchInput
      class="ls-list-toolbar__search"
      :model-value="modelValue"
      :placeholder="placeholder"
      :aria-label="ariaLabel"
      @update:model-value="emit('update:modelValue', $event)"
    />
    <div v-if="$slots.filters" class="ls-list-toolbar__filters"><slot name="filters" /></div>
    <div v-if="$slots.actions" class="ls-list-toolbar__actions"><slot name="actions" /></div>
    <span v-if="countLabel" class="ls-list-toolbar__count" aria-live="polite">{{ countLabel }}</span>
  </section>
</template>

<style scoped>
.ls-list-toolbar{min-width:0;display:flex;align-items:center;gap:.5rem;padding:.5rem .75rem;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md);transition:border-color var(--motion-fast) var(--ease-standard)}
.ls-list-toolbar:focus-within{border-color:color-mix(in oklch,var(--primary),white 48%)}
.ls-list-toolbar__search{min-width:16rem;max-width:28rem;flex:1 1 28rem}
.ls-list-toolbar__filters{min-width:0;display:flex;align-items:center;gap:.5rem}
.ls-list-toolbar__filters :deep(.n-select){width:10rem;min-width:10rem}
.ls-list-toolbar__filters :deep(.n-base-selection){--n-height:40px!important}
.ls-list-toolbar__filters :deep(.n-base-selection-label){font-size:.875rem}
.ls-list-toolbar__actions{display:flex;align-items:center;gap:.5rem}
.ls-list-toolbar__count{margin-left:auto;color:var(--text-secondary);font-size:.8125rem;font-variant-numeric:tabular-nums;white-space:nowrap}
@media(max-width:639px){.ls-list-toolbar{align-items:stretch;flex-direction:column;padding:.75rem}.ls-list-toolbar__search{width:100%;min-width:0;max-width:none;flex:0 0 auto}.ls-list-toolbar__filters{display:grid;grid-template-columns:1fr}.ls-list-toolbar__filters :deep(.n-select){width:100%;min-width:0}.ls-list-toolbar__filters :deep(.n-base-selection){--n-height:44px!important}.ls-list-toolbar__actions{display:grid;grid-template-columns:1fr}.ls-list-toolbar__actions :deep(.n-button),.ls-list-toolbar__actions :deep(.ls-button){width:100%}.ls-list-toolbar__count{margin-left:0}}
</style>
