<script setup lang="ts">
import LsCategoryPage from '@lostsky/ui/components/LsCategoryPage.vue'
import { api, friendlyError } from '@lostsky/api/client'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useQuery } from '@tanstack/vue-query'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import LsAsyncState from '@lostsky/ui/components/LsAsyncState.vue'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import OperationRecordList from '../components/OperationRecordList.vue'
import { apiPrefix } from '../lib/workspace'
import type { WeiboOperation } from '../types'
const route=useRoute();const personal=computed(()=>route.meta.workspace==='personal');const prefix=computed(()=>apiPrefix(personal.value));const routeAccess=useRouteAccess();const query=useQuery({queryKey:computed(()=>['weibo-operations',prefix.value]),queryFn:()=>api.get<{list:WeiboOperation[]}>(`${prefix.value}/operations`,{limit:100}),enabled:computed(()=>!routeAccess.restricted.value)})
const category = ref('')
const search = ref('')
const categories = [{ key: '', label: '全部操作' }, { key: 'Post', label: '发帖' }, { key: 'Like', label: '点赞' }, { key: 'Comment', label: '评论' }, { key: 'Checkin', label: '签到' }]
const visible = computed(() => {
  if (routeAccess.restricted.value) return []
  const keyword = search.value.trim().toLocaleLowerCase()
  return (query.data.value?.list ?? []).filter(item => (!category.value || item.operation_type === category.value) && (!keyword || [item.content_summary, item.target_id, item.remote_message, item.reason].join(' ').toLocaleLowerCase().includes(keyword)))
})
</script>
<template>
  <LsCategoryPage title="执行日志" :items="categories" :current="category" label="操作分类" @select="category = $event" description="日志只保留最近 30 天：保留请求状态、微博返回码、失败原因和远端编号；其他内容不会保存。（不建议非技术人员查看）">
    <div class="operation-log-content">
      <LsListToolbar embedded v-model="search" placeholder="搜索摘要、远端编号或失败原因" aria-label="搜索执行日志" :count-label="`${visible.length} 条记录`" />
      <LsAsyncState v-if="query.isError.value" state="error" :description="friendlyError(query.error.value)" />
      <LsAsyncState v-else-if="!routeAccess.restricted.value && query.isPending.value" state="loading" />
      <OperationRecordList v-else :source="query.data.value" :operations="visible" :empty-description="search || category ? '调整搜索词或操作分类，查看其他执行记录。' : undefined" />
    </div>
  </LsCategoryPage>
</template>
<style scoped>
.operation-log-content { min-width: 0; display: grid; gap: 1rem; }
</style>
