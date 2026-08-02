<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import { chatWorkspaceUrl } from '@lostsky/shared/navigation'
import LsMarkdownRenderer from '@lostsky/ui/components/LsMarkdownRenderer.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import { useQuery } from '@tanstack/vue-query'
import { BookOpen, MessageCircleMore } from '@lucide/vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AdminPageHeader from '../components/AdminPageHeader.vue'
import EntityFieldsCard, { type EntityFieldDefinition } from '../components/EntityFieldsCard.vue'
import { resolveEntities } from '../lib/markdown'

const route = useRoute()
const memberId = computed(() => Number(route.query.id))
const member = useQuery({
  queryKey: computed(() => ['member', memberId.value]),
  queryFn: () => api.get<Record<string, unknown>>('/member/get', { member_id: memberId.value }),
  enabled: computed(() => memberId.value > 0),
})
const profile = computed(() => member.data.value?.profile as Record<string, unknown> | undefined)
const chatUrl = computed(() => {
  const slug = String(member.data.value?.slug ?? '')
  return slug && Number(member.data.value?.is_blocked) !== 1
    ? chatWorkspaceUrl('/new', { participant: slug })
    : ''
})
const introduction = computed(() => String(profile.value?.introduction_markdown ?? member.data.value?.introduction_markdown ?? ''))
const fieldValues = computed(() => (member.data.value?.fieldValues ?? []) as Record<string, unknown>[])
const fields = computed(() => {
  const unique = new Map<number, EntityFieldDefinition>()
  for (const value of fieldValues.value) {
    const field = value.field as EntityFieldDefinition | undefined
    if (field?.id) unique.set(Number(field.id), field)
  }
  return [...unique.values()]
})
</script>

<template>
  <div class="member-detail">
    <AdminPageHeader
      title="成员详情"
      :description="memberId ? `成员 #${memberId} 的公开介绍和团队对象字段预览。` : '缺少成员编号'"
      back-to="/members"
      back-label="返回成员列表"
    >
      <template #actions>
        <a v-if="chatUrl" class="chat-link" :href="chatUrl"><MessageCircleMore :size="18" />发起对话</a>
        <RouterLink v-if="member.data.value?.entity_id" class="document-link" :to="`/docs?entity_id=${member.data.value.entity_id}`">
          <BookOpen :size="18" />查看文档
        </RouterLink>
      </template>
    </AdminPageHeader>

    <LsInlineError v-if="member.isError.value" :message="friendlyError(member.error.value)" />
    <section v-else-if="member.data.value" class="identity">
      <div class="avatar">
        <img v-if="profile?.avatar || member.data.value.avatar" :src="String(profile?.avatar || member.data.value.avatar)" alt="成员头像">
        <span v-else>{{ String(profile?.nickname || member.data.value.nickname || '成').slice(0, 1) }}</span>
      </div>
      <div>
        <small>USER #{{ member.data.value.user_id }}</small>
        <h2>{{ profile?.nickname || member.data.value.nickname || `成员 #${memberId}` }}</h2>
        <p>{{ profile?.description || member.data.value.description || '暂无成员简介' }}</p>
      </div>
      <strong>{{ Number(member.data.value.is_blocked) ? '已封禁' : '正常' }}</strong>
    </section>

    <section v-if="introduction" class="introduction" aria-labelledby="member-introduction-title">
      <h2 id="member-introduction-title">详细介绍</h2>
      <LsMarkdownRenderer :content="introduction" :resolve-entities="resolveEntities" />
    </section>

    <EntityFieldsCard :fields="fields" :stored-values="fieldValues" mode="readonly" />
  </div>
</template>

<style scoped>
.member-detail{display:grid;gap:1.25rem}.chat-link,.document-link{min-height:44px;display:inline-flex;align-items:center;justify-content:center;gap:.45rem;padding:0 .875rem;border-radius:8px;text-decoration:none}.chat-link{color:white;background:var(--sky-lost-strong);font-weight:650}.document-link{color:var(--sky-lost-strong);background:white;border:1px solid var(--line)}.identity{display:grid;grid-template-columns:64px minmax(0,1fr) auto;align-items:center;gap:1rem;padding:1.25rem;color:white;background:var(--sky-night);border-radius:12px}.avatar{width:64px;height:64px;display:grid;place-items:center;overflow:hidden;background:var(--sky-lost-strong);border-radius:10px;font-size:1.4rem;font-weight:700}.avatar img{width:100%;height:100%;object-fit:cover}.identity small{color:var(--sky-lost)}.identity h2,.identity p{margin:0}.identity p{margin-top:.3rem;color:oklch(.74 .012 210)}.identity>strong{padding:.3rem .55rem;color:var(--sky-night);background:var(--afterglow);border-radius:7px;font-size:.78rem}.introduction{display:grid;gap:1rem;padding:1.25rem;background:white;border:1px solid var(--line);border-radius:12px}.introduction>h2{margin:0;font-size:1rem}.feedback{padding:.875rem;background:white;border:1px solid var(--line);border-radius:8px}.error{color:var(--danger)}
@media(max-width:639px){.identity{grid-template-columns:56px minmax(0,1fr)}.avatar{width:56px;height:56px}.identity>strong{grid-column:1/-1;justify-self:start}}
</style>
