<script setup lang="ts">
import { computed } from 'vue'

export interface FlowTrendPoint {
  key: string
  label: string
  value: number
}

const props = defineProps<{
  points: FlowTrendPoint[]
  periodLabel: string
}>()

const width = 720
const height = 300
const plot = { left: 36, right: 684, top: 34, bottom: 244 }
const maxValue = computed(() => Math.max(1, ...props.points.map(point => point.value)))
const x = (index: number) => plot.left + (props.points.length <= 1 ? 0 : index * (plot.right - plot.left) / (props.points.length - 1))
const y = (value: number) => plot.bottom - value / maxValue.value * (plot.bottom - plot.top)
const linePath = computed(() => props.points.map((point, index) => `${index ? 'L' : 'M'} ${x(index)} ${y(point.value)}`).join(' '))
const peakIndexes = computed(() => {
  const result: number[] = []
  for (const index of props.points.map((_, index) => index).sort((a, b) => props.points[b]!.value - props.points[a]!.value)) {
    if (result.every(existing => Math.abs(existing - index) >= Math.max(2, Math.floor(props.points.length / 6)))) result.push(index)
    if (result.length === 2) break
  }
  return result
})
const axisIndexes = computed(() => Array.from(new Set([0, Math.floor((props.points.length - 1) / 2), props.points.length - 1])))
const formatMoney = (value: number) => `¥${value.toFixed(2)}`
const isWeekend = (key: string) => {
  const [year, month, day] = key.slice(0, 10).split('-').map(Number)
  const weekday = new Date(year!, month! - 1, day!).getDay()
  return weekday === 0 || weekday === 6
}
</script>

<template>
  <figure class="flow-trend" aria-labelledby="flow-trend-title flow-trend-description">
    <figcaption>
      <strong id="flow-trend-title">实际流水随时间起伏</strong>
      <span id="flow-trend-description">{{ periodLabel }} · 每个点对应一个时间节点 · 空心点表示周末</span>
    </figcaption>
    <svg :viewBox="`0 0 ${width} ${height}`" role="img" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
      <line :x1="plot.left" :x2="plot.right" :y1="plot.bottom" :y2="plot.bottom" class="axis" />
      <line
        v-for="(point, index) in points"
        :key="`floor-${point.key}`"
        :x1="x(index)"
        :x2="x(index)"
        :y1="plot.bottom"
        :y2="plot.bottom - 7"
        class="calendar-tick"
      />
      <path v-if="points.length" :d="linePath" class="trend-line" pathLength="1" />
      <g v-for="(point, index) in points" :key="point.key">
        <circle
          :cx="x(index)"
          :cy="y(point.value)"
          :r="peakIndexes.includes(index) ? 4.5 : 2.4"
          :class="['trend-dot', { 'trend-dot--hollow': isWeekend(point.key) }]"
        >
          <title>{{ point.label }}：{{ formatMoney(point.value) }}</title>
        </circle>
        <text
          v-if="peakIndexes.includes(index) && point.value > 0"
          :x="x(index)"
          :y="Math.max(18, y(point.value) - 12)"
          class="peak-label"
          text-anchor="middle"
        >{{ formatMoney(point.value) }}</text>
      </g>
      <text
        v-for="index in axisIndexes"
        :key="`label-${points[index]?.key}`"
        :x="x(index)"
        :y="plot.bottom + 24"
        class="axis-label"
        :text-anchor="index === 0 ? 'start' : index === points.length - 1 ? 'end' : 'middle'"
      >{{ points[index]?.label }}</text>
      <text x="360" y="289" class="chart-note" text-anchor="middle">每个点对应一个时间节点 · 精确金额见数据表</text>
    </svg>
    <dl class="ls-sr-only">
      <template v-for="point in points" :key="`row-${point.key}`"><dt>{{ point.label }}</dt><dd>{{ formatMoney(point.value) }}</dd></template>
    </dl>
  </figure>
</template>

<style scoped>
.flow-trend { min-width: 0; margin: 0; }
.flow-trend figcaption { display: grid; gap: .3rem; margin-bottom: .75rem; }
.flow-trend figcaption strong { color: var(--text); font-size: 1rem; }
.flow-trend figcaption span { color: var(--text-secondary); font-size: .78rem; }
.flow-trend svg { display: block; width: 100%; min-height: 250px; overflow: visible; }
.axis { stroke: var(--border); stroke-width: 1; }
.calendar-tick { stroke: color-mix(in oklch, var(--text-secondary), transparent 60%); stroke-width: .7; }
.trend-line { fill: none; stroke: var(--sky-lost-strong); stroke-width: 1.35; vector-effect: non-scaling-stroke; }
.trend-dot { fill: var(--sky-lost-strong); stroke: var(--sky-lost-strong); stroke-width: 1; vector-effect: non-scaling-stroke; }
.trend-dot--hollow { fill: var(--surface); }
.peak-label { fill: var(--text); stroke: var(--surface); stroke-width: 4px; paint-order: stroke; font-size: 11px; font-weight: 750; }
.axis-label { fill: var(--text-secondary); font-size: 10px; font-weight: 650; }
.chart-note { fill: var(--text-secondary); font-size: 9px; font-weight: 600; letter-spacing: .08em; }
@media (prefers-reduced-motion: no-preference) {
  .trend-line { stroke-dasharray: 1; stroke-dashoffset: 1; animation: draw-line var(--motion-slow) var(--ease-out) forwards; }
  .trend-dot { animation: reveal-dot var(--motion-base) var(--ease-out) both; }
}
@keyframes draw-line { to { stroke-dashoffset: 0; } }
@keyframes reveal-dot { from { opacity: 0; } }
@media (max-width: 639px) {
  .flow-trend svg { min-height: 210px; }
  .peak-label { font-size: 19px; }
  .axis-label { font-size: 17px; }
  .chart-note { font-size: 14px; letter-spacing: .03em; }
}
</style>
