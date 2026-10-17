<script setup lang="ts">
import ShopOverviewWorkspace from '../../components/ShopOverviewWorkspace.vue'
import LsInlineError from '@lostsky/ui/components/LsInlineError.vue'
import { friendlyError } from '@lostsky/api/client'

import LsSinglePanelPage from '@lostsky/ui/components/LsSinglePanelPage.vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import LsSceneMotionControl from '@lostsky/ui/components/LsSceneMotionControl.vue'
import { ReceiptText, ShoppingBag, UserRound } from '@lucide/vue'
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { loadManageAccess } from '../../lib'

const access = useQuery({ queryKey: ['shop-manage-access'], queryFn: () => loadManageAccess() })

const entries = [
  { key: 'products', label: '商品', description: '维护可售商品、处理人和核销字段。', to: '/manage/products', icon: ShoppingBag },
  { key: 'orders', label: '订单', description: '查看团队订单并持续推进履约状态。', to: '/manage/orders', icon: ReceiptText },
]
const configurationSteps = computed(() => [{ key: 'create', label: '创建商品', description: '四种商品类型：普通商品、核销商品、卡密和套餐。', to: '/manage/products/new', icon: ShoppingBag }, entries[0]])
</script>

<template>
  <LsSinglePanelPage
    :title="access.data.value?.team?.name || (access.isError.value ? '团队摘要暂时不可用' : '正在读取当前团队…')"
    description="管理团队商品并跟进订单交付，覆盖普通商品、核销商品、卡密和套餐。"
  >
    <template #actions>
      <LsPageLink to="/manage/personal" :icon="UserRound" label="进入个人工作台" />
      <LsSceneMotionControl />
    </template>
      <ShopOverviewWorkspace :personal="false" :access="access.data.value" :steps="configurationSteps" />
      <LsInlineError v-if="access.isError.value" :message="friendlyError(access.error.value)" />
  </LsSinglePanelPage>
</template>
