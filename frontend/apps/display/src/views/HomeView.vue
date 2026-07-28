<script setup lang="ts">
import LsMarkdownRenderer from '@lostsky/ui/components/LsMarkdownRenderer.vue'
import { useQuery } from '@tanstack/vue-query'
import { ArrowLeft, ArrowRight } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import DocumentList from '../components/DocumentList.vue'
import ProfileMedia from '../components/ProfileMedia.vue'
import PublicFields from '../components/PublicFields.vue'
import { displayApi, entityTypeLabel } from '../lib'

const page = ref(1)
const profile = useQuery({ queryKey: ['display-profile'], queryFn: displayApi.profile })
const documents = useQuery({ queryKey: ['display-documents', 'team'], queryFn: () => displayApi.documents() })
const entities = useQuery({
  queryKey: computed(() => ['display-entities', page.value]),
  queryFn: () => displayApi.entities(page.value),
})
const pageCount = computed(() => Math.max(1, Math.ceil((entities.data.value?.total ?? 0) / (entities.data.value?.limit ?? 20))))

watch(() => profile.data.value?.profile.name, (name) => {
  if (name) document.title = `${name} · LostSky`
}, { immediate: true })
</script>

<template>
  <div v-if="profile.isPending.value" class="home-skeleton" aria-label="正在加载团队主页">
    <span /><span /><span />
  </div>
  <section v-else-if="profile.isError.value" class="state-page">
    <p>连接未完成</p>
    <h1 tabindex="-1">团队主页暂时无法打开</h1>
    <span>请检查网络连接，或稍后重新加载。</span>
    <button type="button" @click="profile.refetch()">重新加载</button>
  </section>
  <template v-else-if="profile.data.value">
    <section class="team-hero">
      <div class="hero-copy">
        <div class="identity-line">
          <img v-if="profile.data.value.profile.avatar" :src="profile.data.value.profile.avatar" :alt="`${profile.data.value.profile.name} 头像`" width="72" height="72">
          <span v-else aria-hidden="true">{{ profile.data.value.profile.name.slice(0, 1) }}</span>
          <small>@{{ profile.data.value.slug }}</small>
        </div>
        <h1 tabindex="-1">{{ profile.data.value.profile.name }}</h1>
        <p>{{ profile.data.value.profile.description || '欢迎来到我们的公开主页。' }}</p>
        <a class="hero-link" href="#entities">浏览公开实体 <ArrowRight :size="18" aria-hidden="true" /></a>
      </div>
      <div class="hero-visual" aria-hidden="true">
        <span class="orb orb-one" />
        <span class="orb orb-two" />
        <img
          v-if="profile.data.value.profile.intro_image"
          class="hero-portrait"
          :src="profile.data.value.profile.intro_image"
          alt=""
          width="720"
          height="900"
          fetchpriority="high"
        >
        <strong v-else>{{ profile.data.value.profile.name.slice(0, 1) }}</strong>
      </div>
    </section>

    <section
      v-if="profile.data.value.profile.introduction_markdown
        || profile.data.value.profile.intro_video
        || profile.data.value.fields.length"
      class="story-section"
    >
      <header class="section-heading"><h2>关于团队</h2><p>公开介绍与团队资料</p></header>
      <div class="story-layout">
        <LsMarkdownRenderer
          v-if="profile.data.value.profile.introduction_markdown"
          class="public-markdown"
          :content="profile.data.value.profile.introduction_markdown"
          :resolve-entities="displayApi.resolve"
          :chat-enabled="false"
        />
        <PublicFields :fields="profile.data.value.fields" />
      </div>
      <ProfileMedia :profile="profile.data.value.profile" />
    </section>

    <section v-if="documents.data.value?.list.length || documents.isPending.value || documents.isError.value" class="content-section">
      <header class="section-heading"><h2>公开文档</h2><p>由团队持续维护的公开内容</p></header>
      <div v-if="documents.isPending.value" class="row-skeleton"><span /><span /></div>
      <div v-else-if="documents.isError.value" class="inline-error"><span>文档加载失败。</span><button type="button" @click="documents.refetch()">重试</button></div>
      <DocumentList v-else :documents="documents.data.value?.list ?? []" />
    </section>

    <section id="entities" class="content-section entity-section">
      <header class="section-heading"><h2>公开实体</h2><p>团队成员与虚拟实体</p></header>
      <div v-if="entities.isPending.value" class="entity-skeleton"><span v-for="item in 4" :key="item" /></div>
      <div v-else-if="entities.isError.value" class="inline-error"><span>实体列表加载失败。</span><button type="button" @click="entities.refetch()">重试</button></div>
      <div v-else-if="entities.data.value?.list.length" class="entity-list">
        <RouterLink v-for="entity in entities.data.value.list" :key="entity.slug" :to="`/entity/${entity.slug}`">
          <img v-if="entity.avatar" :src="entity.avatar" :alt="`${entity.name} 头像`" width="88" height="88" loading="lazy">
          <span v-else class="entity-placeholder" aria-hidden="true">{{ entity.name.slice(0, 1) }}</span>
          <span class="entity-copy">
            <small>{{ entityTypeLabel(entity.type) }} · @{{ entity.slug }}</small>
            <strong>{{ entity.name }}</strong>
            <span v-if="entity.roles?.length" class="entity-roles">{{ entity.roles.map(role => role.name).join(' · ') }}</span>
            <p>{{ entity.description || '查看公开资料与文档' }}</p>
          </span>
          <ArrowRight :size="20" aria-hidden="true" />
        </RouterLink>
      </div>
      <p v-else class="empty-state">团队暂时没有公开实体。</p>
      <nav v-if="pageCount > 1" class="pager" aria-label="实体列表分页">
        <button type="button" :disabled="page <= 1" @click="page -= 1"><ArrowLeft :size="17" aria-hidden="true" />上一页</button>
        <span>第 {{ page }} / {{ pageCount }} 页</span>
        <button type="button" :disabled="page >= pageCount" @click="page += 1">下一页<ArrowRight :size="17" aria-hidden="true" /></button>
      </nav>
    </section>
  </template>
</template>
