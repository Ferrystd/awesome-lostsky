<script setup lang="ts">
import { computed, nextTick, ref, useId, watchPostEffect, type VNode } from 'vue'
import { NButton, NSelect, type SelectOption, type SelectGroupOption } from 'naive-ui'
import { RouterLink, useRouter } from 'vue-router'
import LsField from './LsField.vue'
import LsPageHeader from './LsPageHeader.vue'
import LsSceneMotionControl from './LsSceneMotionControl.vue'

defineOptions({ inheritAttrs: false })
const props = defineProps<{
  title: string
  description?: string
  items: { key: string; label: string; dirty?: boolean; to?: string }[]
  current: string
  label: string
}>()
const emit = defineEmits<{ select: [key: string] }>()
const id = useId()
const panelId = `category-content-${id}`
const selectId = `category-select-${id}`
const navigation = ref<HTMLElement | null>(null)
const mobile = ref<HTMLElement | null>(null)
const menuOpen = ref(false)
const menuId = `category-options-${id}`
const router = useRouter()
const options = computed(() => props.items.map(item => ({ value: item.key, label: `${item.label}${item.dirty ? ' · 未保存' : ''}` })))

// Naive's select-only trigger is an internal focusable div. Name that actual
// keyboard target, not the non-focusable NSelect wrapper.
watchPostEffect(() => {
  const expanded = menuOpen.value
  const label = props.label
  const trigger = mobile.value?.querySelector<HTMLElement>('.n-base-selection-label')
  if (!trigger) return
  trigger.id = selectId
  trigger.setAttribute('role', 'combobox')
  trigger.setAttribute('aria-label', label)
  trigger.setAttribute('aria-haspopup', 'listbox')
  trigger.setAttribute('aria-expanded', String(expanded))
  trigger.setAttribute('aria-controls', menuId)
  if (!expanded) trigger.removeAttribute('aria-activedescendant')
})
function syncPendingOption(node: VNode) {
  const element = node.el as HTMLElement | null
  if (menuOpen.value && element?.classList.contains('n-base-select-option--pending')) {
    mobile.value?.querySelector<HTMLElement>('[role="combobox"]')?.setAttribute('aria-activedescendant', element.id)
  }
}
function optionProps(option: SelectOption | SelectGroupOption) {
  const value = 'value' in option ? option.value : undefined
  return {
    id: `${menuId}-${props.items.findIndex(item => item.key === value)}`,
    role: 'option', 'aria-selected': value === props.current,
    onVnodeMounted: syncPendingOption, onVnodeUpdated: syncPendingOption,
  }
}

function select(key: string) {
  const item = props.items.find(item => item.key === key)
  if (item?.to) void router.push(item.to)
  else emit('select', key)
}
async function navigate(event: KeyboardEvent, index: number) {
  let next = index
  if (event.key === 'ArrowDown') next = (index + 1) % props.items.length
  else if (event.key === 'ArrowUp') next = (index + props.items.length - 1) % props.items.length
  else if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = props.items.length - 1
  else return
  event.preventDefault()
  if (!props.items[next].to) emit('select', props.items[next].key)
  await nextTick()
  navigation.value?.querySelectorAll<HTMLElement>('button,a')[next]?.focus()
}
</script>

<template>
  <div class="ls-category-page">
    <LsPageHeader :title="title" :description="description"><template v-if="$slots.actions" #actions><slot name="actions" /></template></LsPageHeader>
    <div class="ls-category-page__body">
      <div class="ls-category-page__layout">
        <div class="ls-category-page__navigation">
          <div ref="mobile" class="ls-category-page__mobile">
            <LsField :label="label" :for-id="selectId"><NSelect :value="current" :options="options" :node-props="optionProps" :menu-props="{ id: menuId, role: 'listbox', 'aria-label': label }" @update:show="menuOpen = $event" @update:value="select" /></LsField>
          </div>
          <nav ref="navigation" class="ls-category-page__desktop" :aria-label="label">
            <p class="ls-category-page__label">{{ label }}</p>
            <template v-for="(item, index) in items" :key="item.key">
              <RouterLink v-if="item.to" class="ls-category-page__item" :to="item.to" :aria-current="item.key === current ? 'page' : undefined" @keydown="navigate($event, index)"><span>{{ item.label }}</span><small v-if="item.dirty">未保存</small></RouterLink>
              <NButton v-else quaternary class="ls-category-page__item" :aria-current="item.key === current ? 'true' : undefined" :aria-controls="panelId" @click="emit('select', item.key)" @keydown="navigate($event, index)"><span>{{ item.label }}</span><small v-if="item.dirty">未保存</small></NButton>
            </template>
          </nav>
          <LsSceneMotionControl />
        </div>
        <div :id="panelId" class="ls-category-page__content"><slot /></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ls-category-page { min-width: 0; display: grid; gap: 1.5rem; }
.ls-category-page__body { min-width: 0; container: ls-category-page / inline-size; padding: 1.25rem; }
.ls-category-page__layout { min-width: 0; display: grid; gap: 1.5rem; align-items: start; }
.ls-category-page__content { min-width: 0; }
.ls-category-page__navigation { min-width: 0; padding-block: .75rem; }
.ls-category-page__desktop { display: none; }
.ls-category-page__label { margin: 0 0 .75rem; padding-inline: .75rem; color: var(--text-secondary); font-size: .8125rem; font-weight: 500; }
.ls-category-page__item { width: 100%; min-height: 44px; height: auto; display: flex; align-items: center; justify-content: space-between; gap: .5rem; padding: .75rem; border: 0; border-radius: var(--radius-md); background: transparent; color: var(--text-secondary); font: inherit; font-size: .875rem; text-align: left; cursor: pointer; text-decoration: none; white-space: normal; }
.ls-category-page__item :deep(.n-button__content) { width: 100%; min-width: 0; display: flex; justify-content: space-between; gap: .5rem; white-space: normal; }
.ls-category-page__item span { min-width: 0; overflow-wrap: anywhere; }
.ls-category-page__item small { flex: none; font-size: .75rem; color: var(--text-secondary); }
.ls-category-page__item:hover { background: var(--surface); color: var(--text); }
.ls-category-page__item[aria-current] { background: color-mix(in srgb, var(--primary) 8%, transparent); color: var(--primary); font-weight: 650; }
.ls-category-page__item:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
@media (max-width: 639px) { .ls-category-page__body { padding: .75rem; } }
@container ls-category-page (min-width: 48rem) {
  .ls-category-page__layout { grid-template-columns: 11.5rem minmax(0, 1fr); }
  .ls-category-page__mobile { display: none; }
  .ls-category-page__desktop { display: grid; gap: .25rem; }
}
</style>
