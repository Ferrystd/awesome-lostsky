<script setup lang="ts">
import { setLucideProps } from '@lucide/vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import TeamShell from './components/TeamShell.vue'
import AdminPage from './components/AdminPage.vue'
import { computed, onMounted, onUnmounted } from 'vue'
setLucideProps({})
const route = useRoute(); const router = useRouter()
const pageWidth = computed<'wide' | 'content' | 'form'>(() => ['content', 'form'].includes(String(route.meta.pageWidth)) ? route.meta.pageWidth as 'content' | 'form' : 'wide')
const expired = () => { location.href = `//account.lostsky.work/login?redirect=${encodeURIComponent(location.href)}` }
onMounted(() => addEventListener('lostsky:auth-expired', expired)); onUnmounted(() => removeEventListener('lostsky:auth-expired', expired))
</script>
<template><TeamShell v-if="!route.meta.public"><AdminPage :width="pageWidth"><RouterView /></AdminPage></TeamShell><RouterView v-else /></template>
