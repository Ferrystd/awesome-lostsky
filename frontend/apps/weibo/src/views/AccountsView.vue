<script setup lang="ts">
import LsDirectoryActions from '@lostsky/ui/components/LsDirectoryActions.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import LsStatusTag from '@lostsky/ui/components/LsStatusTag.vue'
import LsResourceRow from '@lostsky/ui/components/LsResourceRow.vue'
import LsResourceList from '@lostsky/ui/components/LsResourceList.vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import LsObjectDirectory from '@lostsky/ui/components/LsObjectDirectory.vue'
import { api, friendlyError } from '@lostsky/api/client'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import { feedback } from '@lostsky/ui/feedback'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { Link } from '@lucide/vue'
import { NAlert, NSkeleton } from 'naive-ui'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { apiPrefix, expectedEntity, loadAccess } from '../lib/workspace'
import type { WeiboAccount } from '../types'

const route=useRoute();const personal=computed(()=>route.meta.workspace==='personal');const prefix=computed(()=>apiPrefix(personal.value));const client=useQueryClient();const routeAccess=useRouteAccess()
const access=useQuery({queryKey:['weibo-access'],queryFn:()=>loadAccess()});const query=useQuery({queryKey:computed(()=>['weibo-accounts',prefix.value]),queryFn:()=>api.get<WeiboAccount[]>(`${prefix.value}/accounts`),enabled:computed(()=>!routeAccess.restricted.value)})
const body=()=>expectedEntity(access.data.value,personal.value)
const check=useMutation({mutationFn:(id:number)=>api.post(`${prefix.value}/accounts/${id}/check`,body()),onSuccess:()=>{feedback.success('账号检查已完成');void client.invalidateQueries({queryKey:['weibo-accounts']})},onError:e=>feedback.error(friendlyError(e))})
const unbind=useMutation({mutationFn:(id:number)=>api.post(`${prefix.value}/bindings/${id}/remove`,body()),onSuccess:()=>{feedback.success('已解除绑定');void client.invalidateQueries({queryKey:['weibo-accounts']})},onError:e=>feedback.error(friendlyError(e))})
const labels={Valid:'有效',Invalid:'失效',Unknown:'结果未确认',Unchecked:'未检查'}
</script>
<template>
  <div class="weibo-stack">
    <LsObjectDirectory title="微博账号" description="查看与管理所绑定微博账号。">
      <template #actions>
        <LsPageLink :icon="Link" label="绑定账号" :href="`${prefix}/accounts/bind`" />
      </template>
      <template #toolbar><LsListToolbar embedded :searchable="false" :count-label="`${routeAccess.restricted.value ? 0 : query.data.value?.length ?? 0} 个账号`" /></template>
      <NAlert v-if="query.isError.value" type="error">{{ friendlyError(query.error.value) }}</NAlert>
      <NSkeleton v-if="!routeAccess.restricted.value && query.isPending.value" text :repeat="5" />
      <LsEmptyState :source="query.data.value" v-else-if="routeAccess.restricted.value || !query.data.value?.length" title="还没有绑定账号" description="绑定账号后可以先检查登录状态；这一步不会操作微博账号。" />
      <LsResourceList v-else aria-label="微博账号列表">
        <LsResourceRow v-for="account in query.data.value" :key="account.binding_id" :title="account.screen_name || `UID ${account.uid}`">
          <template #status>
            <LsStatusTag :label="labels[account.health]" :type="account.health === 'Valid' ? 'success' : account.health === 'Invalid' ? 'error' : account.health === 'Unknown' ? 'warning' : 'default'" />
          </template>
          <template #metadata>
            <span>UID {{ account.uid }} · {{ account.checked_at ? new Date(account.checked_at * 1000).toLocaleString() : '尚未检查' }}</span>
          </template>
          <template #actions>
            <LsDirectoryActions :label="`${account.screen_name || account.uid}的操作`" :actions="[
              { key: 'check', label: '检查', disabled: check.isPending.value },
              { key: 'unbind', label: '解绑', danger: true, disabled: unbind.isPending.value },
            ]" @select="$event === 'check' ? check.mutate(account.id) : unbind.mutate(account.binding_id)" />
          </template>
        </LsResourceRow>
      </LsResourceList>
    </LsObjectDirectory>
  </div>
</template>
