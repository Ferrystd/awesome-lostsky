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
const auroraId = `category-aurora-${useId()}`
</script>

<template>
  <div class="team-category-layout">
    <svg class="team-category-layout__aurora" viewBox="0 0 1200 360" preserveAspectRatio="xMidYMin slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient :id="`${auroraId}-curtain`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#75efd8" stop-opacity="0" />
          <stop offset=".68" stop-color="#36c8b7" stop-opacity=".16" />
          <stop offset="1" stop-color="#9fffe0" stop-opacity=".85" />
        </linearGradient>
        <linearGradient :id="`${auroraId}-edge`" x1="0" y1="0" x2="1" y2="0">
          <stop stop-color="#68e8c9" stop-opacity="0" />
          <stop offset=".3" stop-color="#a6ffe0" />
          <stop offset=".65" stop-color="#77dbea" />
          <stop offset="1" stop-color="#879ee8" stop-opacity="0" />
        </linearGradient>
        <filter :id="`${auroraId}-soft`" x="-.1" y="-.5" width="1.2" height="2"><feGaussianBlur stdDeviation="7" /></filter>
      </defs>
      <path d="M-100 -100H1300V80C1040 170 900 -30 650 52S280 144-100 60Z" :fill="`url(#${auroraId}-curtain)`" />
      <path d="M-100 60C280 144 400 134 650 52S1040 170 1300 80" fill="none" :stroke="`url(#${auroraId}-edge)`" stroke-width="22" :filter="`url(#${auroraId}-soft)`" opacity=".7" />
      <path d="M-100 60C280 144 400 134 650 52S1040 170 1300 80" fill="none" :stroke="`url(#${auroraId}-edge)`" stroke-width="1.5" opacity=".85" />
      <path d="M-100 -120H1300V18C1030 80 920 -40 700 15S300 114-100 10Z" :fill="`url(#${auroraId}-curtain)`" opacity=".45" />
    </svg>
    <div class="team-category-layout__layout">
      <TeamCategoryNavigation :items="items" :current="current" :label="label" :panel-id="panelId" @select="$emit('select', $event)" />
      <div :id="panelId" class="team-category-layout__content"><slot /></div>
    </div>
  </div>
</template>

<style scoped>
.team-category-layout { min-width: 0; container: team-category-layout / inline-size; position: relative; isolation: isolate; padding: 6rem 1.25rem 1.25rem; border-radius: var(--radius-lg); background: linear-gradient(180deg, #101e36 0, #17394a 3rem, #dcebef 6rem, #edf4f5 12rem); }
.team-category-layout__aurora { position: absolute; inset: 0 0 auto; z-index: -1; width: 100%; height: 22.5rem; max-height: 100%; border-radius: var(--radius-lg); pointer-events: none; }
.team-category-layout__layout { min-width: 0; display: grid; gap: 1.5rem; align-items: start; }
.team-category-layout__content { min-width: 0; }
@media (max-width: 639px) {
  .team-category-layout { padding: 5rem .75rem .75rem; }
}
@container team-category-layout (min-width: 48rem) {
  .team-category-layout__layout { grid-template-columns: 11.5rem minmax(0, 1fr); }
}
</style>
