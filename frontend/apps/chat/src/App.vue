<script setup lang="ts">
import { setLucideProps } from '@lucide/vue'
import { onMounted, onUnmounted } from 'vue'
import { RouterView } from 'vue-router'

setLucideProps({})
const expired = () => {
  location.href = `//account.lostsky.work/login?redirect=${encodeURIComponent(location.href)}`
}
onMounted(() => addEventListener('lostsky:auth-expired', expired))
onUnmounted(() => removeEventListener('lostsky:auth-expired', expired))
</script>

<template><RouterView /></template>
