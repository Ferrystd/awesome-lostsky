<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import { feedback } from '@lostsky/ui/feedback'
import LsPage from '@lostsky/ui/components/LsPage.vue'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import { useQuery, useQueryClient, useMutation } from '@tanstack/vue-query'
import { NList, NListItem, NThing } from 'naive-ui'
import { useChatIdentity } from '../lib/useChatIdentity'
const { expectedEntityId, identityKey } = useChatIdentity()
const cache = useQueryClient()
const invitations = useQuery({ queryKey: ['chat-invitations', identityKey], queryFn: () => api.get<Array<{ uuid: string; title: string }>>('/conversation/invitation') })
const blocks = useQuery({ queryKey: ['chat-blocks', identityKey], queryFn: () => api.get<Array<{ slug: string; name: string }>>('/block') })
const action = useMutation({
  mutationFn: ({ path, body }: { path: string; body: Record<string, unknown> }) => api.post(path, { ...body, expected_entity_id: expectedEntityId.value }),
  onSuccess: async () => { await cache.invalidateQueries(); feedback.success('操作已完成') },
  onError: error => feedback.error(friendlyError(error)),
})
</script>
<template>
  <main class="chat-requests"><LsPage width="content">
    <LsPageHeader title="邀请与屏蔽" back-to="/" back-label="返回消息" />
    <section><h2>待处理群邀请</h2>
      <LsAsyncState v-if="invitations.isPending.value" state="loading" /><LsAsyncState v-else-if="invitations.isError.value" state="error" :description="friendlyError(invitations.error.value)" />
      <NList v-else-if="invitations.data.value?.length"><NListItem v-for="item in invitations.data.value" :key="item.uuid"><NThing :title="item.title || '群聊邀请'" description="接受后可以读取群聊历史消息。" /><template #suffix><div class="request-actions"><LsButton :loading="action.isPending.value" :disabled="!expectedEntityId" disabled-reason="正在读取当前身份" @click="action.mutate({ path: '/conversation/invitation/accept', body: { uuid: item.uuid } })">接受</LsButton><LsButton variant="secondary" :loading="action.isPending.value" :disabled="!expectedEntityId" disabled-reason="正在读取当前身份" @click="action.mutate({ path: '/conversation/invitation/reject', body: { uuid: item.uuid } })">拒绝</LsButton></div></template></NListItem></NList>
      <LsEmptyState v-else-if="!invitations.isPending.value" title="暂无群邀请" description="收到团队群邀请后可在这里处理。" />
    </section>
    <section><h2>已屏蔽人员</h2><p>屏蔽后，双方无法发送单聊消息或发起新的群邀请，已有聊天记录仍可查看。</p>
      <LsAsyncState v-if="blocks.isPending.value" state="loading" /><LsAsyncState v-else-if="blocks.isError.value" state="error" :description="friendlyError(blocks.error.value)" />
      <NList v-else-if="blocks.data.value?.length"><NListItem v-for="item in blocks.data.value" :key="item.slug">{{ item.name }} · @{{ item.slug }}<template #suffix><LsButton variant="secondary" :loading="action.isPending.value" :disabled="!expectedEntityId" disabled-reason="正在读取当前身份" @click="action.mutate({ path: '/block/delete', body: { entity_slug: item.slug } })">取消屏蔽</LsButton></template></NListItem></NList>
      <LsEmptyState v-else-if="!blocks.isPending.value" title="暂无屏蔽人员" description="可在单聊消息页屏蔽对方。" />
    </section>
  </LsPage></main>
</template>
<style scoped>
.chat-requests{padding:2rem 1rem}.request-actions{display:flex;flex-wrap:wrap;gap:.5rem}h2{font-size:1.1rem}
</style>
