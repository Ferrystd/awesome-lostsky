<script setup lang="ts">
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
defineProps<{ title: string; description?: string; back?: string }>()
</script>

<template>
  <LsPageHeader :title="title" :description="description" :back-to="back"><slot /></LsPageHeader>
</template>
