<script setup lang="ts">
import LsOverviewLinks from '@lostsky/ui/components/LsOverviewLinks.vue'
import LsPanel from '@lostsky/ui/components/LsPanel.vue'
import LsSectionHeader from '@lostsky/ui/components/LsSectionHeader.vue'
import LsPageLink from '@lostsky/ui/components/LsPageLink.vue'
import { ReceiptText } from '@lucide/vue'
import type { Component } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import type { ManageAccess } from '../types'
defineProps<{ personal: boolean; access?: ManageAccess; steps: { key: string; label: string; description: string; to: RouteLocationRaw; icon: Component }[] }>()
</script>
<template>
  <LsPanel>
    <template #header><LsSectionHeader :title="personal ? '经营我的商品' : '经营团队商品'" description="创建和维护商品，持续跟进订单履约。" /></template>
    <LsOverviewLinks :label="personal ? '个人商品入口' : '团队商品入口'" :entries="steps" />
    <template #footer>
      <LsSectionHeader :title="personal ? '我的业务订单' : '订单与履约'" :heading-level="3" :description="personal ? '跟进本人参与接单或发单的订单。' : '商品售出后，在订单中查看状态与履约记录。'">
        <template #aside><LsPageLink :to="personal ? '/manage/personal/orders' : '/manage/orders'" :icon="ReceiptText" :label="personal ? '查看我的业务订单' : '查看团队订单'" /></template>
      </LsSectionHeader>
      <p class="shop-context-note">{{ personal ? '可组合本人和已启用的团队公用商品；个人商品不能转移归属或永久删除。' : '商品在团队范围管理，个人工作台用于维护自己的商品。' }}</p>
    </template>
  </LsPanel>
</template>
<style scoped>
.shop-context-note { margin: .75rem 0 0; color: var(--text-secondary); font-size: .8125rem; line-height: 1.6; overflow-wrap: anywhere; }
</style>
