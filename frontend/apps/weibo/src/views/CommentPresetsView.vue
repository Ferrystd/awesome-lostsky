<script setup lang="ts">
import LsResourceRow from '@lostsky/ui/components/LsResourceRow.vue'
import LsResourceList from '@lostsky/ui/components/LsResourceList.vue'
import LsCollectionPage from '@lostsky/ui/components/LsCollectionPage.vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import { friendlyError } from '@lostsky/api/client'
import { Pencil, Plus, ArrowLeft } from '@lucide/vue'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { loadAccess } from '../lib/workspace'
import { interactionPresetQuery, interactionReturnTarget } from '../lib/interactionDraft'
import { useCommentPresets } from '../lib/useCommentPresets'

const route = useRoute()
const access = useQuery({ queryKey: ['weibo-access'], queryFn: () => loadAccess() })
const { personal, prefix, scope, query, accessReason, restricted } = useCommentPresets()
const search = ref('')
const listPath = computed(() => `${prefix.value}/interactions/comment-presets`)
const presetQuery = computed(() => interactionPresetQuery(route.query))
const backTo = computed(() => personal.value ? { path: '/personal/feed' } : interactionReturnTarget(route.query, access.data.value, false))
const presets = computed(() => restricted.value ? [] : (query.data.value ?? []).filter(item => item.scope === scope.value))
const filtered = computed(() => presets.value.filter(item => item.content.toLocaleLowerCase().includes(search.value.trim().toLocaleLowerCase())))
</script>

<template>
  <div class="weibo-stack comment-presets-page">
    <LsCollectionPage title="预设评论" :description="personal ? '查看自己的常用评论，团队预设也可在互动页选择。' : '查看团队成员可选用的常用评论。'">
      <template #actions>
        <LsPageLink v-if="backTo" :to="backTo" :label="personal ? '返回点单信息流' : '返回互动'" :icon="ArrowLeft" />
        <LsPageLink :icon="Plus" label="添加预设" :to="{ path: `${listPath}/new`, query: presetQuery }" />
      </template>
      <LsAsyncState v-if="query.isError.value" state="error" title="预设评论加载失败" :description="friendlyError(query.error.value)" />
      <LsAsyncState v-if="!restricted && query.isPending.value" state="loading" :rows="5" />
      <template v-else-if="restricted || !query.isError.value || query.data.value">
        <LsListToolbar v-if="presets.length" v-model="search" placeholder="搜索预设评论" aria-label="搜索预设评论" :count-label="`共 ${filtered.length} 条`">
          <template #actions>
            <LsPageLink :to="{ path: `${listPath}/edit`, query: presetQuery }" :icon="Pencil" label="编辑预设" />
          </template>
        </LsListToolbar>
        <LsEmptyState v-if="!filtered.length" :title="presets.length ? '没有匹配的预设评论' : '暂无预设评论'" :description="presets.length ? '试试其他关键词。' : '添加常用回复，保存后可在互动页选择。'" :source="query.data.value" :access-reason="accessReason" />
        <LsResourceList v-else aria-label="预设评论列表">
          <LsResourceRow v-for="item in filtered" :key="item.id">
            <template #identity>
              <p class="preset-content">{{ item.content }}</p>
            </template>
          </LsResourceRow>
        </LsResourceList>
      </template>
    </LsCollectionPage>
  </div>
</template>

<style scoped>
.preset-content { max-width: 68ch; margin: 0; font-size: .9375rem; line-height: 1.6; white-space: pre-wrap; overflow-wrap: anywhere; }
</style>
