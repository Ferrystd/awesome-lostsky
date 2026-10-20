<script setup lang="ts">
import LsSearchInput from "./LsSearchInput.vue";

withDefaults(
  defineProps<{
    modelValue?: string;
    placeholder?: string;
    ariaLabel?: string;
    countLabel?: string;
    searchable?: boolean;
    embedded?: boolean;
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
      { 'ls-list-toolbar--filters-only': !searchable, 'ls-list-toolbar--embedded': embedded },
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
.ls-list-toolbar { min-width: 0; display: flex; align-items: center; gap: .5rem; padding: .5rem .75rem; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); transition: border-color var(--motion-fast) var(--ease-standard); }
.ls-list-toolbar:focus-within { border-color: color-mix(in oklch, var(--primary), white 48%); }
.ls-list-toolbar__search { min-width: 0; max-width: 28rem; flex: 1 1 16rem; }
.ls-list-toolbar__filters, .ls-list-toolbar__actions { min-width: 0; max-width: 45%; display: flex; align-items: center; gap: .5rem; overflow-x: auto; }
.ls-list-toolbar__filters { flex: 0 1 10rem; }
.ls-list-toolbar__filters :deep(.n-select) { width: 8rem; min-width: 6rem; flex: 1 0 6rem; }
.ls-list-toolbar__filters :deep(.n-select:only-child) { min-width: 0; flex-shrink: 1; }
.ls-list-toolbar__filters :deep(.n-base-selection) { --n-height: 40px !important; }
.ls-list-toolbar__filters :deep(.n-base-selection-label) { font-size: .875rem; }
.ls-list-toolbar__actions { flex: 0 1 auto; }
.ls-list-toolbar__count { min-width: 0; max-width: 25%; margin-left: auto; flex: 0 0 auto; color: var(--text-secondary); font-size: .8125rem; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.ls-list-toolbar--filters-only .ls-list-toolbar__filters { max-width: 100%; flex: 1 1 auto; }
.ls-list-toolbar--embedded { padding: 0; background: transparent; border: 0; border-radius: 0; }
@media (max-width: 639px) {
  .ls-list-toolbar__filters { flex-basis: 7rem; }
  .ls-list-toolbar__filters :deep(.n-base-selection) { --n-height: 44px !important; }
}
</style>
