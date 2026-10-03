<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsPagePrimaryAction from '@lostsky/ui/components/LsPagePrimaryAction.vue'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useQuery } from '@tanstack/vue-query'
import { NList, NListItem, NThing, NTag } from 'naive-ui'
import { Plus } from '@lucide/vue'
import { computed, ref } from 'vue'
const access = useRouteAccess()
const search = ref('')
const groups = useQuery({ queryKey: ['team-chat-groups'], queryFn: () => api.get<Array<{ uuid: string; title: string; is_closed: boolean; participants: unknown[] }>>('/chatGroup/index'), enabled: computed(() => !access.restricted.value) })
const rows = computed(() => (groups.data.value ?? []).filter(item => !search.value || item.title?.includes(search.value)))
</script>
<template>
  <div class="chat-groups-page">
    <LsPageHeader title="聊天管理" description="管理本团队所属的群聊、成员和历史消息。"><template #actions><LsPagePrimaryAction to="/chat-groups/new" :icon="Plus" label="创建群聊" /></template></LsPageHeader>
    <LsListToolbar v-model="search" placeholder="搜索群聊名称" aria-label="搜索群聊" :count-label="`${rows.length} 个群聊`" />
    <LsAsyncState v-if="groups.isPending.value && !access.restricted.value" state="loading" /><LsAsyncState v-else-if="groups.isError.value" state="error" :description="friendlyError(groups.error.value)" />
    <NList v-else-if="rows.length"><NListItem v-for="item in rows" :key="item.uuid"><NThing><template #header><RouterLink :to="`/chat-groups/${item.uuid}`">{{ item.title || '未命名群聊' }}</RouterLink></template><template #description>{{ item.participants?.length ?? 0 }} 位参与者</template></NThing><template #suffix><NTag :type="item.is_closed ? 'default' : 'success'">{{ item.is_closed ? '已关闭' : '进行中' }}</NTag></template></NListItem></NList>
    <LsEmptyState v-else-if="!groups.isPending.value || access.restricted.value" :source="groups.data.value" :access-reason="access.reason.value" title="暂无群聊" description="创建团队群聊，并邀请人员确认加入。" />
  </div>
</template>
<style scoped>.chat-groups-page{display:grid;gap:1.5rem}</style>
