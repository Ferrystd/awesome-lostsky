<script setup lang="ts">
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import TeamResourceWorkspace from '../components/TeamResourceWorkspace.vue'
import TeamResourceEntry from '../components/TeamResourceEntry.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsSectionHeader from '@lostsky/ui/components/LsSectionHeader.vue'
import { NRadio, NRadioGroup } from 'naive-ui'

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
const scope = ref<'all' | 'open' | 'closed'>('all')
const groups = useQuery({ queryKey: ['team-chat-groups'], queryFn: () => api.get<Array<{ uuid: string; title: string; is_closed: boolean; participants: unknown[] }>>('/chatGroup/index'), enabled: computed(() => !access.restricted.value) })
const rows = computed(() => (groups.data.value ?? []).filter(item =>
  (!search.value || item.title?.includes(search.value)) &&
  (scope.value === 'all' || Boolean(item.is_closed) === (scope.value === 'closed')),
))
const scopes = computed(() => [
  { value: 'all', label: '全部群聊', count: groups.data.value?.length ?? 0 },
  { value: 'open', label: '进行中', count: (groups.data.value ?? []).filter(item => !item.is_closed).length },
  { value: 'closed', label: '已关闭', count: (groups.data.value ?? []).filter(item => item.is_closed).length },
])
</script>
<template>
  <TeamResourceWorkspace title="聊天管理" description="查找团队群聊，管理参与人员与历史消息。" context-label="群聊范围">
    <template #actions><LsPageLink to="/chat-groups/new" :icon="Plus" label="创建群聊" /></template>
    <template #toolbar>
      <LsListToolbar embedded v-model="search" placeholder="搜索群聊名称" aria-label="搜索群聊" :count-label="`${rows.length} 个群聊`" />
    </template>
    <LsAsyncState v-if="groups.isPending.value && !access.restricted.value" state="loading" :rows="3" />
    <LsAsyncState v-else-if="groups.isError.value" state="error" :description="friendlyError(groups.error.value)" />
    <ul v-else-if="rows.length" class="chat-directory" aria-label="群聊列表">
      <TeamResourceEntry v-for="item in rows" :key="item.uuid" :title="item.title || '未命名群聊'" :to="`/chat-groups/${item.uuid}`" :icon="MessageCircleMore">
        <span>{{ item.participants?.length ?? 0 }} 位参与者</span><span>查看人员与消息</span>
        <template #status><LsStatusTag :type="item.is_closed ? 'default' : 'success'" :label="item.is_closed ? '已关闭' : '进行中'" /></template>
      </TeamResourceEntry>
    </ul>
    <LsEmptyState v-else-if="!groups.isPending.value || access.restricted.value" :source="groups.data.value" :access-reason="access.reason.value" :title="search || scope !== 'all' ? '没有匹配的群聊' : '暂无群聊'" :description="search || scope !== 'all' ? '调整名称或群聊范围后再查找。' : '创建团队群聊，并邀请人员确认加入。'" />
    <template #filters>
      <LsPanel>
        <section class="chat-scope">
          <LsSectionHeader title="群聊范围" />
          <NRadioGroup v-model:value="scope" name="chat-group-scope" aria-label="群聊范围">
            <div class="chat-scope__options">
              <div v-for="option in scopes" :key="option.value" class="chat-scope__option">
                <NRadio :value="option.value">{{ option.label }}</NRadio>
                <span aria-hidden="true">{{ groups.isSuccess.value && !access.restricted.value ? option.count : '—' }}</span>
              </div>
            </div>
          </NRadioGroup>
          <p class="chat-scope__hint">进入群聊可修改名称、邀请人员和查看消息。已关闭的群聊保留历史记录，成员不能继续发送消息。</p>
        </section>
      </LsPanel>
    </template>
  </TeamResourceWorkspace>
</template>

<style scoped>
.chat-directory { padding: 0; margin: 0; }
.chat-scope { display: grid; gap: 1rem; }
.chat-scope__options { display: grid; gap: .25rem; }
.chat-scope__option { display: flex; align-items: center; justify-content: space-between; gap: 1rem; min-height: 44px; }
.chat-scope__option > span { color: var(--text-secondary); font-size: .8125rem; font-variant-numeric: tabular-nums; }
.chat-scope__hint { padding-top: 1rem; border-top: 1px solid var(--border); color: var(--text-secondary); font-size: .8125rem; line-height: 1.65; margin: 0; }
</style>
