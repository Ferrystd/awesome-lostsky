<script setup lang="ts">
import { onErrorCaptured, ref, watch } from 'vue'
import LsAsyncState from './LsAsyncState.vue'

const props = defineProps<{ resetKey: string }>()
const failed = ref(false)
watch(() => props.resetKey, () => { failed.value = false })
onErrorCaptured((error) => {
  failed.value = true
  console.error('Route render failed', error)
  return false
})
</script>

<template>
  <LsAsyncState v-if="failed" state="error" title="页面暂时无法显示" description="页面框架仍可使用，请稍后重新进入此页面。" />
  <slot v-else />
</template>
