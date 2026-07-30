<script setup lang="ts">
import { api } from '@lostsky/api/client'
import LsSearchInput from '@lostsky/ui/components/LsSearchInput.vue'
import { useQuery } from '@tanstack/vue-query'
import { NPagination, NSelect } from 'naive-ui'
import { ref } from 'vue'
import PageHeader from '../components/PageHeader.vue'
import RetryState from '../components/RetryState.vue'
import StatusBadge from '../components/StatusBadge.vue'
import type { Page, UserSummary } from '../types'
import { formatTime } from '../utils'

const q = ref('')
const status = ref('')
const page = ref(1)
const options = [{ label: '全部状态', value: '' }, { label: '正常', value: 'active' }, { label: '已封禁', value: 'banned' }]
const query = useQuery({
  queryKey: ['admin-users', q, status, page],
  queryFn: () => api.get<Page<UserSummary>>('/users', { q: q.value, status: status.value, page: page.value, limit: 20 }),
})
</script>

<template>
  <PageHeader title="用户" description="查询平台账号、会话与团队归属；敏感联系方式按当前角色权限展示。" />
  <section class="toolbar" aria-label="用户筛选">
    <LsSearchInput v-model="q" placeholder="搜索用户名、手机号、邮箱、昵称或 ID" aria-label="搜索用户" @update:model-value="page=1" />
    <NSelect v-model:value="status" :options="options" @update:value="page=1" />
  </section>
  <section class="panel">
    <div v-if="query.isPending.value" class="state">正在读取用户…</div>
    <RetryState v-else-if="query.isError.value" :error="query.error.value" @retry="query.refetch()" />
    <div v-else-if="!query.data.value?.list.length" class="state"><h2>没有匹配的用户</h2><p>调整搜索词或状态筛选后重试。</p></div>
    <template v-else>
      <div class="mobile-records">
        <RouterLink v-for="user in query.data.value?.list" :key="user.id" class="mobile-record" :to="`/users/${user.id}`">
          <header><strong>{{ user.nickname || user.username }}</strong><StatusBadge :status="user.is_banned ? 'banned' : 'active'" /></header>
          <dl><dt>用户 ID</dt><dd>#{{ user.id }}</dd><dt>联系方式</dt><dd>{{ user.phone || user.phone_masked || user.email || user.email_masked || '—' }}</dd><dt>团队 / 设备</dt><dd>{{ user.team_count }} / {{ user.device_count }}</dd><dt>注册时间</dt><dd>{{ formatTime(user.create_time) }}</dd></dl>
        </RouterLink>
      </div>
      <table class="data-table desktop-table"><thead><tr><th>用户</th><th>联系方式</th><th>团队</th><th>设备</th><th>状态</th><th>注册时间</th></tr></thead><tbody>
        <tr v-for="user in query.data.value?.list" :key="user.id"><td class="cell-primary"><RouterLink :to="`/users/${user.id}`">{{ user.nickname || user.username }}</RouterLink><small>#{{ user.id }} · @{{ user.username }}</small></td><td>{{ user.phone || user.phone_masked || user.email || user.email_masked || '—' }}</td><td>{{ user.team_count }}</td><td>{{ user.device_count }}</td><td><StatusBadge :status="user.is_banned ? 'banned' : 'active'" /></td><td>{{ formatTime(user.create_time) }}</td></tr>
      </tbody></table>
      <div class="pagination"><NPagination v-model:page="page" :page-size="20" :item-count="query.data.value?.total ?? 0" /></div>
    </template>
  </section>
</template>
