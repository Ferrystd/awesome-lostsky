<script setup lang="ts">
import type { WeiboTask } from '../types'
const props = defineProps<{ tasks: WeiboTask[] }>()
const count = (...states: WeiboTask['status'][]) => props.tasks.filter(item => states.includes(item.status)).length
</script>
<template><section class="weibo-list" aria-label="任务状态摘要"><div class="weibo-list-row"><span class="weibo-status" data-tone="success">运行中</span><strong>{{ count('Active') }}</strong></div><div class="weibo-list-row"><span class="weibo-status">已暂停</span><strong>{{ count('Paused') }}</strong></div><div class="weibo-list-row"><span class="weibo-status" data-tone="danger">已阻塞</span><strong>{{ count('BlockedLogin','BlockedAbility') }}</strong></div></section></template>
