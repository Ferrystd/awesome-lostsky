<script setup lang="ts">
defineOptions({ inheritAttrs: false })
const model = defineModel<string | number>()
defineProps<{ invalid?: boolean }>()
</script>

<template>
  <input v-model="model" class="ls-input" :aria-invalid="invalid || undefined" v-bind="$attrs" />
</template>

<style scoped>
.ls-input { width: 100%; min-height: 46px; padding: .7rem .8rem; color: var(--ink); background: white; border: 1px solid color-mix(in oklch, var(--line), var(--ink) 12%); border-radius: var(--radius-sm); transition: border-color var(--motion-fast) var(--ease-standard), box-shadow var(--motion-fast) var(--ease-standard); }
.ls-input::placeholder { color: color-mix(in oklch, var(--muted-ink), var(--ink) 18%); opacity: 1; }
.ls-input:hover { border-color: color-mix(in oklch, var(--line), var(--ink) 28%); }
.ls-input:focus { border-color: var(--sky-lost-strong); box-shadow: 0 0 0 3px color-mix(in oklch, var(--sky-lost), transparent 78%); outline: none; }
.ls-input[aria-invalid='true'] { border-color: var(--danger); }
</style>
