<script setup lang="ts">
defineProps<{ message: string }>()
</script>

<template>
  <p class="ls-inline-error" role="alert">{{ message }}</p>
</template>

<style scoped>
.ls-inline-error {
  margin: 0;
  padding: .75rem 1rem;
  color: var(--danger);
  background: color-mix(in oklch, var(--danger), white 94%);
  border-radius: var(--radius-sm);
  font-size: .875rem;
  line-height: 1.5;
}
</style>
