<template>
  <div class="ls-form-actions">
    <div v-if="$slots.destructive" class="ls-form-actions__destructive"><slot name="destructive" /></div>
    <slot />
  </div>
</template>

<style scoped>
.ls-form-actions { display: flex; align-items: center; justify-content: flex-end; flex-wrap: wrap; gap: .75rem; }
.ls-form-actions__destructive { display: flex; flex-wrap: wrap; gap: .75rem; margin-inline-end: auto; }
.ls-form-actions :deep(.ls-button) { min-width: min(7rem, 100%); }
@media (max-width: 639px) {
  .ls-form-actions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .ls-form-actions__destructive { grid-column: 1 / -1; margin-inline-end: 0; }
  .ls-form-actions :deep(.ls-button) { min-width: 0; width: 100%; }
  .ls-form-actions > :only-child { grid-column: 1 / -1; }
}
</style>
