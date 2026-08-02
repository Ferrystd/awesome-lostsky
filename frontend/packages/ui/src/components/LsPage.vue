<script setup lang="ts">
withDefaults(defineProps<{
  as?: 'main' | 'section' | 'div'
  width?: 'wide' | 'content' | 'form'
  id?: string
}>(), { as: 'section', width: 'wide' })
</script>

<template>
  <component :is="as" :id="id" :class="['ls-page', `ls-page--${width}`]"><slot /></component>
</template>

<style scoped>
.ls-page{width:100%;min-width:0;display:grid;gap:1.5rem;margin-inline:auto}.ls-page--wide{max-width:90rem}.ls-page--content{max-width:64rem}.ls-page--form{max-width:42rem}
@media(max-width:639px){.ls-page{gap:1rem}}
</style>
