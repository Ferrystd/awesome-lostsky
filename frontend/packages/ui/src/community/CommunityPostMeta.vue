<script setup lang="ts">
import type { CommunityEntity } from '@lostsky/api/community'
import { formatDate } from '@lostsky/shared/format'
import { NAvatar } from 'naive-ui'
defineProps<{ author: CommunityEntity; time: number }>()
</script>
<template><div class="community-post-meta"><NAvatar round :size="32" :src="author.avatar || undefined">{{ author.name.slice(0, 1) }}</NAvatar><span class="community-post-meta__name">{{ author.name }}</span><time :datetime="new Date(time * 1000).toISOString()">{{ formatDate(time * 1000) }}</time></div></template>
<style scoped>.community-post-meta{display:flex;align-items:center;flex-wrap:wrap;gap:.5rem .75rem;min-width:0;font-size:.8125rem;color:var(--text-secondary)}.community-post-meta__name{color:var(--text);font-weight:600;overflow-wrap:anywhere}.community-post-meta time{font-variant-numeric:tabular-nums}</style>
