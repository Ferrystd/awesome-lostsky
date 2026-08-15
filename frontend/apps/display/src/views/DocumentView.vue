<script setup lang="ts">
import { ApiError } from '@lostsky/api/client'
import LsMarkdownRenderer from '@lostsky/ui/components/LsMarkdownRenderer.vue'
import { useQuery } from '@tanstack/vue-query'
import { ArrowLeft } from '@lucide/vue'
import { computed, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { displayApi, entityTypeLabel } from '../lib'

const route = useRoute()
const id = computed(() => Number(route.params.id ?? 0))
const query = useQuery({ queryKey: computed(() => ['display-document', id.value]), queryFn: () => displayApi.document(id.value) })
const missing = computed(() => query.error.value instanceof ApiError && query.error.value.status === 404)
const backTo = computed(() => query.data.value?.entity.type === 'team' ? '/' : `/entity/${query.data.value?.entity.slug ?? ''}`)
const updatedAt = computed(() => new Date((query.data.value?.update_time ?? 0) * 1000))
const updatedLabel = computed(() => updatedAt.value.toLocaleDateString('zh-CN'))
const updatedDateTime = computed(() => updatedAt.value.toISOString())

watch(() => query.data.value?.title, (title) => {
  if (title) document.title = `${title} · LostSky`
}, { immediate: true })
</script>

<template>
  <section v-if="query.isPending.value" class="detail-skeleton" aria-label="正在加载公开文档"><span /><span /><span /></section>
  <section v-else-if="query.isError.value" class="state-page">
    <p>{{ missing ? '404' : '连接未完成' }}</p>
    <h1 tabindex="-1">{{ missing ? '该文档不可公开查看' : '文档暂时无法打开' }}</h1>
    <span>{{ missing ? '文档可能已被隐藏、移除或更改可见范围。' : '请检查网络连接后重试。' }}</span>
    <RouterLink v-if="missing" to="/"><ArrowLeft :size="18" aria-hidden="true" />返回团队主页</RouterLink>
    <button v-else type="button" @click="query.refetch()">重新加载</button>
  </section>
  <article v-else-if="query.data.value" class="document-page">
    <div class="document-shell">
      <RouterLink class="back-link" :to="backTo"><ArrowLeft :size="18" aria-hidden="true" />返回{{ query.data.value.entity.type === 'team' ? '团队主页' : '实体（Entity）资料' }}</RouterLink>
      <header class="document-header">
        <RouterLink class="document-subject" :to="backTo">
          {{ entityTypeLabel(query.data.value.entity.type) }} · @{{ query.data.value.entity.slug }}
        </RouterLink>
        <h1 tabindex="-1">{{ query.data.value.title }}</h1>
        <div class="document-meta">
          <span>公开文档</span>
          <time :datetime="updatedDateTime">更新于 {{ updatedLabel }}</time>
        </div>
      </header>
      <section class="document-reading" aria-label="文档正文">
        <LsMarkdownRenderer class="public-markdown document-content" :content="query.data.value.content" :resolve-entities="displayApi.resolve" :chat-enabled="false" />
      </section>
    </div>
  </article>
</template>
