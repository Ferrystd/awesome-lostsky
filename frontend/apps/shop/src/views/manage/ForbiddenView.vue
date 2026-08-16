<script setup lang="ts">
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
</script>
<template><LsEmptyState title="没有商城管理权限" description="当前 Entity 未获得对应的商品或订单权限。请切换身份，或联系团队管理员调整角色。"><template #action><a class="secondary-link" href="/">返回商城前台</a></template></LsEmptyState></template>
