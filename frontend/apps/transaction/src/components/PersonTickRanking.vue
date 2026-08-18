<script setup lang="ts">
import { computed } from 'vue'

export interface TickRankingRow {
  key: number
  name: string
  value: number
}

const props = defineProps<{
  rows: TickRankingRow[]
  metricLabel: string
  moneyMetric?: boolean
}>()

const maxTicks = 28
const niceUnit = computed(() => {
  const max = Math.max(1, ...props.rows.map(row => row.value))
  if (!props.moneyMetric && max <= maxTicks) return 1
  const target = max / maxTicks
  const power = 10 ** Math.floor(Math.log10(target))
  for (const factor of [1, 2, 5, 10]) {
    const unit = factor * power
    if (max / unit <= maxTicks) return unit
  }
  return power * 10
})
const format = (value: number) => props.moneyMetric ? `¥${value.toFixed(2)}` : Math.round(value).toLocaleString('zh-CN')
const unitLabel = computed(() => props.moneyMetric
  ? `每道刻度 = ${format(niceUnit.value)}，末道按比例显示`
  : `每道刻度 = ${niceUnit.value.toLocaleString('zh-CN')} 笔，末道按比例显示`)
const ticks = (value: number) => Array.from({ length: Math.ceil(value / niceUnit.value) }, (_, index) => ({
  index,
  fraction: Math.min(1, Math.max(0, (value - index * niceUnit.value) / niceUnit.value)),
}))
const tickX = (index: number) => 176 + index * 15
</script>

<template>
  <figure class="tick-ranking" aria-labelledby="tick-ranking-title tick-ranking-description">
    <figcaption>
      <strong id="tick-ranking-title">人员 {{ metricLabel }} Top 8</strong>
      <span id="tick-ranking-description">{{ unitLabel }} · 圆点标记每五道刻度</span>
    </figcaption>
    <svg viewBox="0 0 720 390" role="img" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
      <g v-for="(row, rowIndex) in rows" :key="row.key" :transform="`translate(0 ${44 + rowIndex * 42})`">
        <text x="158" y="2" class="row-name" text-anchor="end">{{ row.name }}</text>
        <line x1="176" x2="596" y1="10" y2="10" class="row-guide" />
        <template v-for="tick in ticks(row.value)" :key="tick.index">
          <line
            :x1="tickX(tick.index)"
            :x2="tickX(tick.index)"
            y1="10"
            :y2="10 - (9 + ((tick.index * 7 + rowIndex * 3) % 6)) * tick.fraction"
            class="value-tick"
          >
            <title>{{ row.name }}：{{ format(row.value) }}</title>
          </line>
          <circle v-if="tick.index % 5 === 4" :cx="tickX(tick.index)" cy="15" r="1.2" class="fifth-marker" />
        </template>
        <text :x="Math.min(674, tickX(ticks(row.value).length) + 7)" y="3" class="row-value">{{ format(row.value) }}</text>
      </g>
      <text x="360" y="376" class="chart-note" text-anchor="middle">{{ unitLabel }}</text>
    </svg>
    <dl class="ls-sr-only">
      <template v-for="row in rows" :key="`row-${row.key}`"><dt>{{ row.name }}</dt><dd>{{ metricLabel }}：{{ format(row.value) }}</dd></template>
    </dl>
  </figure>
</template>

<style scoped>
.tick-ranking { min-width: 0; margin: 0; }
.tick-ranking figcaption { display: grid; gap: .3rem; margin-bottom: .75rem; }
.tick-ranking figcaption strong { color: var(--text); font-size: 1rem; }
.tick-ranking figcaption span { color: var(--text-secondary); font-size: .78rem; }
.tick-ranking svg { display: block; width: 100%; min-height: 290px; }
.row-name { fill: var(--text-secondary); font-size: 12px; font-weight: 700; }
.row-guide { stroke: var(--border); stroke-width: .8; }
.value-tick { stroke: var(--sky-lost-strong); stroke-width: 1.4; vector-effect: non-scaling-stroke; }
.fifth-marker { fill: color-mix(in oklch, var(--text-secondary), transparent 45%); }
.row-value { fill: var(--text); font-size: 13px; font-weight: 750; font-variant-numeric: tabular-nums; }
.chart-note { fill: var(--text-secondary); font-size: 9px; font-weight: 600; letter-spacing: .06em; }
@media (prefers-reduced-motion: no-preference) {
  .value-tick { animation: reveal-tick var(--motion-base) var(--ease-out) both; }
}
@keyframes reveal-tick { from { opacity: 0; } }
@media (max-width: 639px) {
  .tick-ranking svg { min-height: 250px; }
  .row-name { font-size: 20px; }
  .row-value { font-size: 21px; }
  .chart-note { font-size: 14px; letter-spacing: .03em; }
}
</style>
