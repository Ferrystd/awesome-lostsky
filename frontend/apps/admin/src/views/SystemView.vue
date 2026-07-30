<script setup lang="ts">
import { api } from '@lostsky/api/client'
import { useQuery } from '@tanstack/vue-query'
import { NButton } from 'naive-ui'
import PageHeader from '../components/PageHeader.vue'
import RetryState from '../components/RetryState.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { formatTime } from '../utils'
interface Health { status:'healthy'|'degraded'|'unhealthy';checked_at:number;checks:Array<{key:string;name:string;status:'healthy'|'degraded'|'unhealthy';message:string}>;backlogs:Record<string,number> }
const query=useQuery({queryKey:['admin-health'],queryFn:()=>api.get<Health>('/system/health')})
</script>
<template>
  <PageHeader title="系统状态" description="只读检查核心依赖和后台积压，不提供重启、重试或自动修复。"><NButton :loading="query.isFetching.value" @click="query.refetch()">重新检查</NButton></PageHeader>
  <div v-if="query.isPending.value" class="panel state">正在检查系统状态…</div><RetryState v-else-if="query.isError.value" class="panel" :error="query.error.value" @retry="query.refetch()" />
  <template v-else-if="query.data.value">
    <section class="system-status panel"><div><StatusBadge :status="query.data.value.status" /><h2>{{ query.data.value.status==='healthy'?'核心服务运行正常':'有服务需要关注' }}</h2><p>检查时间 {{ formatTime(query.data.value.checked_at) }}</p></div></section>
    <section class="panel"><div class="panel-heading"><div><h2>核心依赖</h2><p>检查结果不包含连接密钥和服务器路径</p></div></div><table class="data-table"><thead><tr><th>服务</th><th>状态</th><th>说明</th></tr></thead><tbody><tr v-for="check in query.data.value.checks" :key="check.key"><td>{{ check.name }}</td><td><StatusBadge :status="check.status" /></td><td>{{ check.message }}</td></tr></tbody></table></section>
    <section class="panel"><div class="panel-heading"><div><h2>后台积压</h2><p>仅用于判断是否需要进入运维流程</p></div></div><dl class="definition-list"><template v-for="(count,key) in query.data.value.backlogs" :key="key"><dt>{{ key }}</dt><dd class="ls-tabular">{{ count }}</dd></template></dl></section>
  </template>
</template>
<style scoped>.system-status{padding:20px}.system-status h2{margin:10px 0 4px;font-size:1.25rem}.system-status p{margin:0;color:var(--muted-ink)}</style>
