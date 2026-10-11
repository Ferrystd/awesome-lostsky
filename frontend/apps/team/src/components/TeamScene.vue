<script setup lang="ts">
import { provide, ref } from 'vue'
import TeamAuroraBackdrop from './TeamAuroraBackdrop.vue'
import { teamSceneKey } from './team-scene'
const paused = ref(false)
const available = ref(false)
provide(teamSceneKey, { paused, available })
</script>

<template>
  <div class="team-scene">
    <TeamAuroraBackdrop :paused="paused" @available="available = $event" />
    <slot />
  </div>
</template>

<style scoped>
.team-scene { min-width: 0; position: relative; isolation: isolate; }
</style>
