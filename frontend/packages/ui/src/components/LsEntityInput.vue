<script setup lang="ts">
import type { EntityDisplay } from '../entity'

import { Search, Users } from '@lucide/vue'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { entityMatchesKeyword, entityTypeLabel } from '../entity'
import LsEntityCard from './LsEntityCard.vue'

const props = withDefaults(defineProps<{
  modelValue?: EntityDisplay[]
  query?: string
  recent?: EntityDisplay[]
  candidates?: EntityDisplay[]
  searchEntities?: (keyword: string) => Promise<EntityDisplay[]>
  multiple?: boolean
  inputId?: string
  placeholder?: string
}>(), { modelValue: () => [], query: '', recent: () => [], candidates: () => [], multiple: false, placeholder: '输入实体 slug 搜索' })
const emit = defineEmits<{ 'update:modelValue': [value: EntityDisplay[]]; 'update:query': [value: string]; chat: [entity: EntityDisplay]; profile: [entity: EntityDisplay] }>()
const keyword = ref(props.query)
const focused = ref(Boolean(props.query.trim()))
const searched = ref<EntityDisplay[]>([])
const searching = ref(false)
const searchError = ref('')
let blurTimer: ReturnType<typeof setTimeout> | undefined
let searchTimer: ReturnType<typeof setTimeout> | undefined
let searchVersion = 0

const selected = computed(() => props.modelValue ?? [])
const normalizedKeyword = computed(() => keyword.value.trim().toLowerCase())
const results = computed(() => {
  const source = normalizedKeyword.value
    ? props.searchEntities ? searched.value : props.candidates
    : props.recent
  return source.filter((item) => !selected.value.some((value) => value.slug === item.slug))
    .filter(item => entityMatchesKeyword(item, normalizedKeyword.value))
    .slice(0, 6)
})
const menuHint = computed(() => {
  if (!normalizedKeyword.value) return results.value.length ? '最近聊天的实体' : ''
  if (normalizedKeyword.value.length < 2) return '继续输入至少 2 个字符'
  if (searching.value) return '正在搜索实体…'
  if (searchError.value) return searchError.value
  return results.value.length ? '匹配的实体' : ''
})
const showResults = computed(() => focused.value && (normalizedKeyword.value.length > 0 || props.recent.length > 0))

function choose(entity: EntityDisplay) {
  emit('update:modelValue', props.multiple ? [...selected.value, entity] : [entity])
  keyword.value = ''
  emit('update:query', '')
  if (!props.multiple) focused.value = false
}
function clear(entity: EntityDisplay) {
  emit('update:modelValue', selected.value.filter((value) => value.slug !== entity.slug))
}
function focus() {
  if (blurTimer) clearTimeout(blurTimer)
  focused.value = true
}
function blur() {
  blurTimer = setTimeout(() => { focused.value = false }, 120)
}
watch(() => props.query, value => {
  if (value !== keyword.value) keyword.value = value
  if (value.trim() && !selected.value.length) focused.value = true
})
watch(keyword, value => {
  emit('update:query', value)
})
watch(normalizedKeyword, value => {
  if (searchTimer) clearTimeout(searchTimer)
  const version = ++searchVersion
  searched.value = []
  searchError.value = ''
  searching.value = false
  if (!props.searchEntities || value.length < 2) return
  searchTimer = setTimeout(async () => {
    searching.value = true
    try {
      const found = await props.searchEntities!(value)
      if (version === searchVersion) searched.value = found
    } catch {
      if (version === searchVersion) searchError.value = '暂时无法搜索实体'
    } finally {
      if (version === searchVersion) searching.value = false
    }
  }, 220)
}, { immediate: true })
watch(() => props.multiple, () => { keyword.value = '' })
onBeforeUnmount(() => {
  if (blurTimer) clearTimeout(blurTimer)
  if (searchTimer) clearTimeout(searchTimer)
})
</script>

<template>
  <div class="entity-input">
    <div v-if="selected.length" class="entity-input__selected">
      <LsEntityCard v-for="entity in selected" :key="entity.slug" :entity="entity" clearable @clear="clear" @chat="emit('chat', $event)" @profile="emit('profile', $event)" />
    </div>
    <div v-if="multiple || !selected.length" class="entity-input__search">
      <Search :size="17" aria-hidden="true" />
      <input :id="inputId" v-model="keyword" :placeholder="placeholder" autocomplete="off" autocapitalize="none" spellcheck="false" @focus="focus" @blur="blur" />
      <Transition name="ls-popover">
        <div v-if="showResults" class="entity-input__menu" role="listbox" :aria-label="normalizedKeyword ? '实体搜索结果' : '最近聊天的实体'">
          <p v-if="menuHint" class="entity-input__hint">{{ menuHint }}</p>
          <button v-for="entity in results" :key="entity.slug" type="button" role="option" @mousedown.prevent="choose(entity)">
            <span><Users :size="16" /></span><span><strong>{{ entity.name }}</strong><small>@{{ entity.slug }} · {{ entityTypeLabel(entity.type) }}</small></span>
          </button>
          <p v-if="normalizedKeyword.length >= 2 && !searching && !searchError && !results.length" class="entity-input__empty">没有匹配的可搜索实体</p>
          <p v-else-if="!normalizedKeyword && !results.length" class="entity-input__empty">暂无最近聊天的实体</p>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.entity-input{display:grid;gap:.65rem}.entity-input__selected{display:grid;gap:.5rem}.entity-input__search{position:relative;min-height:44px;display:flex;align-items:center;gap:.5rem;padding:0 .75rem;color:var(--muted-ink);background:white;border:1px solid var(--line);border-radius:8px;transition:border-color var(--motion-fast) var(--ease-standard),box-shadow var(--motion-fast) var(--ease-standard)}.entity-input__search:focus-within{border-color:var(--sky-lost-strong);box-shadow:0 0 0 3px color-mix(in oklch,var(--sky-lost-strong),transparent 84%)}.entity-input input{width:100%;min-width:0;height:42px;color:var(--ink);background:transparent;border:0;outline:0}.entity-input__menu{position:absolute;z-index:var(--z-dropdown);top:calc(100% + .35rem);right:0;left:0;padding:.35rem;background:white;border:1px solid var(--line);border-radius:8px;box-shadow:0 6px 8px color-mix(in oklch,var(--sky-night),transparent 88%)}.entity-input__hint,.entity-input__empty{margin:0;padding:.4rem .55rem;color:var(--muted-ink);font-size:.78rem}.entity-input__menu button{width:100%;min-height:48px;display:flex;align-items:center;gap:.6rem;padding:.5rem .55rem;text-align:left;color:var(--ink);background:transparent;border:0;border-radius:6px;cursor:pointer;transition:background-color var(--motion-fast) var(--ease-standard)}.entity-input__menu button:hover,.entity-input__menu button:focus-visible{background:var(--cloud)}.entity-input__menu button>span:first-child{width:32px;height:32px;display:grid;place-items:center;color:var(--sky-lost-strong);background:color-mix(in oklch,var(--sky-lost),white 84%);border-radius:7px}.entity-input__menu strong,.entity-input__menu small{display:block}.entity-input__menu strong{font-size:.85rem}.entity-input__menu small{color:var(--muted-ink);font-size:.73rem}
@media(max-width:639px){.entity-input__search{display:grid;grid-template-columns:17px minmax(0,1fr)}.entity-input__menu{position:static;grid-column:1/-1;margin:0 -.75rem;padding:.35rem;border-width:1px 0 0;border-radius:0 0 8px 8px;box-shadow:none}}
</style>
