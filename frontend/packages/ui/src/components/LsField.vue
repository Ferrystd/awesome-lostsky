<script setup lang="ts">
defineProps<{ label: string; forId: string; error?: string; hint?: string; required?: boolean }>()
</script>

<template>
  <div class="ls-field" :data-invalid="Boolean(error)">
    <label :for="forId">{{ label }} <span v-if="required" aria-hidden="true">*</span></label>
    <slot :invalid="Boolean(error)" />
    <p v-if="error" class="ls-field__error" role="alert">{{ error }}</p>
    <p v-else-if="hint" class="ls-field__hint">{{ hint }}</p>
  </div>
</template>

<style scoped>
.ls-field { display: grid; gap: .45rem; }
label { color: var(--ink); font-size: .875rem; font-weight: 650; }
label span, .ls-field__error { color: var(--danger); }
.ls-field__error, .ls-field__hint { margin: 0; font-size: .8125rem; }
.ls-field__hint { color: var(--muted-ink); }
</style>
