<script setup lang="ts">
import { setLucideProps } from '@lucide/vue'
import { RouterView, useRouter } from 'vue-router'
import { onMounted, onUnmounted } from 'vue'
setLucideProps({})
const router = useRouter()
const expired = () => router.replace({ path: '/login', query: { expired: '1' } })
onMounted(() => addEventListener('lostsky:auth-expired', expired))
onUnmounted(() => removeEventListener('lostsky:auth-expired', expired))
</script>
<template><RouterView /></template>
