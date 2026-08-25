<script setup lang="ts">
import type { WeiboAccount } from '../types'
const props = defineProps<{ accounts: WeiboAccount[] }>()
const count = (state: WeiboAccount['health']) => props.accounts.filter(item => item.health === state).length
</script>
<template><section class="weibo-list" aria-label="账号健康摘要"><div class="weibo-list-row"><span class="weibo-status" data-tone="success">有效</span><strong class="weibo-numbers">{{ count('Valid') }}</strong></div><div class="weibo-list-row"><span class="weibo-status" data-tone="danger">失效</span><strong class="weibo-numbers">{{ count('Invalid') }}</strong></div><div class="weibo-list-row"><span class="weibo-status" data-tone="warning">未确认</span><strong class="weibo-numbers">{{ count('Unknown') + count('Unchecked') }}</strong></div></section></template>
