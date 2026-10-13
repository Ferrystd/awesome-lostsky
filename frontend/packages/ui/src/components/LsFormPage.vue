<script setup lang="ts">
import LsPageHeader from './LsPageHeader.vue'
import LsSceneMotionControl from './LsSceneMotionControl.vue'
import { useWorkspaceScene } from '../workspace-scene'
const { available } = useWorkspaceScene()

defineOptions({ inheritAttrs: false })
defineProps<{ title: string; description?: string }>()
defineSlots<{ actions?(): unknown; default?(): unknown; footer?(): unknown }>()
</script>

<template>
  <div class="ls-form-page">
    <LsPageHeader :title="title" :description="description">
      <template v-if="$slots.actions || available" #actions><slot name="actions" /><LsSceneMotionControl /></template>
    </LsPageHeader>
    <div class="ls-form-page__body"><slot /></div>
    <div v-if="$slots.footer" class="ls-form-page__footer"><slot name="footer" /></div>
  </div>
</template>

<style scoped>
.ls-form-page,
.ls-form-page__body {
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1.5rem;
}
.ls-form-page__footer { min-width: 0; }
</style>
