<script setup lang="ts">
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import { NList, NListItem, NThing } from 'naive-ui'
defineProps<{ messages: Array<{ id: number; content: string | null; sender: { name: string }; create_time: number; revoked_at: number | null }>; busy: boolean; disabledReason: string; hasOlder: boolean }>()
defineEmits<{ revoke: [id: number]; older: [] }>()
function time(value: number) { return new Date(value * 1000).toLocaleString('zh-CN') }
</script>
<template>
  <section><h2>历史消息</h2>
    <LsButton v-if="hasOlder" variant="secondary" :loading="busy" @click="$emit('older')">加载更早消息</LsButton>
    <NList v-if="messages.length"><NListItem v-for="message in messages" :key="message.id"><NThing :title="message.sender.name" :description="time(message.create_time)"><p class="message-content">{{ message.revoked_at ? '消息已撤回' : message.content }}</p></NThing><template v-if="!message.revoked_at" #suffix><LsButton variant="ghost" :disabled="Boolean(disabledReason)" :disabled-reason="disabledReason" :loading="busy" @click="$emit('revoke', message.id)">撤回</LsButton></template></NListItem></NList>
    <LsEmptyState v-else title="暂无消息" description="成员发送消息后会显示在这里。" />
  </section>
</template>
<style scoped>h2{font-size:1.1rem}.message-content{white-space:pre-wrap;overflow-wrap:anywhere}</style>
