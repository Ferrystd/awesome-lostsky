<script setup lang="ts">
export interface MetricGridItem {
  key: string
  label: string
  value: string | number
  hint?: string
}

withDefaults(defineProps<{
  items: MetricGridItem[]
  ariaLabel?: string
}>(), { ariaLabel: '统计摘要' })
</script>

<template>
  <dl :class="['ls-metric-grid', { 'ls-metric-grid--four': items.length === 4 }]" :aria-label="ariaLabel">
    <div v-for="item in items" :key="item.key" class="ls-metric-grid__item">
      <dt>{{ item.label }}</dt>
      <dd class="ls-tabular">{{ item.value }}</dd>
      <small v-if="item.hint">{{ item.hint }}</small>
    </div>
  </dl>
</template>

<style scoped>
.ls-metric-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1px;
  margin: 0;
  overflow: hidden;
  background: var(--border);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}
.ls-metric-grid__item {
  display: grid;
  align-content: start;
  gap: .3rem;
  min-width: 0;
  padding: 1rem;
  background: var(--surface);
}
.ls-metric-grid dt,
.ls-metric-grid small {
  color: var(--text-secondary);
  font-size: .78rem;
}
.ls-metric-grid dd {
  margin: 0;
  overflow-wrap: anywhere;
  color: var(--text);
  font-size: 1.2rem;
  font-weight: 750;
}
.ls-metric-grid small { line-height: 1.45; }
@media (min-width: 1000px) {
  .ls-metric-grid--four { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}
@media (max-width: 799px) {
  .ls-metric-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 479px) {
  .ls-metric-grid { grid-template-columns: minmax(0, 1fr); }
}
</style>
