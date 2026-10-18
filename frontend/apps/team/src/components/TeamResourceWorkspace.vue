<script setup lang="ts">
import LsPageHeader from '@lostsky/ui/components/LsPageHeader.vue'
import LsSceneMotionControl from '@lostsky/ui/components/LsSceneMotionControl.vue'
defineProps<{ title: string; description: string; contextLabel: string }>()
</script>

<template>
  <div class="team-resource-workspace">
    <LsPageHeader :title="title" :description="description">
      <template #actions><LsSceneMotionControl /><slot name="actions" /></template>
    </LsPageHeader>
    <div class="team-resource-workspace__body">
      <aside v-if="$slots.filters" class="team-resource-workspace__filters" :aria-label="contextLabel"><slot name="filters" /></aside>
      <section class="team-resource-workspace__main" :aria-label="`${title}列表`">
        <div class="team-resource-workspace__toolbar"><slot name="toolbar" /></div>
        <div class="team-resource-workspace__list"><slot /></div>
        <footer v-if="$slots.pagination" class="team-resource-workspace__pagination"><slot name="pagination" /></footer>
      </section>
      <aside v-if="$slots.context" class="team-resource-workspace__context" :aria-label="contextLabel"><slot name="context" /></aside>
    </div>
  </div>
</template>

<style scoped>
.team-resource-workspace { width: 100%; max-width: 64rem; margin-inline: auto; display: grid; gap: 1.5rem; container-type: inline-size; }
.team-resource-workspace__body { display: grid; grid-template-columns: minmax(0, 2fr) minmax(15rem, 1fr); gap: 1.5rem; align-items: start; }
.team-resource-workspace__main { grid-column: 1; grid-row: 1; display: grid; gap: 1rem; min-width: 0; }
.team-resource-workspace__filters, .team-resource-workspace__context { grid-column: 2; grid-row: 1; display: grid; gap: 1rem; min-width: 0; }
.team-resource-workspace__toolbar { display: grid; gap: .75rem; min-width: 0; }
.team-resource-workspace__list { min-width: 0; }
.team-resource-workspace__pagination { display: flex; flex-wrap: wrap; justify-content: center; }
@container (max-width: 48rem) {
  .team-resource-workspace__body { display: flex; flex-direction: column; }
  .team-resource-workspace__main, .team-resource-workspace__filters, .team-resource-workspace__context { width: 100%; }
}
</style>
