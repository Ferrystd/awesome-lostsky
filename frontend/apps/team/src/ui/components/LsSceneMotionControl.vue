<script setup lang="ts">
import { Pause, Play } from '@lucide/vue'
import LsButton from './LsButton.vue'
import { useWorkspaceScene } from '../workspace-scene'

const { paused, available } = useWorkspaceScene()
</script>

<template>
  <div v-if="available" class="team-category-layout__motion">
    <LsButton variant="ghost" :aria-pressed="paused" @click="paused = !paused">
      <template #icon><Play v-if="paused" :size="16" /><Pause v-else :size="16" /></template>
      {{ paused ? '播放极光' : '暂停极光' }}
    </LsButton>
  </div>
</template>

<style scoped>
.team-category-layout__motion { margin-top: .75rem; }
@media (prefers-reduced-motion: reduce) {
  .team-category-layout__motion { display: none; }
}
</style>
