<script setup lang="ts">
import LsPage from '@lostsky/ui/components/LsPage.vue'
withDefaults(defineProps<{ width?: 'wide' | 'content' | 'form' }>(), { width: 'wide' })
</script>

<template>
  <LsPage :width="width"><slot /></LsPage>
</template>
