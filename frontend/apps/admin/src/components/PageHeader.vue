<script setup lang="ts">
import { ArrowLeft } from '@lucide/vue'
defineProps<{ title: string; description?: string; back?: string }>()
</script>

<template>
  <header class="page-header">
    <RouterLink v-if="back" :to="back" class="back-link"><ArrowLeft :size="17" />返回</RouterLink>
    <div class="page-header__row">
      <div><h1>{{ title }}</h1><p v-if="description">{{ description }}</p></div>
      <div class="page-actions"><slot /></div>
    </div>
  </header>
</template>
