<script setup lang="ts">
import WorkspaceAuroraBackdrop from '../workspace-scene/WorkspaceAuroraBackdrop.vue'
</script>

<template>
  <div class="team-scene">
    <WorkspaceAuroraBackdrop />
    <slot />
  </div>
</template>

<style scoped>
.team-scene { min-width: 0; position: relative; isolation: isolate; }
</style>
