<script setup lang="ts" generic="T">
import { ArrowDown, ArrowUp, GripVertical, Plus, Trash2 } from '@lucide/vue'
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import type { DraggableEvent } from 'vue-draggable-plus'
import { VueDraggable } from 'vue-draggable-plus'
import { appendFormListItem, moveFormListItem, removeFormListItem } from '../form-list'
import LsButton from './LsButton.vue'

const items = defineModel<T[]>({ required: true })
const props = withDefaults(defineProps<{
  itemKey: (item: T) => string | number
  createItem: () => T
  itemLabel?: string
  addLabel?: string
  emptyText?: string
  disabledReason?: string
  disabled?: boolean
}>(), {
  itemLabel: '项目',
  addLabel: '添加一项',
  emptyText: '尚未添加项目',
  disabled: false,
  disabledReason: '当前列表只读，无法修改',
})

const root = ref<HTMLElement | null>(null)
const announcement = ref('')
const reduceMotion = ref(false)
let motionQuery: MediaQueryList | null = null

const animation = computed(() => reduceMotion.value ? 0 : 150)

function updateMotion(event: MediaQueryListEvent | MediaQueryList) {
  reduceMotion.value = event.matches
}

onMounted(() => {
  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  updateMotion(motionQuery)
  motionQuery.addEventListener('change', updateMotion)
})

onBeforeUnmount(() => motionQuery?.removeEventListener('change', updateMotion))

function focusItem(index: number) {
  const row = root.value?.querySelector<HTMLElement>(`[data-form-list-index="${index}"]`)
  row?.querySelector<HTMLElement>('input:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"]):not([disabled])')?.focus()
}

function focusAdd() {
  root.value?.querySelector<HTMLElement>('.ls-form-list__add button:not(:disabled)')?.focus()
}

async function addItem() {
  if (props.disabled) return
  items.value = appendFormListItem(items.value, props.createItem)
  announcement.value = `已添加${props.itemLabel} ${items.value.length}`
  await nextTick()
  focusItem(items.value.length - 1)
}

async function removeItem(index: number) {
  if (props.disabled) return
  const next = removeFormListItem(items.value, index)
  items.value = next
  announcement.value = `已删除${props.itemLabel} ${index + 1}`
  await nextTick()
  if (next.length) focusItem(Math.min(index, next.length - 1))
  else focusAdd()
}

async function moveItem(index: number, target: number, trigger: Event) {
  if (props.disabled || target < 0 || target >= items.value.length) return
  const control = trigger.currentTarget as HTMLElement | null
  items.value = moveFormListItem(items.value, index, target)
  announcement.value = `${props.itemLabel} ${index + 1} 已移动到第 ${target + 1} 项`
  await nextTick()
  control?.focus()
}

function finishDrag(event: DraggableEvent<T>) {
  if (event.oldIndex == null || event.newIndex == null || event.oldIndex === event.newIndex) return
  announcement.value = `${props.itemLabel} ${event.oldIndex + 1} 已移动到第 ${event.newIndex + 1} 项`
}
</script>

