<script setup lang="ts">
import { NInput } from 'naive-ui'

defineOptions({ inheritAttrs: false })
const model = defineModel<string | number>()
const props = defineProps<{ invalid?: boolean; type?: string }>()
</script>

<template>
  <NInput
    class="ls-input"
    :value="model == null ? '' : String(model)"
    :type="type === 'password' ? 'password' : 'text'"
    :status="invalid ? 'error' : undefined"
    :input-props="{ ...$attrs, type: props.type || 'text', 'aria-invalid': invalid || undefined }"
    @update:value="model = $event"
  />
</template>

<style scoped>
.ls-input { width: 100%; }
</style>
