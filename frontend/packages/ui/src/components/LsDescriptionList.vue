<template>
  <div class="ls-description-list-container"><dl class="ls-description-list"><slot /></dl></div>
</template>

<style scoped>
.ls-description-list-container { min-width: 0; container: description-list / inline-size; }
.ls-description-list { display: grid; grid-template-columns: minmax(7rem, .35fr) minmax(0, 1fr); margin: 0; }
.ls-description-list :deep(dt),
.ls-description-list :deep(dd) { min-width: 0; margin: 0; padding: .75rem 1rem; border-bottom: 1px solid var(--line); overflow-wrap: anywhere; }
.ls-description-list :deep(dt) { color: var(--muted-ink); font-size: .8rem; }
.ls-description-list :deep(dd) { color: var(--ink); }
.ls-description-list :deep(dt:last-of-type),
.ls-description-list :deep(dd:last-of-type) { border-bottom: 0; }
@container description-list (max-width: 28rem) {
  .ls-description-list { grid-template-columns: 1fr; }
  .ls-description-list :deep(dt) { padding-bottom: .125rem; border-bottom: 0; }
  .ls-description-list :deep(dd) { padding-top: .125rem; }
}
</style>
