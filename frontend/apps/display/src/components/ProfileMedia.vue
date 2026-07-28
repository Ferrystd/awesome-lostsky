<script setup lang="ts">
import type { PublicProfile } from '../types'

defineProps<{ profile: PublicProfile }>()
</script>

<template>
  <div v-if="profile.intro_video" class="profile-media">
    <video
      :src="profile.intro_video"
      controls
      playsinline
      preload="metadata"
      :aria-label="`${profile.name} 的介绍视频`"
    />
  </div>
</template>
