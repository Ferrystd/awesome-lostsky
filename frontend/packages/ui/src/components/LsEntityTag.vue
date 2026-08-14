<script setup lang="ts">
import { Bot, Building2, Handshake, UserRound, Users } from '@lucide/vue'
import { NTag } from 'naive-ui'
import { computed } from 'vue'
import { entityTypeLabel, entityTypeTone } from '../entity'
import type { EntityType } from '../entity'

const props = withDefaults(defineProps<{
  type: EntityType
  name: string
  slug?: string
  closable?: boolean
  disabled?: boolean
}>(), { slug: '', closable: false, disabled: false })

const emit = defineEmits<{ close: [event: MouseEvent] }>()
const typeLabel = computed(() => entityTypeLabel(props.type))
const tone = computed(() => entityTypeTone(props.type))
const title = computed(() => `${props.name} · ${typeLabel.value}${props.slug ? ` · @${props.slug}` : ''}`)
const typeIcon = computed(() => ({
  team: Building2, entity: UserRound, teamMember: UserRound,
  customer: Handshake, teamCustomer: Handshake,
  virtual: Bot, teamVirtual: Bot, unknown: Users,
})[props.type] || Users)
</script>

<template>
  <NTag
    class="ls-entity-tag"
    :data-entity-tone="tone"
    :title="title"
    size="medium"
    :bordered="false"
    :closable="closable"
    :disabled="disabled"
    @close="emit('close', $event)"
  >
    <template #icon><component :is="typeIcon" :size="16" :stroke-width="1.9" aria-hidden="true" /></template>
    <span class="ls-entity-tag__name">{{ name }}</span>
  </NTag>
</template>

<style>
.ls-entity-tag.n-tag{min-width:0;max-width:min(12rem,100%);height:30px;padding-left:8px;color:var(--entity-accent);background:color-mix(in oklch,var(--entity-accent),transparent 88%);border-radius:999px;font-weight:650}.ls-entity-tag[data-entity-tone="unknown"]{--entity-accent:var(--sky-lost-strong)}.ls-entity-tag .n-tag__icon{flex:0 0 auto;color:currentColor}.ls-entity-tag .n-tag__content{min-width:0;overflow:hidden}.ls-entity-tag__name{display:block;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ls-entity-tag .n-tag__close{flex:0 0 auto;width:24px;height:24px;margin-right:-5px;color:currentColor}
</style>
