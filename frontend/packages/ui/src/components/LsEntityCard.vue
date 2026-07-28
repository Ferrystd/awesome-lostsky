<script setup lang="ts">
import type { EntityDisplay } from '../entity'

import { Bot, Building2, Handshake, Info, MessageCircleMore, UserRound, Users, X } from '@lucide/vue'
import { computed } from 'vue'
import { entityTypeLabel } from '../entity'

const props = withDefaults(defineProps<{
  entity: EntityDisplay
  clearable?: boolean
  clearLabel?: string
  chatEnabled?: boolean
  profileEnabled?: boolean
}>(), { clearable: false, clearLabel: '', chatEnabled: true, profileEnabled: true })
const emit = defineEmits<{ chat: [entity: EntityDisplay]; profile: [entity: EntityDisplay]; clear: [entity: EntityDisplay] }>()
const typeLabel = computed(() => entityTypeLabel(props.entity.type))
const typeIcon = computed(() => ({
  team: Building2,
  entity: UserRound,
  teamMember: UserRound,
  customer: Handshake,
  teamCustomer: Handshake,
  virtual: Bot,
  teamVirtual: Bot,
  unknown: Users,
})[props.entity.type])
</script>

<template>
  <article class="entity-card">
    <span class="entity-card__icon" aria-hidden="true"><component :is="typeIcon" :size="19" /></span>
    <div class="entity-card__identity">
      <small>{{ typeLabel }}</small>
      <strong>{{ entity.name }}</strong>
      <span>@{{ entity.slug }}</span>
    </div>
    <div v-if="chatEnabled || profileEnabled" class="entity-card__actions">
      <button v-if="chatEnabled" type="button" @click="emit('chat', entity)"><MessageCircleMore :size="16" />聊天</button>
      <button v-if="profileEnabled" type="button" @click="emit('profile', entity)"><Info :size="16" />简介</button>
    </div>
    <button v-if="clearable" class="entity-card__clear" type="button" :aria-label="clearLabel || `清除 ${entity.name}`" @click="emit('clear', entity)"><X :size="18" /></button>
  </article>
</template>

<style scoped>
.entity-card{display:grid;grid-template-columns:auto minmax(0,1fr) auto auto;align-items:center;gap:.75rem;padding:.75rem;background:var(--cloud);border:1px solid var(--line);border-radius:9px}.entity-card__icon{width:38px;height:38px;display:grid;place-items:center;color:var(--sky-lost-strong);background:var(--surface,white);border-radius:8px}.entity-card__identity{min-width:0}.entity-card__identity small,.entity-card__identity strong,.entity-card__identity span{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.entity-card__identity small,.entity-card__identity span{color:var(--muted-ink);font-size:.75rem}.entity-card__identity strong{color:var(--ink);font-size:.9rem}.entity-card__actions{display:flex;align-items:center;gap:.25rem}.entity-card button{min-height:40px;display:inline-flex;align-items:center;justify-content:center;gap:.3rem;padding:0 .55rem;color:var(--sky-lost-strong);background:transparent;border:0;border-radius:7px;font-size:.8rem;font-weight:700;cursor:pointer}.entity-card button:hover,.entity-card button:active{background:var(--surface,white)}.entity-card button:focus-visible{outline:3px solid color-mix(in oklch,var(--sky-lost-strong),transparent 60%);outline-offset:2px}.entity-card__clear{width:40px;padding:0!important;color:var(--muted-ink)!important}@media(max-width:560px){.entity-card{grid-template-columns:auto minmax(0,1fr) auto}.entity-card__actions{grid-column:2;grid-row:2}.entity-card__clear{grid-column:3;grid-row:1}.entity-card__actions button{min-height:36px}}
</style>
