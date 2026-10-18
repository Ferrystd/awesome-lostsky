<script setup lang="ts">
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import LsObjectDirectory from '@lostsky/ui/components/LsObjectDirectory.vue'
import LsResourceList from '@lostsky/ui/components/LsResourceList.vue'
import LsResourceRow from '@lostsky/ui/components/LsResourceRow.vue'

import { api, friendlyError } from '@lostsky/api/client'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useQuery } from '@tanstack/vue-query'
import LsStatusTag from '@lostsky/ui/components/LsStatusTag.vue'
import { Plus, MessageCircleMore } from '@lucide/vue'
import { computed, ref } from 'vue'
const access = useRouteAccess()
const search = ref('')
const groups = useQuery({ queryKey: ['team-chat-groups'], queryFn: () => api.get<Array<{ uuid: string; title: string; is_closed: boolean; participants: unknown[] }>>('/chatGroup/index'), enabled: computed(() => !access.restricted.value) })
const rows = computed(() => (groups.data.value ?? []).filter(item => !search.value || item.title?.includes(search.value)))
</script>
<template>
  <LsObjectDirectory title="聊天管理" description="管理本团队所属的群聊、成员和历史消息。">
    <template #actions>
      <LsPageLink to="/chat-groups/new" :icon="Plus" label="创建群聊" />
    </template>
    <template #toolbar>
      <LsListToolbar embedded v-model="search" placeholder="搜索群聊名称" aria-label="搜索群聊" :count-label="`${rows.length} 个群聊`" />
    </template>
    <LsAsyncState v-if="groups.isPending.value && !access.restricted.value" state="loading" />
    <LsAsyncState v-else-if="groups.isError.value" state="error" :description="friendlyError(groups.error.value)" />
    <LsResourceList v-else-if="rows.length" aria-label="群聊列表">
      <LsResourceRow v-for="item in rows" :key="item.uuid" :title="item.title || '未命名群聊'" :to="`/chat-groups/${item.uuid}`" :icon="MessageCircleMore">
        <template #metadata>{{ item.participants?.length ?? 0 }} 位参与者</template>
        <template #status>
          <LsStatusTag :type="item.is_closed ? 'default' : 'success'" :label="item.is_closed ? '已关闭' : '进行中'" />
        </template>
      </LsResourceRow>
    </LsResourceList>
    <LsEmptyState v-else-if="!groups.isPending.value || access.restricted.value" :source="groups.data.value" :access-reason="access.reason.value" title="暂无群聊" description="创建团队群聊，并邀请人员确认加入。" />
  </LsObjectDirectory>
</template>
