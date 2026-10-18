<script setup lang="ts">
defineSlots<{ label(): unknown; default(): unknown; feedback?(): unknown }>()
</script>

<template>
  <div class="ls-form-field-layout">
    <div class="ls-form-field-layout__row">
      <div class="ls-form-field-layout__label"><slot name="label" /></div>
      <div class="ls-form-field-layout__control"><slot /></div>
      <div v-if="$slots.feedback" class="ls-form-field-layout__feedback"><slot name="feedback" /></div>
    </div>
  </div>
</template>

<style scoped>
.ls-form-field-layout { min-width: 0; container: ls-form-field / inline-size; border-bottom: 1px solid var(--line); }
.ls-form-field-layout__row { display: grid; grid-template-columns: minmax(0, 1fr); grid-template-areas: 'label' 'control' 'feedback'; gap: .5rem 1rem; padding-block: 1rem; align-items: start; }
.ls-form-field-layout__label { grid-area: label; min-width: 0; overflow-wrap: anywhere; }
.ls-form-field-layout__control { grid-area: control; min-width: 0; }
.ls-form-field-layout__feedback { grid-area: feedback; min-width: 0; overflow-wrap: anywhere; }
@container ls-form-field (min-width: 36rem) {
  .ls-form-field-layout__row { grid-template-columns: 9rem minmax(0, 1fr); grid-template-areas: 'label control' 'label feedback'; }
  .ls-form-field-layout__label { padding-top: .6rem; }
}
</style>