<template>
  <div ref="root" class="ls-form-list" :aria-disabled="disabled || undefined">
    <p class="ls-form-list__status" role="status" aria-live="polite">{{ announcement }}</p>
    <p v-if="!items.length" class="ls-form-list__empty">{{ emptyText }}</p>
    <VueDraggable
      v-else
      v-model="items"
      tag="ol"
      class="ls-form-list__items"
      :aria-label="`${itemLabel}列表`"
      :animation="animation"
      :disabled="disabled"
      draggable=".ls-form-list__item"
      handle=".ls-form-list__handle"
      ghost-class="ls-form-list__item--ghost"
      chosen-class="ls-form-list__item--chosen"
      :delay="120"
      :delay-on-touch-only="true"
      :touch-start-threshold="5"
      @end="finishDrag"
    >
      <li
        v-for="(item, index) in items"
        :key="itemKey(item)"
        class="ls-form-list__item"
        :data-form-list-index="index"
      >
        <span class="ls-form-list__handle" :class="{ 'ls-form-list__handle--disabled': disabled }" aria-hidden="true">
          <GripVertical :size="18" />
        </span>
        <strong class="ls-form-list__label">{{ itemLabel }} {{ index + 1 }}</strong>
        <div class="ls-form-list__actions" :aria-label="`${itemLabel} ${index + 1} 操作`">
          <LsButton
            variant="ghost"
            :disabled="disabled || index === 0"
            :disabled-reason="disabled ? disabledReason : '已经是第一项'"
            :aria-label="`上移${itemLabel} ${index + 1}`"
            :title="`上移${itemLabel} ${index + 1}`"
            @click="moveItem(index, index - 1, $event)"
          ><template #icon><ArrowUp :size="18" /></template></LsButton>
          <LsButton
            variant="ghost"
            :disabled="disabled || index === items.length - 1"
            :disabled-reason="disabled ? disabledReason : '已经是最后一项'"
            :aria-label="`下移${itemLabel} ${index + 1}`"
            :title="`下移${itemLabel} ${index + 1}`"
            @click="moveItem(index, index + 1, $event)"
          ><template #icon><ArrowDown :size="18" /></template></LsButton>
          <LsButton
            variant="ghost"
            :disabled="disabled"
            :disabled-reason="disabledReason"
            :aria-label="`删除${itemLabel} ${index + 1}`"
            :title="`删除${itemLabel} ${index + 1}`"
            @click="removeItem(index)"
          ><template #icon><Trash2 :size="18" /></template></LsButton>
        </div>
        <div class="ls-form-list__content">
          <slot name="item" :item="item" :index="index" />
        </div>
      </li>
    </VueDraggable>
    <div class="ls-form-list__add">
      <LsButton type="button" variant="secondary" size="sm" :disabled="disabled" :disabled-reason="disabledReason" @click="addItem">
        <template #icon><Plus :size="17" /></template>{{ addLabel }}
      </LsButton>
    </div>
  </div>
</template>

<style scoped>
.ls-form-list { min-width: 0; display: grid; gap: .75rem; }
.ls-form-list__status { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
.ls-form-list__empty { min-height: 4rem; display: grid; place-items: center; margin: 0; padding: 1rem; color: var(--muted-ink); background: var(--cloud); border: 1px solid var(--line); border-radius: 10px; font-size: .8125rem; }
.ls-form-list__items { min-width: 0; display: grid; margin: 0; padding: 0; overflow: hidden; background: white; border: 1px solid var(--line); border-radius: 12px; list-style: none; }
.ls-form-list__item { min-width: 0; display: grid; grid-template-columns: 2rem minmax(0, 1fr) auto; align-items: start; gap: .625rem .75rem; padding: .75rem; background: white; border-bottom: 1px solid var(--line); transition: background-color var(--motion-fast) var(--ease-standard), opacity var(--motion-fast) var(--ease-standard); }
.ls-form-list__item:last-child { border-bottom: 0; }
.ls-form-list__item--chosen { background: var(--cloud); }
.ls-form-list__item--ghost { opacity: .45; }
.ls-form-list__handle { width: 2rem; min-height: 44px; display: grid; place-items: center; color: var(--muted-ink); cursor: grab; touch-action: none; }
.ls-form-list__handle:active { cursor: grabbing; }
.ls-form-list__handle--disabled { opacity: .45; cursor: default; }
.ls-form-list__content { min-width: 0; grid-column: 2 / -1; display: grid; gap: .625rem; }
.ls-form-list__label { align-self: center; color: var(--muted-ink); font-size: .75rem; font-weight: 650; }
.ls-form-list__actions { grid-column: 3; display: flex; align-items: center; justify-content: flex-end; gap: .125rem; }
.ls-form-list__actions :deep(.ls-button) { width: 44px; height: 44px; }
.ls-form-list__add { justify-self: start; }
.ls-form-list__add :deep(.ls-button) { min-width: 7rem; }
@media (max-width: 639px) {
  .ls-form-list__item { grid-template-columns: 1.75rem minmax(0, 1fr) auto; gap: .625rem; padding: .75rem .625rem; }
  .ls-form-list__handle { width: 1.75rem; }
  .ls-form-list__add { width: 100%; }
  .ls-form-list__add :deep(.ls-button) { width: 100%; }
}
@media (prefers-reduced-motion: reduce) {
  .ls-form-list__item { transition-duration: 1ms; }
}
</style>
