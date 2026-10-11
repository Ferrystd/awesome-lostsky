<script setup lang="ts">
import { computed, nextTick, ref, useId } from 'vue'
import { NSelect } from 'naive-ui'
import LsField from '@lostsky/ui/components/LsField.vue'

const props = defineProps<{
  items: { key: string; label: string; dirty: boolean }[]
  current: string
  panelId: string
}>()
const emit = defineEmits<{ select: [key: string] }>()
const selectId = `settings-category-${useId()}`
const navigation = ref<HTMLElement | null>(null)
const options = computed(() => props.items.map(item => ({ value: item.key, label: `${item.label}${item.dirty ? ' · 未保存' : ''}` })))

async function navigate(event: KeyboardEvent, index: number) {
  let next = index
  if (event.key === 'ArrowDown') next = (index + 1) % props.items.length
  else if (event.key === 'ArrowUp') next = (index + props.items.length - 1) % props.items.length
  else if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = props.items.length - 1
  else return
  event.preventDefault()
  emit('select', props.items[next].key)
  await nextTick()
  navigation.value?.querySelectorAll('button')[next]?.focus()
}
</script>

<template>
  <div class="settings-navigation">
    <div class="settings-navigation__mobile">
      <LsField label="设置分类" :for-id="selectId">
        <NSelect :id="selectId" aria-label="设置分类" :value="current" :options="options" @update:value="emit('select', $event)" />
      </LsField>
    </div>
    <nav ref="navigation" class="settings-navigation__desktop" aria-label="设置分类">
      <p class="settings-navigation__label">设置分类</p>
      <button
        v-for="(item, index) in items"
        :key="item.key"
        type="button"
        :aria-current="item.key === current ? 'true' : undefined"
        :aria-controls="panelId"
        @click="emit('select', item.key)"
        @keydown="navigate($event, index)"
      >
        <span>{{ item.label }}</span>
        <small v-if="item.dirty">未保存</small>
      </button>
    </nav>
  </div>
</template>

<style scoped>
.settings-navigation { min-width: 0; }
.settings-navigation__desktop { display: none; }
.settings-navigation__label { margin: 0 0 .75rem; padding-inline: .75rem; color: var(--text-secondary); font-size: .8125rem; font-weight: 500; }
.settings-navigation button { width: 100%; min-height: 44px; display: flex; align-items: center; justify-content: space-between; gap: .5rem; padding: .75rem; border: 0; border-radius: var(--radius-md); background: transparent; color: var(--text-secondary); font: inherit; font-size: .875rem; text-align: left; cursor: pointer; }
.settings-navigation button span { min-width: 0; overflow-wrap: anywhere; }
.settings-navigation button small { flex: none; font-size: .75rem; color: var(--text-secondary); }
.settings-navigation button:hover { background: var(--surface); color: var(--text); }
.settings-navigation button[aria-current='true'] { background: color-mix(in srgb, var(--primary) 9%, var(--surface)); color: var(--primary); font-weight: 650; }
.settings-navigation button:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
@container team-settings-center (min-width: 48rem) {
  .settings-navigation__mobile { display: none; }
  .settings-navigation__desktop { display: grid; gap: .25rem; }
}
</style>
