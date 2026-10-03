<script setup lang="ts">
import LsButton from '@lostsky/ui/components/LsButton.vue'
import LsEmptyState from '@lostsky/ui/components/LsEmptyState.vue'
import { NList, NListItem, NTag } from 'naive-ui'
defineProps<{ participants: Array<{ slug: string; name: string; left_at?: number | null; status?: string }>; invitations: Array<{ slug: string; name: string }>; busy: boolean; disabledReason: string }>()
defineEmits<{ remove: [slug: string]; cancel: [slug: string] }>()
</script>
<template>
  <section><h2>群成员与邀请</h2>
    <NList v-if="participants.some(item => !item.left_at) || invitations.length">
      <NListItem v-for="person in participants.filter(item => !item.left_at)" :key="person.slug">{{ person.name }} · @{{ person.slug }}<template #suffix><LsButton variant="ghost" :loading="busy" :disabled="Boolean(disabledReason)" :disabled-reason="disabledReason" @click="$emit('remove', person.slug)">移出群聊</LsButton></template></NListItem>
      <NListItem v-for="person in invitations" :key="`invite-${person.slug}`">{{ person.name }} · @{{ person.slug }} <NTag>等待接受</NTag><template #suffix><LsButton variant="ghost" :loading="busy" :disabled="Boolean(disabledReason)" :disabled-reason="disabledReason" @click="$emit('cancel', person.slug)">撤销邀请</LsButton></template></NListItem>
    </NList>
    <LsEmptyState v-else title="暂无群成员" description="邀请人员后，对方确认才能加入。" />
  </section>
</template>
<style scoped>h2{font-size:1.1rem}</style>
