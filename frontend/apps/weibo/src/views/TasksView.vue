<script setup lang="ts">
import LsStatusTag from '@lostsky/ui/components/LsStatusTag.vue'
import LsResourceRow from '@lostsky/ui/components/LsResourceRow.vue'
import LsResourceList from '@lostsky/ui/components/LsResourceList.vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import LsCollectionPage from '@lostsky/ui/components/LsCollectionPage.vue'
import { api, friendlyError } from '@lostsky/api/client'
import { formatAbilityDenied } from '@lostsky/api/error-format'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import { feedback } from '@lostsky/ui/feedback'
import { useRouteAccess } from '@lostsky/ui/useRouteAccess'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { Plus, ArrowUpRight } from '@lucide/vue'
import { NAlert, NSkeleton, NFlex } from 'naive-ui'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { apiPrefix, expectedEntity, loadAccess } from '../lib/workspace'
import type { WeiboTask } from '../types'

const route = useRoute()
const personal = computed(() => route.meta.workspace === 'personal')
const prefix = computed(() => apiPrefix(personal.value))
const client = useQueryClient()
const routeAccess = useRouteAccess()
const access = useQuery({ queryKey: ['weibo-access'], queryFn: () => loadAccess() })
const query = useQuery({ queryKey: computed(() => ['weibo-tasks', prefix.value]), queryFn: () => api.get<WeiboTask[]>(`${prefix.value}/tasks`), enabled: computed(() => !routeAccess.restricted.value) })
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
    <LsCollectionPage title="持续随机任务" description="任务从设定的开始时间执行第一轮，之后在上一次完成时间上加随机间隔继续；被阻塞后不会自动恢复。">
      <template #actions>
        <LsPageLink :icon="Plus" label="新建任务" :href="`${prefix}/tasks/new`" />
      </template>
      <NAlert v-if="query.isError.value" type="error">{{ friendlyError(query.error.value) }}</NAlert>
      <NSkeleton v-if="!routeAccess.restricted.value && query.isPending.value" text :repeat="5" />
      <LsEmptyState :source="query.data.value" v-else-if="routeAccess.restricted.value || !query.data.value?.length" title="暂无任务" description="任务新建后统一先保存为暂停，开启时才检查运行条件。" />
      <LsResourceList v-else aria-label="持续任务列表">
        <LsResourceRow v-for="task in query.data.value" :key="task.id" :title="`#${task.topic.name}#`" :description="task.operation_type === 'Checkin' ? '每日签到' : '自动发帖'">
          <template #status>
            <LsStatusTag :label="label[task.status]" />
          </template>
          <template #metadata>
            <span>{{ task.operation_type === 'Checkin' ? '每天同一时间执行，失败当天不重试' : task.content.slice(0, 80) }} · v{{ task.version }}<template v-if="task.next_run_at"> · {{ new Date(task.next_run_at * 1000).toLocaleString() }}</template></span>
          </template>
          <template #actions>
            <NFlex align="center" justify="end" :size="12">
              <LsPageLink :href="`${prefix}/tasks/${task.id}`" :icon="ArrowUpRight" label="编辑" />
              <LsButton v-if="task.status === 'Active'" size="sm" variant="secondary" @click="action.mutate({ id: task.id, name: 'pause' })">暂停</LsButton>
              <LsButton
              v-else-if="task.status !== 'Cancelled'"
              size="sm"
              :disabled="Boolean(abilityDisabledReason)"
              :disabled-reason="abilityDisabledReason"
              @click="action.mutate({ id: task.id, name: task.status === 'Paused' ? 'start' : 'resume' })"
              >{{ task.status === 'Paused' ? '开启' : '恢复' }}</LsButton>
              <LsButton v-if="task.status !== 'Cancelled'" size="sm" variant="danger" @click="action.mutate({ id: task.id, name: 'cancel' })">取消</LsButton>
            </NFlex>
          </template>
        </LsResourceRow>
      </LsResourceList>
    </LsCollectionPage>
  </div>
</template>
