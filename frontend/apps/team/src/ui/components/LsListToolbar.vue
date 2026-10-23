<script setup lang="ts">
import LsSearchInput from "./LsSearchInput.vue";

withDefaults(
  defineProps<{
    modelValue?: string;
    placeholder?: string;
    ariaLabel?: string;
    countLabel?: string;
    searchable?: boolean;
  }>(),
  {
    modelValue: "",
    placeholder: "搜索",
    ariaLabel: "搜索列表",
    countLabel: "",
    searchable: true,
  },
);

const emit = defineEmits<{ "update:modelValue": [value: string] }>();
</script>

<template>
  <section
    :class="[
      'ls-list-toolbar',
      { 'ls-list-toolbar--filters-only': !searchable },
    ]"
    role="search"
  >
    <LsSearchInput
      v-if="searchable"
      class="ls-list-toolbar__search"
      :model-value="modelValue"
      :placeholder="placeholder"
      :aria-label="ariaLabel"
      @update:model-value="emit('update:modelValue', $event)"
    />
    <div v-if="$slots.filters" class="ls-list-toolbar__filters">
      <slot name="filters" />
    </div>
    <div v-if="$slots.actions" class="ls-list-toolbar__actions">
      <slot name="actions" />
    </div>
    <span v-if="countLabel" class="ls-list-toolbar__count" aria-live="polite">{{
      countLabel
    }}</span>
  </section>
</template>

<style scoped>
.ls-list-toolbar { min-width: 0; display: flex; flex-wrap: wrap; align-items: center; gap: .75rem 1rem; }
.ls-list-toolbar__search { min-width: min(16rem, 100%); max-width: 28rem; flex: 0 1 24rem; }
.ls-list-toolbar__filters, .ls-list-toolbar__actions { min-width: 0; max-width: 100%; display: flex; flex-wrap: wrap; align-items: center; gap: .5rem; }
.ls-list-toolbar--filters-only .ls-list-toolbar__filters { flex: 1 1 auto; }
.ls-list-toolbar__filters :deep(.n-select) { width: 8rem; min-width: 8rem; }
.ls-list-toolbar__filters :deep(.n-base-selection) { --n-height: 40px !important; }
.ls-list-toolbar__filters :deep(.n-base-selection-label) { font-size: .875rem; }
.ls-list-toolbar__count { min-width: 0; margin-left: auto; color: var(--text-secondary); font-size: .8125rem; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
@media (max-width: 639px) {
  .ls-list-toolbar__search { width: 100%; min-width: 0; max-width: none; flex: 1 0 100%; }
  .ls-list-toolbar__filters :deep(.n-select) { width: 8rem; min-width: 0; max-width: 100%; }
  .ls-list-toolbar__filters :deep(.n-base-selection) { --n-height: 44px !important; }
  .ls-list-toolbar__actions :deep(.n-button) { width: 100%; }
}
</style>
