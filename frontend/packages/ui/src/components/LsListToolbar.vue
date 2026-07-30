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
    <span v-if="countLabel" class="ls-list-toolbar__count" aria-live="polite">{{ countLabel }}</span>
  </section>
</template>

<style scoped>
.ls-list-toolbar{min-width:0;display:flex;align-items:center;gap:.75rem;padding:.75rem;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md);transition:border-color var(--motion-fast) var(--ease-standard),box-shadow var(--motion-fast) var(--ease-standard)}
.ls-list-toolbar:focus-within{border-color:color-mix(in oklch,var(--primary),white 48%);box-shadow:0 2px 10px color-mix(in oklch,var(--sky-night),transparent 94%)}
.ls-list-toolbar__search{min-width:14rem;max-width:34rem;flex:1}
.ls-list-toolbar__filters{display:flex;align-items:center;gap:.75rem}
.ls-list-toolbar__count{margin-left:auto;color:var(--text-secondary);font-size:.8rem;font-variant-numeric:tabular-nums;white-space:nowrap}
@media(max-width:639px){.ls-list-toolbar{align-items:stretch;flex-direction:column}.ls-list-toolbar__search{min-width:0;max-width:none}.ls-list-toolbar__filters{display:grid;grid-template-columns:1fr}.ls-list-toolbar__count{margin-left:0}}
</style>
