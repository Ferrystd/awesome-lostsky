<script setup lang="ts">
import { friendlyError } from '@lostsky/api/client'
import { formatPermissionDenied } from '@lostsky/api/error-format'
import LsWorkspaceOverview from '@lostsky/ui/components/LsWorkspaceOverview.vue'
import { BadgeCheck, BarChart3, Handshake, House, ListChecks } from '@lucide/vue'
import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import { hasWorkspacePermission, loadWorkspaceAccess } from '../lib/workspace-access'

const access = useQuery({ queryKey: ['transaction-workspace-access'], queryFn: () => loadWorkspaceAccess() })
const identityType = computed(() => ({ team: 'Team Entity', teamMember: '团队成员', teamVirtual: '虚拟实体' })[access.data.value?.identity?.type ?? ''] || '当前 Entity')

function permissionReason(permission: string | null) {
  if (!permission) return ''
  if (access.isPending.value) return `正在核对 ${permission} Permission`
  if (access.isError.value) return friendlyError(access.error.value)
  return hasWorkspacePermission(access.data.value?.permissions ?? [], permission) ? '' : formatPermissionDenied([permission])
}

const entries = computed(() => [
  { key: 'transactions', label: '相关流水', description: '查看当前 Entity 参与、归属或处理的流水。', to: '/personal/transactions', icon: ListChecks, permission: 'transaction.read' },
  { key: 'stats', label: '我的业绩', description: '查看只归属于当前 Entity 的业绩结果。', to: '/personal/stats', icon: BarChart3, permission: 'transaction.report.read' },
  { key: 'services', label: '我的核销', description: '查看当前 Entity 作为处理者参与的核销。', to: '/personal/services', icon: BadgeCheck, permission: null },
  { key: 'bindings', label: '客户协作', description: '查看当前 Entity 参与的客户与发单绑定。', to: '/personal/bindings', icon: Handshake, permission: 'transaction.read' },
].map(item => {
  const reason = permissionReason(item.permission)
  return { ...item, disabled: Boolean(reason), reason }
}))
</script>

<template>
  <LsWorkspaceOverview
    :eyebrow="`${identityType} · ${access.data.value?.team?.name || '当前团队'}`"
    :title="access.data.value?.identity?.name || '正在读取当前 Entity'"
    :description="`记账个人工作台固定服务于当前身份${access.data.value?.identity?.slug ? ` @${access.data.value.identity.slug}` : ''}；流水、业绩、核销和客户协作只按其参与关系展示。`"
    :actions="[{ key: 'team', label: '进入团队工作台', to: '/overview', icon: House, primary: true }]"
    :entries="entries"
    :scope-notes="['个人范围由 JWT 中的 acting_entity 决定，页面不提供 Entity 筛选器。', '团队管理 Permission 不会扩大个人数据范围。', '概览本身不请求流水、统计、核销或绑定数据。']"
  />
</template>
