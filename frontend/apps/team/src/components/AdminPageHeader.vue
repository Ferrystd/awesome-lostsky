<script setup lang="ts">
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import type { RouteLocationRaw } from 'vue-router'

defineProps<{
  title: string
  description?: string
  backTo?: RouteLocationRaw
  backLabel?: string
}>()
</script>

<template>
  <LsPageHeader :title="title" :description="description" :back-to="backTo" :back-label="backLabel"><template v-if="$slots.actions" #actions><slot name="actions" /></template></LsPageHeader>
</template>
