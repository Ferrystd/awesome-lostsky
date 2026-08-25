<script setup lang="ts">
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import type { WeiboOperation } from '../types'
defineProps<{ operations: WeiboOperation[] }>()
const labels = { Post: '发帖', Like: '点赞', Comment: '评论', Checkin: '签到' }
const tones = { Succeeded: 'success', Failed: 'danger', Unknown: 'warning', Dispatching: 'warning' }
const status = { Succeeded: '成功', Failed: '失败', Unknown: '结果未确认', Dispatching: '执行中' }
</script>
<template><LsEmptyState v-if="!operations.length" title="暂无执行记录" description="手动操作或调度执行后，最近 30 天的最小结构化结果会显示在这里。" /><div v-else class="weibo-list"><article v-for="item in operations" :key="item.id" class="weibo-list-row"><div><p><strong>{{ labels[item.operation_type] }}</strong> · {{ item.source === 'Schedule' ? '调度' : '手动' }}</p><small>{{ item.content_summary || item.target_id || '无内容摘要' }} · {{ new Date(item.started_at*1000).toLocaleString() }}</small><small v-if="item.remote_message"><br>{{ item.reason }}：{{ item.remote_message }}</small></div><span class="weibo-status" :data-tone="tones[item.status]">{{ status[item.status] }}</span></article></div></template>
