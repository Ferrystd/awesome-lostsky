<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useQuery } from '@tanstack/vue-query'
import { NAlert, NSkeleton } from 'naive-ui'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import OperationRecordList from '../components/OperationRecordList.vue'
import { apiPrefix } from '../lib/workspace'
import type { WeiboOperation } from '../types'
const route=useRoute();const personal=computed(()=>route.meta.workspace==='personal');const prefix=computed(()=>apiPrefix(personal.value));const routeAccess=useRouteAccess();const query=useQuery({queryKey:computed(()=>['weibo-operations',prefix.value]),queryFn:()=>api.get<{list:WeiboOperation[]}>(`${prefix.value}/operations`,{limit:100}),enabled:computed(()=>!routeAccess.restricted.value)})
</script>
<template><div class="weibo-stack"><LsPageHeader title="执行日志" description="日志只保留最近 30 天：保留请求状态、微博返回码、失败原因和远端编号；其他内容不会保存。（不建议非技术人员查看）" /><NAlert v-if="query.isError.value" type="error">{{ friendlyError(query.error.value) }}</NAlert><NSkeleton v-if="!routeAccess.restricted.value && query.isPending.value" text :repeat="7" /><OperationRecordList :source="query.data.value" v-else :operations="query.data.value?.list||[]" /></div></template>
