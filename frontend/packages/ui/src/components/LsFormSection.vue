<script setup lang="ts">
import { useId } from 'vue'
import LsPanel from './LsPanel.vue'
import LsSectionHeader from './LsSectionHeader.vue'

const props = withDefaults(defineProps<{
  title: string
  description?: string
  eyebrow?: string
  id?: string
  headingLevel?: 2 | 3 | 4
}>(), { headingLevel: 2 })

const generatedId = useId()
const headingId = props.id ?? `ls-form-section-${generatedId}`
</script>

<template>
  <LsPanel :aria-labelledby="headingId">
    <div class="ls-form-section">
      <LsSectionHeader
        :id="headingId"
        :title="title"
        :description="description"
        :eyebrow="eyebrow"
        :heading-level="headingLevel"
      >
        <template v-if="$slots.aside" #aside><slot name="aside" /></template>
      </LsSectionHeader>
      <slot />
    </div>
  </LsPanel>
</template>

<style scoped>
.ls-form-section { min-width: 0; display: grid; gap: 1rem; }
</style>
