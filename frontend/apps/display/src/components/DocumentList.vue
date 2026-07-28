<script setup lang="ts">
import { ArrowRight, FileText } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import type { DocumentSummary } from '../types'

defineProps<{ documents: DocumentSummary[] }>()
</script>

<template>
  <div v-if="documents.length" class="document-list">
    <RouterLink v-for="document in documents" :key="document.id" :to="`/document/${document.id}`">
      <FileText :size="20" aria-hidden="true" />
      <span><strong>{{ document.title }}</strong><small>更新于 {{ new Date(document.update_time * 1000).toLocaleDateString('zh-CN') }}</small></span>
      <ArrowRight :size="18" aria-hidden="true" />
    </RouterLink>
  </div>
</template>
