<template>
  <section class="ls-panel">
    <header v-if="$slots.header" class="ls-panel__header"><slot name="header" /></header>
    <div class="ls-panel__body"><slot /></div>
    <footer v-if="$slots.footer" class="ls-panel__footer"><slot name="footer" /></footer>
  </section>
</template>

<style scoped>
.ls-panel {
  min-width: 0;
  overflow: hidden;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}
.ls-panel__header,
.ls-panel__body,
.ls-panel__footer { padding: 1.25rem; }
.ls-panel__header { border-bottom: 1px solid var(--border); }
.ls-panel__footer { border-top: 1px solid var(--border); }
.ls-panel__header :deep(> :first-child),
.ls-panel__body :deep(> :first-child),
.ls-panel__footer :deep(> :first-child) { margin-top: 0; }
.ls-panel__header :deep(> :last-child),
.ls-panel__body :deep(> :last-child),
.ls-panel__footer :deep(> :last-child) { margin-bottom: 0; }
@media (max-width: 639px) {
  .ls-panel__header,
  .ls-panel__body,
  .ls-panel__footer { padding: 1rem; }
}
</style>
