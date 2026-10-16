<script setup lang="ts">
import LsPageHeader from './LsPageHeader.vue'
import LsSceneMotionControl from './LsSceneMotionControl.vue'
import { useWorkspaceScene } from '../workspace-scene'
const { available } = useWorkspaceScene()

defineOptions({ inheritAttrs: false })
withDefaults(defineProps<{ title: string; description?: string; asideLabel?: string }>(), { asideLabel: '辅助信息' })
defineSlots<{ actions?(): unknown; default?(): unknown; footer?(): unknown; aside?(): unknown }>()
</script>

<template>
  <div class="ls-form-page" :class="{ 'ls-form-page--with-aside': $slots.aside }">
    <LsPageHeader :title="title" :description="description">
      <template v-if="$slots.actions || available" #actions><slot name="actions" /><LsSceneMotionControl /></template>
    </LsPageHeader>
    <div v-if="$slots.aside" class="ls-form-page__columns">
      <div class="ls-form-page__body">
        <slot />
        <div v-if="$slots.footer" class="ls-form-page__footer"><slot name="footer" /></div>
      </div>
      <aside class="ls-form-page__aside" :aria-label="asideLabel"><slot name="aside" /></aside>
    </div>
    <template v-else>
      <div class="ls-form-page__body"><slot /></div>
      <div v-if="$slots.footer" class="ls-form-page__footer"><slot name="footer" /></div>
    </template>
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
.ls-form-page--with-aside { container: ls-form-page / inline-size; }
.ls-form-page__columns { min-width: 0; display: grid; grid-template-columns: minmax(0, 1fr); align-items: start; gap: 1.5rem; }
.ls-form-page__aside { min-width: 0; display: grid; gap: 1.5rem; overflow-wrap: anywhere; }
@container ls-form-page (min-width: 48rem) {
  .ls-form-page__columns { grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); }
}
</style>
