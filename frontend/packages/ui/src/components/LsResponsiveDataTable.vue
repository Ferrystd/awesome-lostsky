<script setup lang="ts" generic="Row extends DataTableRowData">
import { NDataTable } from 'naive-ui'
import type { DataTableColumns, DataTableRowData, DataTableRowKey, DataTableSortState } from 'naive-ui'
import { onBeforeUnmount, onMounted, ref } from 'vue'

defineProps<{
  columns: DataTableColumns<Row>
  data: Row[]
  rowKey: (row: Row) => DataTableRowKey
  scrollX?: number
}>()
const emit = defineEmits<{ 'update:sorter': [state: DataTableSortState | DataTableSortState[] | null] }>()

const isMobile = ref(false)
let mediaQuery: MediaQueryList | undefined
const syncViewport = (event?: MediaQueryListEvent) => { isMobile.value = event?.matches ?? mediaQuery?.matches ?? false }

onMounted(() => {
  mediaQuery = window.matchMedia('(max-width: 719px)')
  syncViewport()
  mediaQuery.addEventListener('change', syncViewport)
})
onBeforeUnmount(() => mediaQuery?.removeEventListener('change', syncViewport))
</script>

<template>
  <section class="ls-responsive-data-table">
    <div v-if="!isMobile" class="ls-responsive-data-table__desktop">
      <NDataTable :columns="columns" :data="data" :row-key="rowKey" :scroll-x="scrollX" @update:sorter="state => emit('update:sorter', state)" />
    </div>
    <div v-else class="ls-responsive-data-table__mobile">
      <article v-for="row in data" :key="rowKey(row)" class="ls-responsive-data-table__record">
        <header>
          <strong><slot name="mobile-title" :row="row" /></strong>
          <slot name="mobile-status" :row="row" />
        </header>
        <slot name="mobile" :row="row" />
      </article>
    </div>
  </section>
</template>

<style scoped>
.ls-responsive-data-table { min-width: 0; }
.ls-responsive-data-table__desktop { min-width: 0; max-width: 100%; overflow: hidden; }
.ls-responsive-data-table__mobile { display: none; overflow: hidden; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); }
.ls-responsive-data-table__record { display: grid; gap: .75rem; padding: 1rem; border-bottom: 1px solid var(--border); }
.ls-responsive-data-table__record:last-child { border-bottom: 0; }
.ls-responsive-data-table__record header { display: flex; align-items: center; justify-content: space-between; gap: .75rem; }
.ls-responsive-data-table__record :deep(dl) { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: .35rem .75rem; margin: 0; font-size: .8125rem; }
.ls-responsive-data-table__record :deep(dt) { color: var(--text-secondary); }
.ls-responsive-data-table__record :deep(dd) { min-width: 0; margin: 0; text-align: right; overflow-wrap: anywhere; }
@media (max-width: 719px) {
  .ls-responsive-data-table__desktop { display: none; }
  .ls-responsive-data-table__mobile { display: grid; }
}
</style>
