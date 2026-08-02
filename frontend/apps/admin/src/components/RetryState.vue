<script setup lang="ts">
import { friendlyError } from '@lostsky/api/client'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'

defineProps<{ error: unknown }>()
</script>

<template>
  <LsAsyncState state="error" title="暂时无法读取" :description="friendlyError(error)" />
</template>
