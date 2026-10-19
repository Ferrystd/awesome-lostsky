<script setup lang="ts">
import { computed, nextTick, ref, useId } from 'vue'
import { NSelect } from 'naive-ui'
import LsField from '@lostsky/ui/components/LsField.vue'
import { useRouter } from 'vue-router'
import LsCategoryNavigationItem from '@lostsky/ui/components/LsCategoryNavigationItem.vue'

const props = defineProps<{
  items: { key: string; label: string; dirty?: boolean; to?: string }[]
  current: string
  panelId: string
  label: string
}>()
const emit = defineEmits<{ select: [key: string] }>()
const selectId = `settings-category-${useId()}`
const navigation = ref<HTMLElement | null>(null)
const router = useRouter()
const options = computed(() => props.items.map(item => ({ value: item.key, label: `${item.label}${item.dirty ? ' · 未保存' : ''}` })))

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
function select(key: string) {
  const item = props.items.find(item => item.key === key)
  if (item?.to) void router.push(item.to)
  else emit('select', key)
}
</script>

<template>
  <div class="team-category-navigation">
    <div class="team-category-navigation__mobile">
      <LsField :label="label" :for-id="selectId">
        <NSelect :id="selectId" :aria-label="label" :value="current" :options="options" @update:value="select" />
      </LsField>
    </div>
    <nav ref="navigation" class="team-category-navigation__desktop" :aria-label="label">
      <p class="team-category-navigation__label">{{ label }}</p>
      <LsCategoryNavigationItem v-for="(item, index) in items" :key="item.key" :label="item.label" :to="item.to" :current="item.key === current" :dirty="item.dirty" :panel-id="panelId" @select="emit('select', item.key)" @keydown="navigate($event, index)" />
    </nav>
  </div>
</template>

<style scoped>
.team-category-navigation { min-width: 0; padding: .75rem 0; }
.team-category-navigation__desktop { display: none; }
.team-category-navigation__label { margin: 0 0 .75rem; padding-inline: .75rem; color: var(--text-secondary); font-size: .8125rem; font-weight: 500; }
@container team-category-layout (min-width: 48rem) {
  .team-category-navigation__mobile { display: none; }
  .team-category-navigation__desktop { display: grid; gap: .25rem; }
}
</style>
