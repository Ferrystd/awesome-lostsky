<script setup lang="ts">
import LsMarkdownRenderer from '@lostsky/ui/components/LsMarkdownRenderer.vue'
import { useQuery } from '@tanstack/vue-query'
import { ArrowRight } from '@lucide/vue'
import { computed, watch } from 'vue'
import EntityList from '../components/EntityList.vue'
import ProfileMedia from '../components/ProfileMedia.vue'
import PublicDocumentSection from '../components/PublicDocumentSection.vue'
import PublicFields from '../components/PublicFields.vue'
import { displayApi, groupPublicDocuments } from '../lib'

const profile = useQuery({ queryKey: ['display-profile'], queryFn: displayApi.profile })
const documents = useQuery({ queryKey: ['display-documents', 'team'], queryFn: () => displayApi.documents() })
const entities = useQuery({
  queryKey: ['display-entities', 'preview'],
  queryFn: () => displayApi.entities(1, 6),
})
const documentGroups = computed(() => groupPublicDocuments(
  documents.data.value?.list ?? [],
  profile.data.value?.profile.document_tags ?? [],
  '由团队持续维护的公开内容',
))

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
        <p>{{ profile.data.value.profile.description || profile.data.value.settings.homepage_welcome }}</p>
        <a class="hero-link" href="#entities">{{ profile.data.value.settings.homepage_entities_link }} <ArrowRight :size="18" aria-hidden="true" /></a>
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

    <PublicDocumentSection
      v-if="documents.isPending.value || documents.isError.value"
      class="content-section"
      title="公开文档"
      description="由团队持续维护的公开内容"
      :documents="[]"
      :loading="documents.isPending.value"
      :error="documents.isError.value"
      @retry="documents.refetch()"
    />
    <PublicDocumentSection
      v-for="group in documentGroups"
      v-else
      :key="group.key"
      class="content-section"
      :title="group.title"
      :description="group.description"
      :documents="group.documents"
    />

    <section id="entities" class="content-section entity-section">
      <header class="section-heading">
        <h2>{{ profile.data.value.settings.homepage_entities_title }}</h2>
        <p>{{ profile.data.value.settings.homepage_entities_description }}</p>
      </header>
      <div v-if="entities.isPending.value" class="entity-skeleton entity-skeleton-preview"><span v-for="item in 6" :key="item" /></div>
      <div v-else-if="entities.isError.value" class="inline-error"><span>实体列表加载失败。</span><button type="button" @click="entities.refetch()">重试</button></div>
      <EntityList v-else-if="entities.data.value?.list.length" :entities="entities.data.value.list" preview />
      <p v-else class="empty-state">{{ profile.data.value.settings.homepage_entities_empty }}</p>
    </section>
  </template>
</template>
