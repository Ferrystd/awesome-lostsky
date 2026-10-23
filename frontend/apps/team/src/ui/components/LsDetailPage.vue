<script setup lang="ts">
import { ArrowLeft } from '@lucide/vue'
import type { RouteLocationRaw } from 'vue-router'
import LsPageLink from './LsPageLink.vue'
import PageContextLayout from './internal/PageContextLayout.vue'
import LsPageHeader from './LsPageHeader.vue'

defineOptions({ inheritAttrs: false })
defineProps<{ title: string; description?: string; backTo?: RouteLocationRaw; backLabel?: string; asideLabel?: string }>()
defineSlots<{ actions(): unknown; summary(): unknown; default(): unknown; aside?(): unknown }>()
</script>

<template>
  <div class="ls-detail-page">
    <div class="ls-detail-page__heading">
      <div class="ls-detail-page__title">
        <div v-if="backTo"><LsPageLink :icon="ArrowLeft" :to="backTo" :label="backLabel || '返回'" /></div>
        <LsPageHeader :title="title" :description="description" />
      </div>
      <div v-if="$slots.actions" class="ls-detail-page__commands">
        <div class="ls-detail-page__actions"><slot name="actions" /></div>
      </div>
    </div>
    <div v-if="$slots.summary" class="ls-detail-page__summary"><slot name="summary" /></div>
    <PageContextLayout v-if="$slots.aside" :aside-label="asideLabel">
      <div v-if="$slots.default" class="ls-detail-page__body"><slot /></div>
      <template #aside><slot name="aside" /></template>
    </PageContextLayout>
    <div v-else-if="$slots.default" class="ls-detail-page__body"><slot /></div>
  </div>
</template>

<style scoped>
.ls-detail-page { min-width: 0; display: grid; gap: 1.5rem; overflow-wrap: anywhere; container-type: inline-size; }
.ls-detail-page__heading { min-width: 0; display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: end; gap: 1rem; }
.ls-detail-page__title { min-width: 0; display: grid; gap: .75rem; }
.ls-detail-page__commands { min-width: 0; }
.ls-detail-page__summary, .ls-detail-page__body { min-width: 0; display: grid; gap: 1.5rem; }
.ls-detail-page__actions { min-width: 0; display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: .75rem; }
@container (max-width: 48rem) {
  .ls-detail-page__heading { grid-template-columns: minmax(0, 1fr); }
}
</style>
