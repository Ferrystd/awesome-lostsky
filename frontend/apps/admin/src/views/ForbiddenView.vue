<script setup lang="ts">
import { auth } from '@lostsky/api/client'
import { redirectToLogin } from '@lostsky/shared/navigation'
import { ShieldX } from '@lucide/vue'
import { NButton } from 'naive-ui'
function leave(){auth.clear();redirectToLogin()}
</script>
<template><section class="panel state forbidden"><ShieldX :size="36" /><h1>你没有进入平台管理后台的权限</h1><p>当前账号未绑定有效的平台管理员角色。请联系超级管理员，或使用其他账号登录。</p><NButton type="primary" @click="leave">返回账号登录</NButton></section></template>
<style scoped>.forbidden{padding-block:72px}.forbidden svg{color:var(--sky-lost-strong)}.forbidden h1{margin:12px 0 6px;font-size:1.3rem}.forbidden p{max-width:54ch;margin:0 auto 20px}</style>
