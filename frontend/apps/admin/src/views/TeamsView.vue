<script setup lang="ts">
import { api } from '@lostsky/api/client'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsListToolbar from '@lostsky/ui/components/LsListToolbar.vue'
import { useQuery } from '@tanstack/vue-query'
import { NPagination, NSelect } from 'naive-ui'
import { ref } from 'vue'
import PageHeader from '../components/PageHeader.vue'
import RetryState from '../components/RetryState.vue'
import StatusBadge from '../components/StatusBadge.vue'
import type { Page, TeamSummary } from '../types'
import { formatTime } from '../utils'
const q=ref(''); const status=ref(''); const page=ref(1)
const options=[{label:'全部状态',value:''},{label:'正常',value:'active'},{label:'已封禁',value:'banned'},{label:'已注销',value:'cancelled'}]
const query=useQuery({queryKey:['admin-teams',q,status,page],queryFn:()=>api.get<Page<TeamSummary>>('/teams',{q:q.value,status:status.value,page:page.value,limit:20})})
</script>
<template>
  <PageHeader title="团队" description="查看团队所有者、规模和运行状态；平台治理不修改团队内部业务数据。" />
  <LsListToolbar v-model="q" placeholder="搜索团队名称、slug、所有者或 ID" aria-label="搜索团队" :count-label="`${query.data.value?.total ?? 0} 个团队`" @update:model-value="page=1"><template #filters><NSelect v-model:value="status" :options="options" @update:value="page=1" /></template></LsListToolbar>
  <section v-if="query.isPending.value" class="panel"><div class="state">正在读取团队…</div></section>
  <RetryState v-else-if="query.isError.value" :error="query.error.value" @retry="query.refetch()" />
  <LsEmptyState v-else-if="!query.data.value?.list.length" title="没有匹配的团队" description="调整搜索词或状态筛选后重试。" />
  <section v-else class="panel">
      <div class="mobile-records"><RouterLink v-for="team in query.data.value?.list" :key="team.id" class="mobile-record" :to="`/teams/${team.id}`"><header><strong>{{ team.name || team.slug }}</strong><StatusBadge :status="team.is_cancelled ? 'cancelled' : team.is_banned ? 'banned' : 'active'" /></header><dl><dt>标识</dt><dd>{{ team.slug }}</dd><dt>所有者</dt><dd>{{ team.owner_username || `#${team.user_id}` }}</dd><dt>成员</dt><dd>{{ team.member_count }}</dd><dt>创建时间</dt><dd>{{ formatTime(team.create_time) }}</dd></dl></RouterLink></div>
      <table class="data-table desktop-table"><thead><tr><th>团队</th><th>所有者</th><th>成员</th><th>状态</th><th>创建时间</th></tr></thead><tbody><tr v-for="team in query.data.value?.list" :key="team.id"><td class="cell-primary"><RouterLink :to="`/teams/${team.id}`">{{ team.name || team.slug }}</RouterLink><small>#{{ team.id }} · {{ team.slug }}</small></td><td>{{ team.owner_username || `#${team.user_id}` }}</td><td>{{ team.member_count }}</td><td><StatusBadge :status="team.is_cancelled ? 'cancelled' : team.is_banned ? 'banned' : 'active'" /></td><td>{{ formatTime(team.create_time) }}</td></tr></tbody></table>
      <div class="pagination"><NPagination v-model:page="page" :page-size="20" :item-count="query.data.value?.total??0" /></div>
  </section>
</template>
