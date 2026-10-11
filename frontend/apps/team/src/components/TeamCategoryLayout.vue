<script setup lang="ts">
import { ref, useId } from 'vue'
import { Pause, Play } from '@lucide/vue'
import LsButton from '@lostsky/ui/components/LsButton.vue'
import TeamAuroraBackdrop from './TeamAuroraBackdrop.vue'
import TeamCategoryNavigation from './TeamCategoryNavigation.vue'

defineProps<{
  items: { key: string; label: string; dirty?: boolean; to?: string }[]
  current: string
  label: string
}>()
defineEmits<{ select: [key: string] }>()
const panelId = `settings-content-${useId()}`
const paused = ref(false)
const available = ref(false)
</script>

<template>
  <div class="team-category-layout">
    <TeamAuroraBackdrop :paused="paused" @available="available = $event" />
    <div v-if="available" class="team-category-layout__motion">
      <LsButton variant="secondary" :aria-pressed="paused" @click="paused = !paused">
        <template #icon><Play v-if="paused" :size="16" /><Pause v-else :size="16" /></template>
        {{ paused ? '播放极光' : '暂停极光' }}
      </LsButton>
    </div>
    <div class="team-category-layout__layout">
      <TeamCategoryNavigation :items="items" :current="current" :label="label" :panel-id="panelId" @select="$emit('select', $event)" />
      <div :id="panelId" class="team-category-layout__content"><slot /></div>
    </div>
  </div>
</template>

<style scoped>
.team-category-layout { min-width: 0; container: team-category-layout / inline-size; position: relative; isolation: isolate; padding: 12rem 1.25rem 1.25rem; border-radius: var(--radius-lg); background: #050a13; }
.team-category-layout__motion { position: absolute; top: 1rem; right: 1rem; }
.team-category-layout__layout { min-width: 0; display: grid; gap: 1.5rem; align-items: start; }
.team-category-layout__content { min-width: 0; }
@media (prefers-reduced-motion: reduce) {
  .team-category-layout__motion { display: none; }
}
@media (max-width: 639px) {
  .team-category-layout { padding: 9rem .75rem .75rem; }
}
@container team-category-layout (min-width: 48rem) {
  .team-category-layout__layout { grid-template-columns: 11.5rem minmax(0, 1fr); }
}
</style>
