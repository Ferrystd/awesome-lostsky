<script setup lang="ts">
import { friendlyError } from '@lostsky/api/client'
import { formatPermissionDenied } from '@lostsky/api/error-format'
import LsWorkspaceOverview from '@lostsky/ui/components/LsWorkspaceOverview.vue'
import { BadgeCheck, BarChart3, CircleDollarSign, ListChecks, UserRound } from '@lucide/vue'
import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import { hasWorkspacePermission, loadWorkspaceAccess, serviceRedemptionReadPermissions, workspacePermissionKeys, type WorkspacePermissionRequirement } from '../lib/workspace-access'

const access = useQuery({ queryKey: ['transaction-workspace-access'], queryFn: () => loadWorkspaceAccess() })

function permissionReason(permission: WorkspacePermissionRequirement | null) {
  if (!permission) return ''
  if (access.isPending.value) return `正在核对权限：${workspacePermissionKeys(permission).join(' / ')}`
  if (access.isError.value) return friendlyError(access.error.value)
  return hasWorkspacePermission(access.data.value?.permissions ?? [], permission) ? '' : formatPermissionDenied(workspacePermissionKeys(permission))
}

const entries = computed(() => [
  { key: 'transactions', label: '团队流水', description: '查看团队收入、支出与调整记录。', to: '/', icon: ListChecks, permission: 'transaction.read' },
  { key: 'stats', label: '经营统计', description: '查看团队收入结构与业绩汇总。', to: '/stats', icon: BarChart3, permission: 'transaction.report.read' },
  { key: 'services', label: '权益核销', description: '处理服务实例并记录核销过程。', to: '/services', icon: BadgeCheck, permission: serviceRedemptionReadPermissions },
  { key: 'balances', label: '顾客余额', description: '查看余额、明细并按权限（Permission）执行充值。', to: '/balances', icon: CircleDollarSign, permission: 'transaction.read' },
].map(item => {
  const reason = permissionReason(item.permission)
  return { ...item, disabled: Boolean(reason), reason }
}))
</script>

<template>
  <LsWorkspaceOverview
    eyebrow="记账团队工作台"
    :title="access.data.value?.team?.name || (access.isError.value ? '团队摘要暂时不可用' : '正在读取当前团队…')"
    description="从流水到接单和我的顾客，按经营任务进入对应区域；不可用入口会保留并说明所需权限。"
    :actions="[{ key: 'personal', label: '进入个人工作台', to: '/personal', icon: UserRound, primary: true }]"
    :entries="entries"
    :scope-notes="['团队概览只读取访问快照，不请求流水、统计、核销或余额数据。', '具体业务页继续执行记账能力（Ability）、权限与服务端数据范围校验。']"
  />
</template>
