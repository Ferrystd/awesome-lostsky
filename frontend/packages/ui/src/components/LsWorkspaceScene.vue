<script setup lang="ts">
import { provide, ref } from 'vue'
import WorkspaceAuroraBackdrop from '../workspace-scene/WorkspaceAuroraBackdrop.vue'
import { workspaceSceneKey } from '../workspace-scene'
const paused = ref(false)
const available = ref(false)
provide(workspaceSceneKey, { paused, available })
</script>

<template>
  <div class="team-scene">
    <WorkspaceAuroraBackdrop :paused="paused" @available="available = $event" />
    <slot />
  </div>
</template>

<style scoped>
.team-scene { min-width: 0; position: relative; isolation: isolate; }
</style>
