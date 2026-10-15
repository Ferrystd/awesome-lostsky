<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowUpRight } from '@lucide/vue'
import { actorLabel, formatAuditTime, type AuditEventSummary } from '../lib/audit'

const props = defineProps<{ events: AuditEventSummary[] }>()
const stream = ref<HTMLElement>()
const stuckDays = ref(new Set<number>())
const dateFormat = new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium' })
const timeFormat = new Intl.DateTimeFormat('zh-CN', { timeStyle: 'medium' })
const groups = computed(() => {
  const result: { key: number; date: string; events: AuditEventSummary[] }[] = []
  // Group adjacent records on this page only; never sort or combine server pages.
  for (const event of props.events) {
    const date = dateFormat.format(event.create_time * 1000)
    const previous = result[result.length - 1]
    if (previous?.date === date) previous.events.push(event)
    else result.push({ key: event.id, date, events: [event] })
  }
  return result
})

watch([stream, groups], ([element], _previous, onCleanup) => {
  stuckDays.value = new Set()
  if (!element) return
  const anchors = [...element.querySelectorAll<HTMLElement>('.audit-event-stream__anchor')]
  const observer = new IntersectionObserver(() => {
    const next = new Set<number>()
    for (const anchor of anchors) {
      if (anchor.getBoundingClientRect().top < 0) next.add(Number(anchor.dataset.dayKey))
    }
    stuckDays.value = next
  })
  anchors.forEach(anchor => observer.observe(anchor))
  // A direct jump can skip an anchor entirely; the sticky heading still enters the viewport.
  element.querySelectorAll('.audit-event-stream__date').forEach(heading => observer.observe(heading))
  onCleanup(() => observer.disconnect())
}, { flush: 'post' })
</script>

<template>
  <div ref="stream" class="audit-event-stream" aria-label="审计事件">
    <section v-for="group in groups" :key="group.key" class="audit-event-stream__day" :aria-label="group.date">
      <span class="audit-event-stream__anchor" :data-day-key="group.key" aria-hidden="true" />
      <h2 class="audit-event-stream__date" :class="{ 'audit-event-stream__date--stuck': stuckDays.has(group.key) }">{{ group.date }}</h2>
      <ol class="audit-event-stream__events">
        <li v-for="event in group.events" :key="event.id" class="audit-event-stream__event">
          <RouterLink :to="`/audit/${event.id}`" class="audit-event-stream__link">
            <div class="audit-event-stream__content">
              <h3 class="audit-event-stream__heading">
                <span class="audit-event-stream__action">{{ event.action_label }}</span>
                <span class="audit-event-stream__target">{{ event.resource_label }}{{ event.resource_id ? ` #${event.resource_id}` : '' }}</span>
              </h3>
              <div class="audit-event-stream__metadata">
                <span>{{ actorLabel(event.actor) }}</span>
                <time :datetime="new Date(event.create_time * 1000).toISOString()" :title="formatAuditTime(event.create_time)">{{ timeFormat.format(event.create_time * 1000) }}</time>
                <span class="audit-event-stream__application">应用 · {{ event.application_label }}</span>
              </div>
            </div>
            <span class="audit-event-stream__detail"><ArrowUpRight :size="16" aria-hidden="true" />查看详情</span>
          </RouterLink>
        </li>
      </ol>
    </section>
  </div>
</template>

<style scoped>
.audit-event-stream { min-width: 0; display: grid; gap: 1.5rem; container: audit-event-stream / inline-size; }
.audit-event-stream__day { position: relative; min-width: 0; }
.audit-event-stream__anchor { position: absolute; top: 0; left: 0; width: 1px; height: 1px; pointer-events: none; }
.audit-event-stream__date { position: sticky; top: 0; z-index: 1; width: fit-content; max-width: 100%; margin: 0 0 .5rem -.5rem; padding: .25rem .5rem; border-radius: var(--radius-sm); color: var(--text-secondary); font-size: .8125rem; font-weight: 500; line-height: 1.5; }
.audit-event-stream__date--stuck { background: var(--cloud); }
.audit-event-stream__events { margin: 0; padding: 0; list-style: none; }
.audit-event-stream__event { min-width: 0; border-bottom: 1px solid var(--border); }
.audit-event-stream__event:first-child { border-top: 1px solid var(--border); }
.audit-event-stream__link { min-width: 0; min-height: 44px; display: flex; align-items: center; gap: 1rem; padding: .875rem 0; scroll-margin-top: calc(.8125rem * 1.5 + .5rem + 3px); color: var(--text); text-decoration: none; }
.audit-event-stream__link:hover { background: var(--notice-row-hover, var(--surface-subtle)); }
.audit-event-stream__link:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; border-radius: var(--radius-sm); }
.audit-event-stream__content { flex: 1; min-width: 0; }
.audit-event-stream__heading { display: flex; flex-wrap: wrap; align-items: baseline; gap: .25rem .75rem; margin: 0; font-size: .9375rem; line-height: 1.5; }
.audit-event-stream__action { min-width: 0; font-weight: 600; overflow-wrap: anywhere; }
.audit-event-stream__target { min-width: 0; font-weight: 400; overflow-wrap: anywhere; }
.audit-event-stream__metadata { display: flex; flex-wrap: wrap; gap: .25rem .75rem; margin-top: .375rem; color: var(--text-secondary); font-size: .8125rem; line-height: 1.5; }
.audit-event-stream__metadata > * { min-width: 0; overflow-wrap: anywhere; }
.audit-event-stream__metadata time { font-variant-numeric: tabular-nums; }
.audit-event-stream__application { margin-left: auto; }
.audit-event-stream__detail { flex: none; display: inline-flex; align-items: center; gap: .5rem; color: var(--text-secondary); font-size: .875rem; }
.audit-event-stream__link:hover .audit-event-stream__detail { color: var(--primary); }
@container audit-event-stream (max-width: 32rem) {
  .audit-event-stream__link { flex-wrap: wrap; gap: .5rem; }
  .audit-event-stream__content { flex-basis: 100%; }
  .audit-event-stream__application { margin-left: 0; }
}
</style>
