<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import { identityUrl } from '@lostsky/shared/navigation'
import ChatTaskPage from '../components/ChatTaskPage.vue'

import LsField from '@lostsky/ui/components/LsField.vue'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { NInput, NList, NListItem, NRadio, NSelect } from 'naive-ui'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useChatIdentity } from '../lib/useChatIdentity'
interface Actor { id: number; slug: string; name: string }
const router = useRouter()
const route = useRoute()
const { expectedEntityId, identityKey, actor: identity } = useChatIdentity()
const query = ref(typeof route.query.participant === 'string' ? route.query.participant : '')
const search = ref(query.value)
const searchMode = ref(query.value ? 'slug' : 'q')
const selected = ref('')
const people = useQuery({
  queryKey: computed(() => ['chat-people', identityKey, searchMode.value, search.value]),
  queryFn: () => api.get<Actor[]>('/actor/search', { [searchMode.value]: search.value }),
  enabled: computed(() => Boolean(search.value.trim())),
})
const create = useMutation({
  mutationFn: () => api.post<{ uuid: string }>('/conversation/create', { kind: 'direct', expected_entity_id: expectedEntityId.value, participants: [selected.value] }),
  onSuccess: data => router.push({ path: '/', query: { conversation: data.uuid } }),
})
</script>
<template>
  <ChatTaskPage title="发起单聊" description="搜索可联系的人员，或输入准确标识。团队群聊由团队的聊天管理创建。">
      <p>当前身份：{{ identity.data.value?.name || '正在读取…' }} <a :href="identityUrl()">切换身份</a></p>
      <form class="conversation-form" @submit.prevent="search = query.trim(); selected = ''">
        <NSelect v-model:value="searchMode" aria-label="搜索方式" :options="[{ label: '按姓名搜索', value: 'q' }, { label: '按准确标识查找', value: 'slug' }]" />
        <LsField label="聊天对象" for-id="person-search" hint="准确标识可用于查找未公开展示的人员。"><NInput :input-props="{ id: 'person-search' }" aria-label="聊天对象" v-model:value="query" maxlength="100" placeholder="姓名或人员标识" /></LsField>
        <LsButton type="submit">查找人员</LsButton>
      </form>
      <LsAsyncState v-if="search && people.isPending.value" state="loading" title="正在查找人员" />
      <LsInlineError :message="people.isError.value || create.isError.value ? friendlyError(people.error.value || create.error.value) : ''" />
      <NList v-if="people.data.value?.length" aria-label="聊天对象候选">
        <NListItem v-for="person in people.data.value" :key="person.slug"><NRadio :checked="selected === person.slug" @change="selected = person.slug">{{ person.name }} · @{{ person.slug }}</NRadio></NListItem>
      </NList>
      <LsEmptyState v-else-if="search && !people.isPending.value" title="没有找到人员" description="请检查标识是否完整准确。" />
      <LsButton :disabled="!selected || !expectedEntityId" disabled-reason="请先选择聊天对象" :loading="create.isPending.value" @click="create.mutate()">开始聊天</LsButton>
    </ChatTaskPage>

</template>
<style scoped>
.conversation-form{display:grid;gap:1rem}
</style>
