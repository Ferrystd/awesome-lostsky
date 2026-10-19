<script setup lang="ts">
import { auth } from '@lostsky/api/client'
import { redirectToLogin } from '@lostsky/shared/navigation'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsSinglePanelPage from '@lostsky/ui/components/LsSinglePanelPage.vue'
import { ShieldX } from '@lucide/vue'
function leave(){auth.clear();redirectToLogin()}
</script>
<template><LsSinglePanelPage title="你没有进入平台管理后台的权限" description="当前账号未绑定有效的平台管理员角色。请联系超级管理员，或使用其他账号登录。"><LsButton @click="leave"><template #icon><ShieldX :size="18" /></template>返回账号登录</LsButton></LsSinglePanelPage></template>
