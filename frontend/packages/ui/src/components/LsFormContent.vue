<script setup lang="ts">
import { provide } from 'vue'
import { formFieldsKey } from '../form-fields'
import LsSectionHeader from './LsSectionHeader.vue'

defineOptions({ inheritAttrs: false })
defineProps<{ title?: string; description?: string }>()
defineSlots<{ default(): unknown }>()
provide(formFieldsKey, false)
</script>

<template>
  <div class="ls-form-content">
    <LsSectionHeader v-if="title" :title="title" :description="description" :heading-level="3" />
    <slot />
  </div>
</template>

<style scoped>
.ls-form-content { min-width: 0; display: grid; grid-template-columns: minmax(0, 1fr); gap: 1rem; padding-block: 1rem; }
</style>
