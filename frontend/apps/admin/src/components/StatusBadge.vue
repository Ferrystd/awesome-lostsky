<script setup lang="ts">
import { NTag } from 'naive-ui'
import { computed } from 'vue'

const props = defineProps<{ status: 'active' | 'banned' | 'cancelled' | 'healthy' | 'degraded' | 'unhealthy' }>()
const labels = { active: '正常', banned: '已封禁', cancelled: '已注销', healthy: '正常', degraded: '需关注', unhealthy: '异常' }
const type = computed(() => props.status === 'active' || props.status === 'healthy' ? 'success' : props.status === 'banned' || props.status === 'unhealthy' ? 'error' : 'warning')
</script>
<template><NTag :type="type" size="small" :bordered="false">{{ labels[status] }}</NTag></template>
