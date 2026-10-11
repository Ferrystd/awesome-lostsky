<script setup lang="ts">
import { useId } from 'vue'
import TeamSettingsNavigation from './TeamSettingsNavigation.vue'

defineProps<{
  items: { key: string; label: string; dirty: boolean }[]
  current: string
}>()
defineEmits<{ select: [key: string] }>()
const panelId = `settings-content-${useId()}`
</script>

<template>
  <div class="settings-center">
    <div class="settings-center__layout">
      <TeamSettingsNavigation :items="items" :current="current" :panel-id="panelId" @select="$emit('select', $event)" />
      <div :id="panelId" class="settings-center__content"><slot /></div>
    </div>
  </div>
</template>

<style scoped>
.settings-center { min-width: 0; container: team-settings-center / inline-size; }
.settings-center__layout { min-width: 0; display: grid; gap: 1.5rem; align-items: start; }
.settings-center__content { min-width: 0; }
@container team-settings-center (min-width: 48rem) {
  .settings-center__layout { grid-template-columns: 11.5rem minmax(0, 1fr); }
}
</style>
