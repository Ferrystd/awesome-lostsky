<script setup lang="ts">
import { NList } from 'naive-ui'
</script>

<template>
  <NList bordered class="ls-resource-list"><slot /></NList>
</template>

<style scoped>
.ls-resource-list { min-width: 0; overflow: hidden; border-color: var(--border); border-radius: var(--radius-md); background: var(--panel-material, var(--surface)); box-shadow: var(--panel-elevation, none); }
</style>
