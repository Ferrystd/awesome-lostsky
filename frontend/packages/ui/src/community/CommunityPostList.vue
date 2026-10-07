<script setup lang="ts">
import { formatDate } from '@lostsky/shared/format'
import type { CommunityPost } from '@lostsky/api/community'
import { NList, NListItem, NTag, NThing, NSpace } from 'naive-ui'
import LsEmptyState from '../components/LsEmptyState.vue'
defineProps<{ posts: CommunityPost[]; basePath: string }>()
</script>
<template>
  <LsEmptyState v-if="!posts.length" title="还没有帖子" description="选择其他板块，或加入社区后发起第一场讨论。" />
  <NList v-else bordered>
    <NListItem v-for="post in posts" :key="post.id">
      <NThing>
        <template #header><RouterLink :to="`${basePath}/posts/${post.id}`">{{ post.status === 'Deleted' ? '作者已删除的帖子' : post.title }}</RouterLink></template>
        <template #description><NSpace><span>{{ post.author.name }}</span><time>{{ formatDate(post.create_time * 1000) }}</time><span>{{ post.comment_count }} 条评论</span><span>{{ post.like_count }} 人点赞</span></NSpace></template>
        <template #header-extra><NSpace><NTag v-if="post.pinned" size="small">置顶</NTag><NTag v-if="post.status === 'Hidden'" type="warning" size="small">已隐藏</NTag></NSpace></template>
      </NThing>
    </NListItem>
  </NList>
</template>
