<script setup lang="ts">
import { setLucideProps } from '@lucide/vue'
import { RouterView, useRoute } from 'vue-router'
import TeamShell from './components/TeamShell.vue'
import AdminPage from './components/AdminPage.vue'
import { computed } from 'vue'
setLucideProps({})
const route = useRoute()
const pageWidth = computed<'wide' | 'content' | 'form'>(() => ['content', 'form'].includes(String(route.meta.pageWidth)) ? route.meta.pageWidth as 'content' | 'form' : 'wide')
</script>
<template><TeamShell v-if="!route.meta.public"><AdminPage :width="pageWidth"><RouterView /></AdminPage></TeamShell><RouterView v-else /></template>
