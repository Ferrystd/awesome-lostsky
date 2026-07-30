<script setup lang="ts">
import { friendlyError } from '@lostsky/api/client'
import { NButton } from 'naive-ui'

defineProps<{ error: unknown }>()
defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="state error-state" role="alert">
    <p>{{ friendlyError(error) }}</p>
    <NButton @click="$emit('retry')">重试</NButton>
  </div>
</template>
