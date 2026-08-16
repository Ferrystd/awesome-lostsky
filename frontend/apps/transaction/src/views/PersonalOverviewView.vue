<script setup lang="ts">
import LsWorkspaceOverview from '@lostsky/ui/components/LsWorkspaceOverview.vue'
import { BadgeCheck, Gift, Handshake, House, ListChecks } from '@lucide/vue'
import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import { loadWorkspaceAccess } from '../lib/workspace-access'

const access = useQuery({ queryKey: ['transaction-workspace-access'], queryFn: () => loadWorkspaceAccess() })
const identityType = computed(() => ({ team: '团队实体', teamMember: '团队成员', teamVirtual: '虚拟实体' })[access.data.value?.identity?.type ?? ''] || '当前实体')

const entries = [
  { key: 'transactions', label: '我的流水', description: '集中查看当前实体（Entity）的角色笔数、月度数据与参与流水。', to: '/personal/transactions', icon: ListChecks },
  { key: 'services', label: '我的接单', description: '查看当前实体作为处理者参与的履约任务。', to: '/personal/services', icon: BadgeCheck },
  { key: 'customers', label: '我的顾客', description: '查看当前实体负责或协作发单的顾客。', to: '/personal/customers', icon: Handshake },
  { key: 'entitlement-grant', label: '权益下发', description: '查看当前实体已下发的权益，并继续为接待的顾客下发。', to: '/personal/entitlements', icon: Gift },
]
</script>

<template>
  <LsWorkspaceOverview
    :eyebrow="`${identityType} · ${access.data.value?.team?.name || '当前团队'}`"
    :title="access.data.value?.identity?.name || '正在读取当前实体'"
    :description="`记账个人工作台固定服务于当前身份${access.data.value?.identity?.slug ? ` @${access.data.value.identity.slug}` : ''}；业绩与流水在同一入口展示，接单、顾客和权益下发只按其参与关系展示。`"
    :actions="[{ key: 'team', label: '进入团队工作台', to: '/overview', icon: House, primary: true }]"
    :entries="entries"
    :scope-notes="['个人范围由 JWT 中的 acting_entity 决定，页面不提供实体筛选器。', '本人相关业务不要求团队全量权限（Permission），团队管理权限也不会扩大个人数据范围。', '概览本身不请求流水、统计、核销、顾客或权益记录。']"
  />
</template>
