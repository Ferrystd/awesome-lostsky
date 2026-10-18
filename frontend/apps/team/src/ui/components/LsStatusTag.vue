<script setup lang="ts">
import { NTag } from 'naive-ui'

withDefaults(defineProps<{
  label: string
  type?: 'default' | 'success' | 'warning' | 'error' | 'info'
}>(), { type: 'default' })
</script>

<template>
  <NTag class="ls-status-tag" size="small" :bordered="false" :type="type">{{ label }}</NTag>
</template>
