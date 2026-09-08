<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import LsPagePrimaryAction from '@lostsky/ui/components/LsPagePrimaryAction.vue'
import { feedback } from '@lostsky/ui/feedback'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { Link } from '@lucide/vue'
import { NAlert, NButton, NSkeleton } from 'naive-ui'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { apiPrefix, expectedEntity, loadAccess } from '../lib/workspace'
import type { WeiboAccount, WorkspaceAccess } from '../types'

const route=useRoute();const personal=computed(()=>route.meta.workspace==='personal');const prefix=computed(()=>apiPrefix(personal.value));const client=useQueryClient();const routeAccess=useRouteAccess()
const access=useQuery({queryKey:['weibo-access'],queryFn:()=>loadAccess()});const query=useQuery({queryKey:computed(()=>['weibo-accounts',prefix.value]),queryFn:()=>api.get<WeiboAccount[]>(`${prefix.value}/accounts`),enabled:computed(()=>!routeAccess.restricted.value)})
const body=()=>expectedEntity(access.data.value,personal.value)
const check=useMutation({mutationFn:(id:number)=>api.post(`${prefix.value}/accounts/${id}/check`,body()),onSuccess:()=>{feedback.success('账号检查已完成');void client.invalidateQueries({queryKey:['weibo-accounts']})},onError:e=>feedback.error(friendlyError(e))})
const unbind=useMutation({mutationFn:(id:number)=>api.post(`${prefix.value}/bindings/${id}/remove`,body()),onSuccess:()=>{feedback.success('已解除绑定');void client.invalidateQueries({queryKey:['weibo-accounts']})},onError:e=>feedback.error(friendlyError(e))})
const labels={Valid:'有效',Invalid:'失效',Unknown:'结果未确认',Unchecked:'未检查'};const tone={Valid:'success',Invalid:'danger',Unknown:'warning',Unchecked:''}
</script>
<template><div class="weibo-stack"><LsPageHeader title="微博账号" description="登录凭据在开发阶段明文保存，但不会进入 API 、审计或执行日志。"><template #actions><LsPagePrimaryAction :icon="Link" label="绑定账号" :href="`${prefix}/accounts/bind`" /></template></LsPageHeader><NAlert v-if="query.isError.value" type="error">{{ friendlyError(query.error.value) }}</NAlert><NSkeleton v-if="!routeAccess.restricted.value && query.isPending.value" text :repeat="5" /><LsEmptyState :source="query.data.value" v-else-if="routeAccess.restricted.value || !query.data.value?.length" title="还没有绑定账号" description="绑定后可以先做无副作用的登录态检查。" /><div v-else class="weibo-list"><article v-for="account in query.data.value" :key="account.binding_id" class="weibo-list-row"><div><p><strong>{{ account.screen_name || `UID ${account.uid}` }}</strong></p><small>UID {{ account.uid }} · {{ account.checked_at ? new Date(account.checked_at*1000).toLocaleString() : '尚未检查' }}</small></div><div class="weibo-actions"><span class="weibo-status" :data-tone="tone[account.health]">{{ labels[account.health] }}</span><NButton size="small" :loading="check.isPending.value" @click="check.mutate(account.id)">检查</NButton><NButton size="small" tertiary type="error" :loading="unbind.isPending.value" @click="unbind.mutate(account.binding_id)">解绑</NButton></div></article></div></div></template>
