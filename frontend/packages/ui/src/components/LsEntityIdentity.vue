<script setup lang="ts">
import { Bot, Building2, Handshake, UserRound, Users } from '@lucide/vue'
import { computed } from 'vue'
import { entityTypeLabel, entityTypeTone } from '../entity'
import type { EntityType } from '../entity'

const props = withDefaults(defineProps<{
  type: EntityType
  name: string
  slug?: string
  imageUrl?: string | null
  fallback?: 'icon' | 'initial'
  size?: 'sm' | 'md' | 'lg'
}>(), { slug: '', imageUrl: null, fallback: 'icon', size: 'md' })

const typeLabel = computed(() => entityTypeLabel(props.type))
const tone = computed(() => entityTypeTone(props.type))
const initial = computed(() => props.name.trim().slice(0, 1).toLocaleUpperCase() || '?')
const typeIcon = computed(() => ({
  team: Building2, entity: UserRound, teamMember: UserRound,
  customer: Handshake, teamCustomer: Handshake,
  virtual: Bot, teamVirtual: Bot, unknown: Users,
})[props.type] || Users)
</script>

<template>
  <div class="ls-entity-identity" :class="`ls-entity-identity--${size}`" :data-entity-tone="tone">
    <span class="ls-entity-identity__media">
      <img v-if="imageUrl" :src="imageUrl" :alt="`${name}头像`">
      <span v-else-if="fallback === 'initial'" aria-hidden="true">{{ initial }}</span>
      <component :is="typeIcon" v-else :size="size === 'lg' ? 24 : 20" aria-hidden="true" />
    </span>
    <span class="ls-entity-identity__text">
      <small>{{ typeLabel }}</small>
      <span class="ls-entity-identity__name-row">
        <strong>{{ name }}</strong>
        <span v-if="$slots.status" class="ls-entity-identity__status"><slot name="status" /></span>
      </span>
      <span v-if="slug" class="ls-entity-identity__slug">@{{ slug }}</span>
    </span>
  </div>
</template>

<style scoped>
.ls-entity-identity{min-width:0;display:flex;align-items:center;gap:.75rem}.ls-entity-identity__media{flex:0 0 auto;width:44px;height:44px;display:grid;place-items:center;overflow:hidden;color:var(--entity-accent);background:color-mix(in oklch,var(--entity-accent),transparent 86%);border-radius:10px;font-weight:750}.ls-entity-identity__media img{width:100%;height:100%;object-fit:cover}.ls-entity-identity__text{min-width:0;display:block}.ls-entity-identity__text>small,.ls-entity-identity__text>strong,.ls-entity-identity__slug{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ls-entity-identity__text small{color:var(--entity-accent);font-size:.75rem;font-weight:700}.ls-entity-identity__text strong{min-width:0;overflow:hidden;color:var(--text);font-size:.95rem;text-overflow:ellipsis;white-space:nowrap}.ls-entity-identity__name-row{min-width:0;display:flex;align-items:center;gap:.5rem}.ls-entity-identity__status{flex:0 0 auto;display:inline-flex}.ls-entity-identity__slug{color:var(--text-secondary);font-size:.78rem}.ls-entity-identity--sm .ls-entity-identity__media{width:40px;height:40px}.ls-entity-identity--lg .ls-entity-identity__media{width:56px;height:56px;border-radius:12px}
</style>
