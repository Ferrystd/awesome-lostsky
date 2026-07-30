<script setup lang="ts">
import { entityTypeLabel, entityTypeTone, type EntityType } from '@lostsky/ui/entity'
import { Bot, Building2, Handshake, UserRound } from '@lucide/vue'

const props = defineProps<{ entity: { type?: EntityType; slug?: string; name: string } }>()
const typeIcons = { team: Building2, teamMember: UserRound, teamCustomer: Handshake, teamVirtual: Bot } as const
const type = props.entity.type ?? 'unknown'
const icon = typeIcons[type as keyof typeof typeIcons] ?? UserRound
const typeLabel = entityTypeLabel(type)
const tone = entityTypeTone(type)
</script>

<template>
  <span class="entity-select-option" :data-entity-tone="tone">
    <span class="entity-select-option__icon" aria-hidden="true"><component :is="icon" :size="19" :stroke-width="1.8" /></span>
    <span class="entity-select-option__identity"><strong>{{ entity.name }}</strong><span class="entity-select-option__meta"><span class="entity-select-option__type">{{ typeLabel }}</span><span v-if="entity.slug" class="entity-select-option__slug">@{{ entity.slug }}</span></span></span>
  </span>
</template>

<style>
.entity-select-menu{padding:6px}.entity-select-menu .n-base-select-option{height:auto;min-height:62px;padding:7px 10px;border-radius:8px}.entity-select-menu .n-base-select-option__content{min-width:0;width:100%}.entity-select-option{width:100%;min-width:0;display:grid;grid-template-columns:38px minmax(0,1fr);align-items:center;gap:10px}.entity-select-option__icon{width:38px;height:38px;display:grid;place-items:center;color:var(--entity-accent);background:color-mix(in oklch,var(--entity-accent),transparent 88%);border-radius:8px}.entity-select-option__identity{min-width:0;display:grid;gap:4px}.entity-select-option__identity strong,.entity-select-option__slug{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.entity-select-option__identity strong{color:var(--ink);font-size:.875rem;line-height:1.2}.entity-select-option__meta{min-width:0;display:flex;align-items:center;gap:7px;color:var(--muted-ink);font-size:.75rem;line-height:1.2}.entity-select-option__type{flex:none;padding:2px 7px;color:var(--entity-accent);background:color-mix(in oklch,var(--entity-accent),transparent 89%);border-radius:999px;font-weight:700}.entity-select-option__slug{min-width:0}.entity-select-menu .n-base-select-option--selected .entity-select-option__identity strong{color:var(--sky-lost-strong)}@media(prefers-reduced-motion:reduce){.entity-select-menu .n-base-select-option{transition:none}}
</style>
