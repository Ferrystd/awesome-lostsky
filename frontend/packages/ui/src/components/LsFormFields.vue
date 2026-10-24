<script setup lang="ts">
import { provide } from 'vue'
import { formFieldsKey } from '../form-fields'

defineOptions({ inheritAttrs: false })
defineSlots<{ default(): unknown }>()
provide(formFieldsKey, true)
</script>

<template><div class="ls-form-fields"><slot /></div></template>

<style scoped>
.ls-form-fields { min-width: 0; display: grid; grid-template-columns: minmax(0, 1fr); }
</style>
