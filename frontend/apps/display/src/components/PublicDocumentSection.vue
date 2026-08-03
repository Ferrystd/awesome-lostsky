<script setup lang="ts">
import DocumentList from './DocumentList.vue'
import type { DocumentSummary } from '../types'

withDefaults(defineProps<{
  title: string
  description?: string | null
  documents: DocumentSummary[]
  loading?: boolean
  error?: boolean
}>(), {
  description: null,
  loading: false,
  error: false,
})

defineEmits<{ retry: [] }>()
</script>

<template>
  <section v-if="documents.length || loading || error">
    <header class="section-heading">
      <h2>{{ title }}</h2>
      <p v-if="description">{{ description }}</p>
    </header>
    <div v-if="loading" class="row-skeleton"><span /><span /></div>
    <div v-else-if="error" class="inline-error">
      <span>文档加载失败。</span>
      <button type="button" @click="$emit('retry')">重试</button>
    </div>
    <DocumentList v-else :documents="documents" />
  </section>
</template>
