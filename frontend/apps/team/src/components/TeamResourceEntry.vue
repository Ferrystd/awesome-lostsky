<script setup lang="ts">
import type { Component } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import { ArrowUpRight } from '@lucide/vue'
defineProps<{ title: string; icon: Component; to?: RouteLocationRaw; href?: string; selected?: boolean }>()
defineEmits<{ select: [] }>()
</script>

<template>
  <li :class="['team-resource-entry', { 'team-resource-entry--selected': selected }]">
    <div class="team-resource-entry__identity">
      <component :is="icon" :size="20" class="team-resource-entry__icon" aria-hidden="true" />
      <div class="team-resource-entry__copy">
        <div class="team-resource-entry__heading">
          <RouterLink v-if="to" :to="to" class="team-resource-entry__name">{{ title }}<ArrowUpRight :size="15" aria-hidden="true" /></RouterLink>
          <a v-else :href="href" class="team-resource-entry__name" :aria-current="selected ? 'true' : undefined" @click="$emit('select')">{{ title }}</a>
          <slot name="status" />
        </div>
        <div class="team-resource-entry__summary"><slot /></div>
      </div>
    </div>
    <div v-if="$slots.actions" class="team-resource-entry__actions"><slot name="actions" /></div>
  </li>
</template>

<style scoped>
.team-resource-entry { list-style: none; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: .5rem 1rem; padding: 1rem .75rem; border-bottom: 1px solid var(--border); min-width: 0; transition: background-color var(--motion-fast) var(--ease-standard); }
.team-resource-entry:first-child { border-top: 1px solid var(--border); }
.team-resource-entry--selected { background: color-mix(in srgb, var(--primary) 6%, transparent); }
.team-resource-entry__identity { display: flex; align-items: flex-start; gap: .75rem; min-width: 0; flex: 1 1 14rem; }
.team-resource-entry__icon { flex: none; color: var(--text-secondary); margin-top: .2rem; }
.team-resource-entry__copy { min-width: 0; flex: 1; }
.team-resource-entry__heading { display: flex; align-items: center; flex-wrap: wrap; gap: .375rem .5rem; }
.team-resource-entry__name { min-width: 0; display: inline-flex; align-items: center; gap: .375rem; font-size: 1rem; font-weight: 600; line-height: 1.5; color: var(--text); overflow-wrap: anywhere; }
.team-resource-entry__name svg { flex: none; color: var(--text-secondary); }
.team-resource-entry__name:focus-visible { outline: 2px solid var(--focus); outline-offset: 4px; border-radius: 2px; }
.team-resource-entry__summary { display: flex; align-items: center; flex-wrap: wrap; gap: .375rem .75rem; margin-top: .25rem; color: var(--text-secondary); font-size: .8125rem; line-height: 1.6; overflow-wrap: anywhere; }
.team-resource-entry__actions { display: flex; align-items: center; flex-wrap: wrap; gap: .75rem; }
@media (hover: hover) { .team-resource-entry:hover { background: color-mix(in srgb, var(--primary) 6%, transparent); } .team-resource-entry__name:hover { color: var(--primary); } }
@media (max-width: 639px) { .team-resource-entry { padding-inline: .25rem; } .team-resource-entry__actions { padding-left: 2rem; } }
</style>
