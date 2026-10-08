<script setup lang="ts">
import type { CommunityPost, CommunityBoard } from '@lostsky/api/community'
import { MessageCircle, Heart } from '@lucide/vue'
import { NList, NListItem, NTag, NFlex } from 'naive-ui'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import LsEmptyState from '../components/LsEmptyState.vue'
import CommunityPostMeta from './CommunityPostMeta.vue'
withDefaults(defineProps<{ posts: CommunityPost[]; basePath: string; boards?: CommunityBoard[]; filtered?: boolean }>(), { boards: () => [], filtered: false })
function excerpt(content: string) { const html = marked.parse(content, { async: false }); const element = document.createElement('div'); element.innerHTML = DOMPurify.sanitize(html); return (element.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 180) }
</script>
<template>
  <LsEmptyState v-if="!posts.length" :title="filtered ? '没有符合条件的帖子' : '讨论从第一篇帖子开始'" :description="filtered ? '换个搜索词或选择全部板块，继续发现讨论。' : '加入社区后，分享经验、提出问题，发起第一场讨论。'" />
  <NList v-else bordered>
    <NListItem v-for="post in posts" :key="post.id"><article class="community-post-row">
      <CommunityPostMeta :author="post.author" :time="post.create_time" />
      <div class="community-post-row__heading"><NTag v-if="post.pinned" size="small" type="info">置顶</NTag><NTag v-if="post.status === 'Hidden'" type="warning" size="small">已隐藏</NTag><h2><RouterLink :to="`${basePath}/posts/${post.id}`">{{ post.status === 'Deleted' ? '作者已删除的帖子' : post.title }}</RouterLink></h2></div>
      <p v-if="post.status === 'Visible' && post.content" class="community-post-row__excerpt">{{ excerpt(post.content) }}</p>
      <NFlex align="center" justify="space-between"><span class="community-post-row__board">{{ boards.find(board => board.id === post.board_id)?.name }}</span><div class="community-post-row__counts"><span><MessageCircle :size="16" aria-hidden="true" />{{ post.comment_count }} 条评论</span><span><Heart :size="16" aria-hidden="true" />{{ post.like_count }} 人点赞</span></div></NFlex>
    </article></NListItem>
  </NList>
</template>
<style scoped>.community-post-row{display:grid;gap:.75rem;min-width:0;padding:.25rem 0}.community-post-row__heading{display:flex;align-items:center;gap:.5rem;flex-wrap:wrap}.community-post-row h2{margin:0;min-width:0;font-size:1.0625rem;font-weight:650;line-height:1.5;overflow-wrap:anywhere}.community-post-row h2 a{display:inline-flex;align-items:center;min-height:44px}.community-post-row h2 a:hover{color:var(--primary)}.community-post-row__excerpt{margin:0;color:var(--text-secondary);line-height:1.75;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}.community-post-row__counts{display:flex;align-items:center;gap:1rem;flex-wrap:wrap;color:var(--text-secondary);font-size:.8125rem}.community-post-row__counts span{display:inline-flex;align-items:center;gap:.375rem}.community-post-row__board{font-size:.8125rem;color:var(--primary)}</style>
