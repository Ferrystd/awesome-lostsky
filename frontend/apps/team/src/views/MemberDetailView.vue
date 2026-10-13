<script setup lang="ts">
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsSectionHeader from '@lostsky/ui/components/LsSectionHeader.vue'
import { api, auth, friendlyError } from '@lostsky/api/client'
import { chatWorkspaceUrl } from '@lostsky/shared/navigation'
import LsMarkdownRenderer from '@lostsky/ui/components/LsMarkdownRenderer.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import { useQuery } from '@tanstack/vue-query'
import { BookOpen, MessageCircleMore } from '@lucide/vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import LsDetailPage from '@lostsky/ui/components/LsDetailPage.vue'
import MemberSelfDeparture from '../components/MemberSelfDeparture.vue'
import EntityFieldsCard, { type EntityFieldDefinition } from '../components/EntityFieldsCard.vue'
import { resolveEntities } from '../lib/markdown'
import { memberStatusLabel } from '../lib/memberStatus'

const route = useRoute()
const memberId = computed(() => Number(route.query.id))
const isCurrentMember = computed(() => auth.entity()?.type === 'teamMember' && auth.entity()?.id === memberId.value)
const member = useQuery({
  queryKey: computed(() => ['member', memberId.value]),
  queryFn: () => api.get<Record<string, unknown>>('/member/get', { member_id: memberId.value }),
  enabled: computed(() => memberId.value > 0),
})
const profile = computed(() => member.data.value?.profile as Record<string, unknown> | undefined)
const inviter = computed(() => member.data.value?.inviter as Record<string, unknown> | null | undefined)
const chatUrl = computed(() => {
  const slug = String(member.data.value?.slug ?? '')
  return slug && member.data.value?.is_valid !== false
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
function joinedAt(value: unknown) {
  const timestamp = Number(value)
  return timestamp > 0
    ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'long', timeStyle: 'short' }).format(timestamp * 1000)
    : '—'
}
</script>

<template>
  <LsDetailPage
      title="成员详情"
      :description="memberId ? `成员 #${memberId} 的公开介绍和团队对象字段预览。` : '缺少成员编号'"
      back-to="/members"
      back-label="返回成员列表"
    >
      <template #actions>
        <MemberSelfDeparture v-if="isCurrentMember && member.data.value?.status_code === 'active'" />
        <LsPageLink v-if="chatUrl" :icon="MessageCircleMore" label="发起对话" :href="chatUrl" />
        <LsPageLink v-if="member.data.value?.entity_id" :icon="BookOpen" label="查看文档" :to="`/docs?entity_id=${member.data.value.entity_id}`" />
      </template>
    <div class="member-detail">

      <LsInlineError v-if="member.isError.value" :message="friendlyError(member.error.value)" />
      <LsPanel v-else-if="member.data.value"><section class="identity">
        <div class="avatar">
          <img v-if="profile?.avatar || member.data.value.avatar" :src="String(profile?.avatar || member.data.value.avatar)" alt="成员头像">
          <span v-else>{{ String(profile?.nickname || member.data.value.nickname || '成').slice(0, 1) }}</span>
        </div>
        <div>
          <small>USER #{{ member.data.value.user_id }}</small>
          <h2>{{ profile?.nickname || member.data.value.nickname || `成员 #${memberId}` }}</h2>
          <p>{{ profile?.description || member.data.value.description || '暂无成员简介' }}</p>
        </div>
        <strong>{{ memberStatusLabel(member.data.value) }}</strong>
      </section></LsPanel>

      <LsPanel v-if="member.data.value"><section class="membership" aria-labelledby="membership-title">
        <LsSectionHeader id="membership-title" title="成员信息" />
        <dl>
          <div>
            <dt>加入时间</dt>
            <dd><time>{{ joinedAt(member.data.value.create_time) }}</time></dd>
          </div>
          <div>
            <dt>邀请人</dt>
            <dd v-if="inviter">
              <strong>{{ inviter.name }}</strong>
              <span>@{{ inviter.slug }}</span>
              <small v-if="inviter.team">{{ inviter.is_external ? '来自其他团队 · ' : '' }}{{ (inviter.team as Record<string, unknown>).name }}</small>
            </dd>
            <dd v-else>未记录</dd>
          </div>
        </dl>
      </section></LsPanel>

      <LsPanel v-if="introduction"><section class="introduction" aria-labelledby="member-introduction-title">
        <LsSectionHeader id="member-introduction-title" title="详细介绍" />
        <LsMarkdownRenderer :content="introduction" :resolve-entities="resolveEntities" />
      </section></LsPanel>

      <EntityFieldsCard :fields="fields" :stored-values="fieldValues" mode="readonly" />
    </div>
  </LsDetailPage>
</template>

<style scoped>
.member-detail{min-width:0;display:grid;gap:1.5rem}
.identity{min-width:0;display:grid;grid-template-columns:64px minmax(0,1fr) auto;align-items:center;gap:1rem}
.avatar{width:64px;height:64px;display:grid;place-items:center;overflow:hidden;color:var(--text-primary);background:var(--surface-subtle);border-radius:var(--radius-sm);font-size:1.4rem;font-weight:700}
.avatar img{width:100%;height:100%;object-fit:cover}
.identity small,.identity p{color:var(--text-secondary)}
.identity h2,.identity p{margin:0}.identity h2{font-size:1.125rem}.identity p{margin-top:.3rem;line-height:1.6}
.identity>strong{color:var(--text-secondary);font-size:.8rem}
.introduction,.membership{min-width:0;display:grid;gap:1rem}
.membership dl{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));margin:0}
.membership dl>div{display:grid;gap:.35rem;padding:.25rem 1rem .25rem 0}
.membership dl>div+div{padding-left:1rem;border-left:1px solid var(--border)}
.membership dt{color:var(--text-secondary);font-size:.78rem}
.membership dd{display:grid;gap:.15rem;margin:0;overflow-wrap:anywhere}
.membership dd span,.membership dd small{color:var(--text-secondary);font-size:.8rem}
@media(max-width:639px){.identity{grid-template-columns:56px minmax(0,1fr)}.avatar{width:56px;height:56px}.identity>strong{grid-column:1/-1;justify-self:start}.membership dl{grid-template-columns:1fr}.membership dl>div{padding:.25rem 0}.membership dl>div+div{padding-top:1rem;padding-left:0;border-top:1px solid var(--border);border-left:0}}
</style>
