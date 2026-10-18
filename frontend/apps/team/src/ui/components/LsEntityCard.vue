<script setup lang="ts">
import type { EntityDisplay } from '../entity'

import { Info, MessageCircleMore, X } from '@lucide/vue'
import { NButton } from 'naive-ui'
import LsEntityIdentity from './LsEntityIdentity.vue'

const props = withDefaults(defineProps<{
  entity: EntityDisplay
  clearable?: boolean
  clearLabel?: string
  chatEnabled?: boolean
  profileEnabled?: boolean
}>(), { clearable: false, clearLabel: '', chatEnabled: true, profileEnabled: true })
const emit = defineEmits<{ chat: [entity: EntityDisplay]; profile: [entity: EntityDisplay]; clear: [entity: EntityDisplay] }>()
</script>

<template>
  <article class="entity-card">
    <LsEntityIdentity :type="entity.type" :name="entity.name" :slug="entity.slug" />
    <div v-if="chatEnabled || profileEnabled" class="entity-card__actions">
      <NButton v-if="chatEnabled" size="small" quaternary @click="emit('chat', entity)"><template #icon><MessageCircleMore :size="16" /></template>聊天</NButton>
      <NButton v-if="profileEnabled" size="small" quaternary @click="emit('profile', entity)"><template #icon><Info :size="16" /></template>简介</NButton>
    </div>
    <NButton v-if="clearable" class="entity-card__clear" quaternary circle :aria-label="clearLabel || `清除 ${entity.name}`" @click="emit('clear', entity)"><template #icon><X :size="18" /></template></NButton>
  </article>
</template>

<style scoped>
.entity-card{display:grid;grid-template-columns:minmax(0,1fr) auto auto;align-items:center;gap:.75rem;padding:.75rem;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm)}.entity-card__actions{display:flex;align-items:center;gap:.25rem}.entity-card button{min-height:40px;display:inline-flex;align-items:center;justify-content:center;gap:.3rem;padding:0 .55rem;color:var(--primary);background:transparent;border:0;border-radius:var(--radius-sm);font-size:.8rem;font-weight:700;cursor:pointer;transition:background-color var(--motion-fast) var(--ease-standard)}.entity-card button:hover,.entity-card button:active{background:var(--surface-subtle)}.entity-card__clear{width:40px;padding:0!important;color:var(--text-secondary)!important}@media(max-width:560px){.entity-card{grid-template-columns:minmax(0,1fr) auto}.entity-card__actions{grid-column:1;grid-row:2}.entity-card__clear{grid-column:2;grid-row:1}.entity-card__actions button{min-height:40px}}
</style>
