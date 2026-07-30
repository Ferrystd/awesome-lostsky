<script setup lang="ts">
import { api } from '@lostsky/api/client'
import { useQuery } from '@tanstack/vue-query'
import { NInput, NPagination, NSelect } from 'naive-ui'
import { ref } from 'vue'
import PageHeader from '../components/PageHeader.vue'
import RetryState from '../components/RetryState.vue'
import type { AuditEvent, Page } from '../types'
import { formatTime } from '../utils'
const application=ref('');const resourceType=ref('');const actor=ref('');const page=ref(1)
const appOptions=[{label:'全部应用',value:''},{label:'Admin',value:'admin'},{label:'Team',value:'team'},{label:'Transaction',value:'transaction'},{label:'Shop',value:'shop'},{label:'Chat',value:'chat'}]
const resourceOptions=[{label:'全部资源',value:''},{label:'用户',value:'user'},{label:'团队',value:'team'},{label:'平台角色',value:'platform_admin_role'}]
const query=useQuery({queryKey:['admin-audit',application,resourceType,actor,page],queryFn:()=>api.get<Page<AuditEvent>>('/audit-events',{application:application.value,resource_type:resourceType.value,actor_user_id:actor.value,page:page.value,limit:20})})
function context(event:AuditEvent){const reason=event.context?.reason;return typeof reason==='string'?reason:'—'}
</script>
<template>
  <PageHeader title="审计日志" description="集中查看平台治理和业务写操作；日志只展示已记录的非敏感上下文。" />
  <section class="toolbar"><NSelect v-model:value="application" :options="appOptions" @update:value="page=1" /><NSelect v-model:value="resourceType" :options="resourceOptions" @update:value="page=1" /><NInput v-model:value="actor" placeholder="执行用户 ID" @update:value="page=1" /></section>
  <section class="panel"><div v-if="query.isPending.value" class="state">正在读取审计日志…</div><RetryState v-else-if="query.isError.value" :error="query.error.value" @retry="query.refetch()" /><div v-else-if="!query.data.value?.list.length" class="state"><h2>没有匹配的审计事件</h2><p>调整应用、资源或执行人筛选。</p></div><template v-else>
    <div class="mobile-records"><article v-for="event in query.data.value?.list" :key="event.id" class="mobile-record"><header><strong>{{ event.action }}</strong><span>#{{ event.id }}</span></header><dl><dt>执行人</dt><dd>{{ event.actor_username||'CLI / 系统' }}</dd><dt>资源</dt><dd>{{ event.resource_type }} #{{ event.resource_id||'—' }}</dd><dt>原因</dt><dd>{{ context(event) }}</dd><dt>时间</dt><dd>{{ formatTime(event.create_time) }}</dd></dl></article></div>
    <table class="data-table desktop-table"><thead><tr><th>时间</th><th>应用 / 动作</th><th>执行人</th><th>资源</th><th>原因</th><th>请求 ID</th></tr></thead><tbody><tr v-for="event in query.data.value?.list" :key="event.id"><td>{{ formatTime(event.create_time) }}</td><td class="cell-primary"><strong>{{ event.action }}</strong><small>{{ event.application }}</small></td><td>{{ event.actor_username||'CLI / 系统' }}</td><td>{{ event.resource_type }} <span v-if="event.resource_id">#{{ event.resource_id }}</span></td><td>{{ context(event) }}</td><td>{{ event.request_id||'—' }}</td></tr></tbody></table><div class="pagination"><NPagination v-model:page="page" :page-size="20" :item-count="query.data.value?.total??0" /></div></template></section>
</template>
