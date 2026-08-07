<script setup lang="ts">
import LsWorkspaceOverview from '@lostsky/ui/components/LsWorkspaceOverview.vue'
import { BadgeCheck, BarChart3, CircleDollarSign, Handshake, ListChecks, UserRound } from '@lucide/vue'
import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import { hasWorkspacePermission, loadWorkspaceAccess } from '../lib/workspace-access'

const access = useQuery({ queryKey: ['transaction-workspace-access'], queryFn: () => loadWorkspaceAccess() })

function permissionReason(permission: string | null) {
  if (!permission) return ''
  if (access.isPending.value) return `正在核对 ${permission} Permission`
  if (access.isError.value) return `暂时无法核对 ${permission} Permission`
  return hasWorkspacePermission(access.data.value?.permissions ?? [], permission) ? '' : `缺少 ${permission} Permission`
}

const entries = computed(() => [
  { key: 'transactions', label: '流水', description: '查看团队收入、支出与调整记录。', to: '/', icon: ListChecks, permission: 'transaction.read' },
  { key: 'stats', label: '经营统计', description: '查看团队收入结构与业绩汇总。', to: '/stats', icon: BarChart3, permission: 'transaction.report.read' },
  { key: 'services', label: '服务核销', description: '处理服务实例并记录核销过程。', to: '/services', icon: BadgeCheck, permission: null },
  { key: 'bindings', label: '发单绑定', description: '维护客户与发单 Entity 的协作关系。', to: '/bindings', icon: Handshake, permission: 'transaction.read' },
  { key: 'balances', label: '客户余额', description: '查看余额、明细并按权限执行充值。', to: '/balances', icon: CircleDollarSign, permission: 'transaction.read' },
].map(item => {
  const reason = permissionReason(item.permission)
  return { ...item, disabled: Boolean(reason), reason }
}))
</script>

<template>
  <LsWorkspaceOverview
    eyebrow="记账团队工作台"
    :title="access.data.value?.team?.name || (access.isError.value ? '团队摘要暂时不可用' : '正在读取当前团队…')"
    description="从流水到核销和客户协作，按经营任务进入对应区域；不可用入口会保留并说明所需 Permission。"
    :actions="[{ key: 'personal', label: '进入个人工作台', to: '/personal', icon: UserRound, primary: true }]"
    :entries="entries"
    :scope-notes="['团队概览只读取访问快照，不请求流水、统计、核销或余额数据。', '具体业务页继续执行 transaction Ability、Permission 与服务端数据范围校验。']"
  />
</template>
