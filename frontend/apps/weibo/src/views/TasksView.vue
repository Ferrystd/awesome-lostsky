<script setup lang="ts">
import { api, friendlyError } from '@lostsky/api/client'
import { formatAbilityDenied } from '@lostsky/api/error-format'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import { feedback } from '@lostsky/ui/feedback'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { NAlert, NButton, NSkeleton } from 'naive-ui'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { apiPrefix, expectedEntity, loadAccess } from '../lib/workspace'
import type { WeiboTask } from '../types'

const route = useRoute()
const personal = computed(() => route.meta.workspace === 'personal')
const prefix = computed(() => apiPrefix(personal.value))
const client = useQueryClient()
const access = useQuery({ queryKey: ['weibo-access'], queryFn: () => loadAccess() })
const query = useQuery({ queryKey: computed(() => ['weibo-tasks', prefix.value]), queryFn: () => api.get<WeiboTask[]>(`${prefix.value}/tasks`) })
const abilityDisabledReason = computed(() => {
  if (access.isPending.value) return '正在核对微博 Ability，请稍候'
  if (access.isError.value) return friendlyError(access.error.value)
  const ability = access.data.value?.abilities?.weibo
  return ability?.enabled ? '' : formatAbilityDenied('weibo', ability?.label || '微博')
})
const action = useMutation({
  mutationFn: ({ id, name }: { id: number; name: string }) => api.post(`${prefix.value}/tasks/${id}/${name}`, expectedEntity(access.data.value, personal.value)),
  onSuccess: () => {
    feedback.success('任务状态已更新')
    void client.invalidateQueries({ queryKey: ['weibo-tasks'] })
  },
  onError: error => feedback.error(friendlyError(error)),
})
const label = { Paused: '已暂停', Active: '运行中', BlockedLogin: '登录阻塞', BlockedAbility: 'Ability 阻塞', Cancelled: '已取消' }
</script>

<template>
  <div class="weibo-stack">
    <LsPageHeader title="持续随机任务" description="首次在开始时间执行；后续时间为上次完成时间加随机间隔。阻塞解除后不会自动恢复。">
      <template #actions><NButton type="primary" tag="a" :href="`${prefix}/tasks/new`">新建任务</NButton></template>
    </LsPageHeader>
    <NAlert v-if="query.isError.value" type="error">{{ friendlyError(query.error.value) }}</NAlert>
    <NSkeleton v-if="query.isPending.value" text :repeat="5" />
    <LsEmptyState v-else-if="!query.data.value?.length" title="暂无任务" description="任务新建后统一先保存为暂停，开启时才检查 Ability。" />
    <div v-else class="weibo-list">
      <article v-for="task in query.data.value" :key="task.id" class="weibo-list-row">
        <div>
          <p><strong>#{{ task.topic.name }}#</strong> · {{ task.operation_type === 'Checkin' ? '每日签到' : '自动发帖' }} · {{ label[task.status] }}</p>
          <small>{{ task.operation_type === 'Checkin' ? '每天同一时间执行，失败当天不重试' : task.content.slice(0, 80) }} · v{{ task.version }}<template v-if="task.next_run_at"> · {{ new Date(task.next_run_at * 1000).toLocaleString() }}</template></small>
        </div>
        <div class="weibo-actions">
          <NButton size="small" tag="a" :href="`${prefix}/tasks/${task.id}`">编辑</NButton>
          <NButton v-if="task.status === 'Active'" size="small" @click="action.mutate({ id: task.id, name: 'pause' })">暂停</NButton>
          <LsButton
            v-else-if="task.status !== 'Cancelled'"
            size="sm"
            :disabled="Boolean(abilityDisabledReason)"
            :disabled-reason="abilityDisabledReason"
            @click="action.mutate({ id: task.id, name: task.status === 'Paused' ? 'start' : 'resume' })"
          >{{ task.status === 'Paused' ? '开启' : '恢复' }}</LsButton>
          <NButton v-if="task.status !== 'Cancelled'" size="small" tertiary type="error" @click="action.mutate({ id: task.id, name: 'cancel' })">取消</NButton>
        </div>
      </article>
    </div>
  </div>
</template>
