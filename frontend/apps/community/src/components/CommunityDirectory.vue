<script setup lang="ts">
import type { Community } from '@lostsky/api/community'
import { NList, NListItem, NThing, NTag, NSpace, NAvatar } from 'naive-ui'
defineProps<{ communities: Community[] }>()
</script>
<template>
  <NList bordered><NListItem v-for="community in communities" :key="community.id"><NThing>
    <template #avatar><NAvatar :size="48" :bordered="true">{{ community.name.slice(0, 1) }}</NAvatar></template>
    <template #header><RouterLink class="community-directory-link" :to="`/c/${community.slug}`">{{ community.name }}</RouterLink></template>
    <template #description><NSpace align="center"><span>{{ community.owner?.name || 'LostSky 平台' }}</span><NTag v-if="community.is_official" type="info" size="small">官方</NTag><NTag v-if="community.is_joined" type="success" size="small">已加入</NTag><NTag v-if="community.status === 'Paused'" size="small">已暂停</NTag></NSpace></template>
    <p class="community-directory-description">{{ community.description || '欢迎加入，一起交流。' }}</p>
    <template #action><RouterLink class="community-directory-link" :to="`/c/${community.slug}`">进入社区<span aria-hidden="true"> →</span></RouterLink></template>
  </NThing></NListItem></NList>
</template>
<style scoped>
.community-directory-link{display:inline-flex;align-items:center;min-height:44px;overflow-wrap:anywhere;color:var(--primary);font-weight:600}.community-directory-description{margin:.5rem 0 0;line-height:1.75;overflow-wrap:anywhere;color:var(--text-secondary)}
</style>
