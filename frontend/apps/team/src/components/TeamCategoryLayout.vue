<script setup lang="ts">
import { useId } from 'vue'
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
      <TeamCategoryNavigation :items="items" :current="current" :label="label" :panel-id="panelId" @select="$emit('select', $event)" />
      <div :id="panelId" class="team-category-layout__content"><slot /></div>
    </div>
  </div>
</template>

<style scoped>
.team-category-layout { min-width: 0; container: team-category-layout / inline-size; position: relative; isolation: isolate; }
.team-category-layout::before { content: ''; position: absolute; inset: 0; z-index: -1; pointer-events: none; border-radius: var(--radius-lg); background: radial-gradient(ellipse at 8% 12%, color-mix(in oklch, var(--primary) 6%, transparent), transparent 58%), radial-gradient(ellipse at 82% 65%, color-mix(in oklch, var(--primary) 4%, transparent), transparent 62%); }
.team-category-layout__layout { min-width: 0; display: grid; gap: 1.5rem; align-items: start; }
.team-category-layout__content { min-width: 0; }
@container team-category-layout (min-width: 48rem) {
  .team-category-layout__layout { grid-template-columns: 11.5rem minmax(0, 1fr); }
}
</style>
