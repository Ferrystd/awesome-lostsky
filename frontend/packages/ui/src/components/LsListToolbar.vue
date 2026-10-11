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
.ls-list-toolbar {
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  transition: border-color var(--motion-fast) var(--ease-standard);
}
.ls-list-toolbar:focus-within {
  border-color: color-mix(in oklch, var(--primary), white 48%);
}
.ls-list-toolbar__search {
  min-width: min(16rem, 100%);
  max-width: 28rem;
  flex: 1 1 28rem;
}
.ls-list-toolbar__filters {
  min-width: 0;
  max-width: 100%;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}
.ls-list-toolbar--filters-only .ls-list-toolbar__filters {
  flex: 1 1 auto;
  flex-wrap: wrap;
}
.ls-list-toolbar__filters :deep(.n-select) {
  width: 10rem;
  min-width: 10rem;
}
.ls-list-toolbar__filters :deep(.n-base-selection) {
  --n-height: 40px !important;
}
.ls-list-toolbar__filters :deep(.n-base-selection-label) {
  font-size: 0.875rem;
}
.ls-list-toolbar__actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.ls-list-toolbar__count {
  margin-left: auto;
  color: var(--text-secondary);
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
@media (max-width: 639px) {
  .ls-list-toolbar {
    align-items: stretch;
    flex-direction: column;
    padding: 0.75rem;
  }
  .ls-list-toolbar__search {
    width: 100%;
    min-width: 0;
    max-width: none;
    flex: 0 0 auto;
  }
  .ls-list-toolbar__filters {
    display: grid;
    grid-template-columns: 1fr;
  }
  .ls-list-toolbar__filters :deep(.n-select) {
    width: 100%;
    min-width: 0;
  }
  .ls-list-toolbar__filters :deep(.n-base-selection) {
    --n-height: 44px !important;
  }
  .ls-list-toolbar__actions {
    display: grid;
    grid-template-columns: 1fr;
  }
  .ls-list-toolbar__actions :deep(.n-button),
  .ls-list-toolbar__actions :deep(.ls-button) {
    width: 100%;
  }
  .ls-list-toolbar__count {
    margin-left: 0;
  }
}
.ls-list-toolbar--embedded { padding: 0; background: transparent; border: 0; border-radius: 0; }
.ls-list-toolbar--embedded .ls-list-toolbar__search { min-width: min(12rem, 100%); max-width: none; flex: 1 1 12rem; }
.ls-list-toolbar--embedded .ls-list-toolbar__filters :deep(.n-select) { width: 8rem; min-width: 8rem; }
@media (max-width: 639px) {
  .ls-list-toolbar--embedded { flex-direction: row; align-items: center; }
  .ls-list-toolbar--embedded .ls-list-toolbar__search { flex: 1 0 100%; }
  .ls-list-toolbar--embedded .ls-list-toolbar__filters, .ls-list-toolbar--embedded .ls-list-toolbar__actions { display: flex; }
  .ls-list-toolbar--embedded .ls-list-toolbar__count { margin-left: auto; }
}
</style>
