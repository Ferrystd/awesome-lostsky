<script setup lang="ts">
import { NSelect } from 'naive-ui'
import type { SelectOption, SelectRenderLabel, SelectRenderTag } from 'naive-ui'
import { Bot, Building2, Handshake, UserRound } from '@lucide/vue'
import { computed, h } from 'vue'
import { entityTypeLabel, entityTypeTone, type EntityType } from '../entity'
import LsEntityTag from './LsEntityTag.vue'

defineOptions({ inheritAttrs: false })

interface EntitySelectItem {
  id?: number
  entity_id?: number
  type?: string
  slug?: string | null
  name: string
  avatar?: string | null
}

interface EntitySelectOption extends SelectOption, EntitySelectItem {
  entityType: EntityType
}

const props = withDefaults(defineProps<{
  modelValue: number | null | number[]
  entities: EntitySelectItem[]
  multiple?: boolean
  clearable?: boolean
  disabled?: boolean
  loading?: boolean
  placeholder?: string
}>(), {
  multiple: false,
  clearable: false,
  disabled: false,
  loading: false,
  placeholder: '选择 Entity',
})

const emit = defineEmits<{
  'update:modelValue': [value: number | null | number[]]
}>()

const knownTypes: EntityType[] = ['entity', 'customer', 'team', 'virtual', 'teamMember', 'teamCustomer', 'teamVirtual']
const normalizeType = (type?: string): EntityType => knownTypes.includes(type as EntityType) ? type as EntityType : 'unknown'
const typeIcons = { team: Building2, teamMember: UserRound, teamCustomer: Handshake, teamVirtual: Bot } as const
const entityIcon = (type: EntityType) => typeIcons[type as keyof typeof typeIcons] ?? UserRound

const options = computed<EntitySelectOption[]>(() => props.entities.map(entity => {
  const entityType = normalizeType(entity.type)
  return {
    ...entity,
    entityType,
    label: entity.name,
    value: Number(entity.entity_id ?? entity.id),
  }
}).filter(option => Number.isFinite(option.value) && Number(option.value) >= 0))

const renderLabel: SelectRenderLabel = option => {
  const entity = option as EntitySelectOption
  const icon = entityIcon(entity.entityType)
  return h('span', {
    class: 'ls-entity-select-option',
    'data-entity-tone': entityTypeTone(entity.entityType),
  }, [
    h('span', { class: 'ls-entity-select-option__icon', 'aria-hidden': 'true' }, [h(icon, { size: 19, strokeWidth: 1.8 })]),
    h('span', { class: 'ls-entity-select-option__identity' }, [
      h('strong', entity.name),
      h('span', { class: 'ls-entity-select-option__meta' }, [
        h('span', { class: 'ls-entity-select-option__type' }, entityTypeLabel(entity.entityType)),
        entity.slug ? h('span', { class: 'ls-entity-select-option__slug' }, `@${entity.slug}`) : null,
      ]),
    ]),
  ])
}

const renderTag: SelectRenderTag = ({ option, handleClose }) => {
  const entity = option as EntitySelectOption
  if (!props.multiple) {
    const icon = entityIcon(entity.entityType)
    const title = `${entity.name} · ${entityTypeLabel(entity.entityType)}${entity.slug ? ` · @${entity.slug}` : ''}`
    const tone = entityTypeTone(entity.entityType)
    return h('span', { class: 'ls-entity-select-value', title, 'data-entity-tone': tone }, [
      h('span', { class: 'ls-entity-select-value__icon', 'aria-hidden': 'true' }, [h(icon, { size: 17, strokeWidth: 1.9 })]),
      h('span', { class: 'ls-entity-select-value__name' }, entity.name),
    ])
  }

  return h(LsEntityTag, {
    type: entity.entityType,
    name: entity.name,
    slug: entity.slug ?? '',
    closable: !props.disabled && !option.disabled,
    disabled: props.disabled || Boolean(option.disabled),
    onClose: (event: MouseEvent) => {
      event.stopPropagation()
      handleClose()
    },
  })
}

const filter = (pattern: string, option: SelectOption) => {
  const entity = option as EntitySelectOption
  const keyword = pattern.trim().toLocaleLowerCase()
  return !keyword || [entity.name, entity.slug, entityTypeLabel(entity.entityType), entity.value]
    .some(value => String(value ?? '').toLocaleLowerCase().includes(keyword))
}

function updateValue(value: string | number | Array<string | number> | null) {
  emit('update:modelValue', Array.isArray(value)
    ? value.map(Number)
    : value === null ? null : Number(value))
}
</script>

<template>
  <NSelect
    v-bind="$attrs"
    class="ls-entity-select"
    :value="modelValue"
    :options="options"
    :render-label="renderLabel"
    :render-tag="renderTag"
    :filter="filter"
    :menu-props="{ class: 'ls-entity-select-menu' }"
    :multiple="multiple"
    :clearable="clearable"
    :disabled="disabled"
    :loading="loading"
    :placeholder="placeholder"
    :max-tag-count="multiple ? 'responsive' : undefined"
    :virtual-scroll="false"
    filterable
    @update:value="updateValue"
  />
</template>

<style>
.ls-entity-select-value{min-width:0;max-width:100%;display:flex;align-items:center;gap:7px}.ls-entity-select-value__icon{flex:0 0 auto;width:24px;height:24px;display:grid;place-items:center;color:var(--entity-accent);background:color-mix(in oklch,var(--entity-accent),transparent 90%);border-radius:6px}.ls-entity-select-value__name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ls-entity-select-menu{padding:6px}.ls-entity-select-menu .n-base-select-option{height:auto;min-height:62px;padding:7px 10px;border-radius:8px}.ls-entity-select-menu .n-base-select-option__content{min-width:0;width:100%}.ls-entity-select-option{width:100%;min-width:0;display:grid;grid-template-columns:38px minmax(0,1fr);align-items:center;gap:10px}.ls-entity-select-option__icon{width:38px;height:38px;display:grid;place-items:center;color:var(--entity-accent);background:color-mix(in oklch,var(--entity-accent),transparent 88%);border-radius:8px}.ls-entity-select-option__identity{min-width:0;display:grid;gap:4px}.ls-entity-select-option__identity strong,.ls-entity-select-option__slug{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ls-entity-select-option__identity strong{color:var(--ink);font-size:.875rem;line-height:1.2}.ls-entity-select-option__meta{min-width:0;display:flex;align-items:center;gap:7px;color:var(--muted-ink);font-size:.75rem;line-height:1.2}.ls-entity-select-option__type{flex:none;padding:2px 7px;color:var(--entity-accent);background:color-mix(in oklch,var(--entity-accent),transparent 89%);border-radius:999px;font-weight:700}.ls-entity-select-option__slug{min-width:0}.ls-entity-select-menu .n-base-select-option--selected .ls-entity-select-option__identity strong{color:var(--sky-lost-strong)}@media(prefers-reduced-motion:reduce){.ls-entity-select-menu .n-base-select-option{transition:none}}
</style>
