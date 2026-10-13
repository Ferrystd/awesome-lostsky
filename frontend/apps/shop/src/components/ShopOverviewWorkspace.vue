<script setup lang="ts">
import LsDashboardPath from '@lostsky/ui/components/LsDashboardPath.vue'
import LsDescriptionList from '@lostsky/ui/components/LsDescriptionList.vue'
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
      <div class="shop-overview-workspace">
        <LsPanel>
          <LsDashboardPath :title="personal ? '管理我的商品' : '管理商品'" description="直接创建商品；套餐和卡密可以选择其他商品作为子项。" :steps="steps" />
        </LsPanel>
        <div class="shop-overview-followup">
          <LsPanel>
            <template #header><LsSectionHeader :title="personal ? '我的业务订单' : '订单与履约'" :description="personal ? '跟进本人参与接单或发单的订单。' : '商品售出后，在订单中查看状态与履约记录。'" /></template>
            <div class="shop-order-desk"><p>继续跟进你的接单与接单情况。</p><LsPageLink :to="personal ? '/manage/personal/orders' : '/manage/orders'" :icon="ReceiptText" :label="personal ? '查看我的业务订单' : '查看团队订单'" /></div>
          </LsPanel>
          <LsPanel>
            <template #header><LsSectionHeader :title="personal ? '我的资源边界' : '当前工作身份'" description="确认当前身份与资源归属。" /></template>
            <LsDescriptionList><dt>当前身份</dt><dd>{{ access?.identity?.name || '-' }}</dd><dt>所属工作台</dt><dd>{{ access?.team?.name || '-' }}</dd></LsDescriptionList>
            <p class="shop-context-note">{{ personal ? '可组合本人和已启用的团队公用商品；个人商品不能转移归属或永久删除。' : '商品在团队范围管理，个人工作台用于维护自己的商品。' }}</p>
          </LsPanel>
        </div>
      </div>
</template>
<style scoped>
.shop-overview-workspace { display: grid; gap: 1rem; min-width: 0; }
.shop-overview-followup { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); gap: 1rem; }
.shop-order-desk { display: flex; align-items: center; flex-wrap: wrap; gap: 1rem; }
.shop-order-desk p { flex: 1 1 12rem; margin: 0; color: var(--muted-ink); line-height: 1.65; }
.shop-context-note { color: var(--muted-ink); font-size: .82rem; line-height: 1.6; }
.shop-context-note { margin: 1rem 0 0; }
@media (max-width: 799px) { .shop-overview-followup { grid-template-columns: minmax(0, 1fr); } }
</style>
