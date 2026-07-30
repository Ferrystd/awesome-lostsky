<script setup lang="ts">
import { ApiError } from '@lostsky/api/client'
import LsMarkdownRenderer from '@lostsky/ui/components/LsMarkdownRenderer.vue'
import { useQuery } from '@tanstack/vue-query'
import { ArrowLeft } from '@lucide/vue'
import { computed, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import DocumentList from '../components/DocumentList.vue'
import ProfileMedia from '../components/ProfileMedia.vue'
import ProductList from '../components/ProductList.vue'
import PublicFields from '../components/PublicFields.vue'
import { displayApi, entityTypeLabel } from '../lib'

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const detail = useQuery({ queryKey: computed(() => ['display-entity', slug.value]), queryFn: () => displayApi.entity(slug.value) })
const documents = useQuery({ queryKey: computed(() => ['display-documents', slug.value]), queryFn: () => displayApi.documents(slug.value) })
const missing = computed(() => detail.error.value instanceof ApiError && detail.error.value.status === 404)

watch(() => detail.data.value?.profile.name, (name) => {
  if (name) document.title = `${name} · LostSky`
}, { immediate: true })
</script>

<template>
  <section v-if="detail.isPending.value" class="detail-skeleton" aria-label="正在加载实体资料"><span /><span /><span /></section>
  <section v-else-if="detail.isError.value" class="state-page">
    <p>{{ missing ? '404' : '连接未完成' }}</p>
    <h1 tabindex="-1">{{ missing ? '该实体没有公开资料' : '实体资料暂时无法打开' }}</h1>
    <span>{{ missing ? '资料可能已被隐藏、停用或移除。' : '请检查网络连接后重试。' }}</span>
    <RouterLink v-if="missing" to="/"><ArrowLeft :size="18" aria-hidden="true" />返回团队主页</RouterLink>
    <button v-else type="button" @click="detail.refetch()">重新加载</button>
  </section>
  <article v-else-if="detail.data.value" class="subject-page">
    <header class="subject-hero" :class="{ 'subject-hero-fallback': !detail.data.value.profile.intro_image }">
      <img
        v-if="detail.data.value.profile.intro_image"
        class="subject-backdrop"
        :src="detail.data.value.profile.intro_image"
        :alt="`${detail.data.value.profile.name} 的人物展示图`"
        width="1600"
        height="900"
        fetchpriority="high"
      >
      <div class="subject-hero-shade" aria-hidden="true" />
      <div class="subject-hero-inner">
        <RouterLink class="back-link" to="/"><ArrowLeft :size="18" aria-hidden="true" />返回团队主页</RouterLink>
        <div class="subject-identity">
          <img v-if="!detail.data.value.profile.intro_image && detail.data.value.profile.avatar" class="subject-avatar" :src="detail.data.value.profile.avatar" :alt="`${detail.data.value.profile.name} 头像`" width="120" height="120">
          <span v-else-if="!detail.data.value.profile.intro_image" class="subject-avatar-fallback" aria-hidden="true">{{ detail.data.value.profile.name.slice(0, 1) }}</span>
          <div class="subject-copy">
            <small>{{ entityTypeLabel(detail.data.value.type) }} · @{{ detail.data.value.slug }}</small>
            <h1 tabindex="-1">{{ detail.data.value.profile.name }}</h1>
            <ul v-if="detail.data.value.roles?.length" class="public-roles" aria-label="公开角色">
              <li v-for="role in detail.data.value.roles" :key="role.name">
                <strong>{{ role.name }}</strong>
                <span v-if="role.description">{{ role.description }}</span>
              </li>
            </ul>
            <p>{{ detail.data.value.profile.description || '公开实体资料' }}</p>
          </div>
        </div>
      </div>
    </header>
    <div class="subject-content">
      <ProfileMedia :profile="detail.data.value.profile" />
      <section v-if="detail.data.value.profile.introduction_markdown" class="reading-section">
        <LsMarkdownRenderer class="public-markdown" :content="detail.data.value.profile.introduction_markdown" :resolve-entities="displayApi.resolve" :chat-enabled="false" />
      </section>
      <section v-if="detail.data.value.fields.length" class="reading-section">
        <header class="section-heading"><h2>公开资料</h2><p>由团队维护的信息</p></header>
        <PublicFields :fields="detail.data.value.fields" />
      </section>
      <section v-if="detail.data.value.products?.length" class="reading-section">
        <header class="section-heading"><h2>商品</h2><p>由该实体提供的已上架商品</p></header>
        <ProductList :products="detail.data.value.products" />
      </section>
      <section v-if="documents.data.value?.list.length || documents.isPending.value || documents.isError.value" class="reading-section">
        <header class="section-heading"><h2>公开文档</h2><p>与该实体相关的内容</p></header>
        <div v-if="documents.isPending.value" class="row-skeleton"><span /><span /></div>
        <div v-else-if="documents.isError.value" class="inline-error"><span>文档加载失败。</span><button type="button" @click="documents.refetch()">重试</button></div>
        <DocumentList v-else :documents="documents.data.value?.list ?? []" />
      </section>
    </div>
  </article>
</template>
