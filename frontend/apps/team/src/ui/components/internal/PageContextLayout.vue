<script setup lang="ts">
defineOptions({ inheritAttrs: false })
withDefaults(defineProps<{ asideLabel?: string }>(), { asideLabel: '辅助信息' })
defineSlots<{ default?(): unknown; aside?(): unknown }>()
</script>

<template>
  <div class="page-context">
    <div class="page-context__columns">
      <div class="page-context__main"><slot /></div>
      <aside class="page-context__aside" :aria-label="asideLabel"><slot name="aside" /></aside>
    </div>
  </div>
</template>

<style scoped>
.page-context { min-width: 0; container: page-context / inline-size; }
.page-context__columns, .page-context__main, .page-context__aside { min-width: 0; display: grid; gap: 1.5rem; align-content: start; overflow-wrap: anywhere; }
.page-context__columns { grid-template-columns: minmax(0, 1fr); align-items: start; }
@container page-context (min-width: 48rem) {
  .page-context__columns { grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); }
}
</style>
