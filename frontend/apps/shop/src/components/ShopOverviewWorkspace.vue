<script setup lang="ts">
import LsResourceList from '@lostsky/ui/components/LsResourceList.vue'
import LsResourceRow from '@lostsky/ui/components/LsResourceRow.vue'
import LsDescriptionList from '@lostsky/ui/components/LsDescriptionList.vue'
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
    <section class="shop-overview-section" aria-labelledby="shop-scope-title">
      <LsSectionHeader id="shop-scope-title" :title="personal ? '我的资源边界' : '当前工作身份'" :description="personal ? '可组合本人和已启用的团队公用商品；个人商品不能转移归属或永久删除。' : '商品在团队范围管理，个人工作台用于维护自己的商品。'" />
      <LsDescriptionList><dt>当前身份</dt><dd>{{ access?.identity?.name || '-' }}</dd><dt>所属工作台</dt><dd>{{ access?.team?.name || '-' }}</dd></LsDescriptionList>
    </section>
    <section class="shop-overview-section" aria-labelledby="shop-products-title">
      <LsSectionHeader id="shop-products-title" :title="personal ? '管理我的商品' : '管理商品'" description="直接创建商品；套餐和卡密可以选择其他商品作为子项。" />
      <LsResourceList>
        <LsResourceRow v-for="step in steps" :key="step.key" :title="step.label" :description="step.description" :to="step.to" :icon="step.icon" />
      </LsResourceList>
    </section>
    <section class="shop-order-desk" aria-label="订单入口">
      <LsSectionHeader :title="personal ? '我的业务订单' : '订单与履约'" :description="personal ? '跟进本人参与接单或发单的订单。' : '商品售出后，在订单中查看状态与履约记录。'" />
      <LsPageLink :to="personal ? '/manage/personal/orders' : '/manage/orders'" :icon="ReceiptText" :label="personal ? '查看我的业务订单' : '查看团队订单'" />
    </section>
  </div>
</template>
<style scoped>
.shop-overview-workspace { display: grid; gap: 1.5rem; min-width: 0; }
.shop-overview-section { display: grid; gap: 1rem; min-width: 0; }
.shop-order-desk { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: .75rem 1.5rem; min-width: 0; }
</style>
