<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import { useQuery } from '@tanstack/vue-query'
import { NAlert, NSkeleton } from 'naive-ui'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import OperationRecordList from '../components/OperationRecordList.vue'
import { apiPrefix } from '../lib/workspace'
import type { WeiboOperation } from '../types'
const route=useRoute();const personal=computed(()=>route.meta.workspace==='personal');const prefix=computed(()=>apiPrefix(personal.value));const query=useQuery({queryKey:computed(()=>['weibo-operations',prefix.value]),queryFn:()=>api.get<{list:WeiboOperation[]}>(`${prefix.value}/operations`,{limit:100})})
</script>
<template><div class="weibo-stack"><LsPageHeader title="执行日志" description="只保留最近 30 天的最小结构化结果：HTTP 状态、微博 code/message、归一化原因和远程 ID。不保存完整响应或凭据。" /><NAlert v-if="query.isError.value" type="error">{{ friendlyError(query.error.value) }}</NAlert><NSkeleton v-if="query.isPending.value" text :repeat="7" /><OperationRecordList v-else :operations="query.data.value?.list||[]" /></div></template>
