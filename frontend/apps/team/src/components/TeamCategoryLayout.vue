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
  horizontal?: boolean
}>()
defineEmits<{ select: [key: string] }>()
const panelId = `settings-content-${useId()}`
const paused = ref(false)
const available = ref(false)
</script>

<template>
  <div :class="['team-category-layout', { 'team-category-layout--horizontal': horizontal }]">
    <TeamAuroraBackdrop :paused="paused" @available="available = $event" />
    <div class="team-category-layout__layout">
      <div class="team-category-layout__navigation">
      <TeamCategoryNavigation :horizontal="horizontal" :items="items" :current="current" :label="label" :panel-id="panelId" @select="$emit('select', $event)" />
    <div v-if="available" class="team-category-layout__motion">
      <LsButton variant="secondary" :aria-pressed="paused" @click="paused = !paused">
        <template #icon><Play v-if="paused" :size="16" /><Pause v-else :size="16" /></template>
        {{ paused ? '播放极光' : '暂停极光' }}
      </LsButton>
    </div>
      </div>
      <div :id="panelId" class="team-category-layout__content"><slot /></div>
    </div>
  </div>
</template>

<style scoped>
.team-category-layout { min-width: 0; container: team-category-layout / inline-size; position: relative; isolation: isolate; padding: 1.25rem;  }
.team-category-layout__motion { margin-top: .75rem; }
.team-category-layout__layout { min-width: 0; display: grid; gap: 1.5rem; align-items: start; }
.team-category-layout__content { min-width: 0; }
@media (prefers-reduced-motion: reduce) {
  .team-category-layout__motion { display: none; }
}
@media (max-width: 639px) {
  .team-category-layout { padding: .75rem; }
}
@container team-category-layout (min-width: 48rem) {
  .team-category-layout__layout { grid-template-columns: 11.5rem minmax(0, 1fr); }
}
.team-category-layout--horizontal { padding: 0; }
.team-category-layout--horizontal .team-category-layout__layout { grid-template-columns: minmax(0, 1fr); }
.team-category-layout--horizontal .team-category-layout__navigation { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .5rem; }
.team-category-layout--horizontal .team-category-layout__motion { margin: 0; }
</style>
