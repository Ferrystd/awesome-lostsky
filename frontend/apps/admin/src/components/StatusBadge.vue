<script setup lang="ts">
defineProps<{ status: 'active' | 'banned' | 'cancelled' | 'healthy' | 'degraded' | 'unhealthy' }>()
const labels = { active: '正常', banned: '已封禁', cancelled: '已注销', healthy: '正常', degraded: '需关注', unhealthy: '异常' }
</script>
<template><span :class="['status-badge', `status-badge--${status}`]"><i />{{ labels[status] }}</span></template>
