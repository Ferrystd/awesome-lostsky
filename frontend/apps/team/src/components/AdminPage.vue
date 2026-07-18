<script setup lang="ts">
withDefaults(defineProps<{ width?: 'wide' | 'content' | 'form' }>(), { width: 'wide' })
</script>

<template>
  <section :class="['admin-page', `admin-page--${width}`]">
    <slot />
  </section>
</template>

<style scoped>
.admin-page{width:100%;min-width:0;display:grid;gap:1.5rem;margin-inline:auto}.admin-page--wide{max-width:90rem}.admin-page--content{max-width:64rem}.admin-page--form{max-width:42rem}
@media(max-width:639px){.admin-page{gap:1rem}}
</style>
