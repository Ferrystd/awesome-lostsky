<script setup lang="ts">
import { useId } from 'vue'
import LsSceneMotionControl from '@lostsky/ui/components/LsSceneMotionControl.vue'
import TeamCategoryNavigation from './TeamCategoryNavigation.vue'

defineProps<{
  items: { key: string; label: string; dirty?: boolean; to?: string }[]
  current: string
  label: string
}>()
defineEmits<{ select: [key: string] }>()
const panelId = `settings-content-${useId()}`
</script>

<template>
  <div class="team-category-layout">
    <div class="team-category-layout__layout">
      <div class="team-category-layout__navigation">
      <TeamCategoryNavigation :items="items" :current="current" :label="label" :panel-id="panelId" @select="$emit('select', $event)" />
    <LsSceneMotionControl />
      </div>
      <div :id="panelId" class="team-category-layout__content"><slot /></div>
    </div>
  </div>
</template>

<style scoped>
.team-category-layout { min-width: 0; container: team-category-layout / inline-size; padding: 1.25rem;  }
.team-category-layout__layout { min-width: 0; display: grid; gap: 1.5rem; align-items: start; }
.team-category-layout__content { min-width: 0; }
@media (max-width: 639px) {
  .team-category-layout { padding: .75rem; }
}
@container team-category-layout (min-width: 48rem) {
  .team-category-layout__layout { grid-template-columns: 11.5rem minmax(0, 1fr); }
}
</style>
