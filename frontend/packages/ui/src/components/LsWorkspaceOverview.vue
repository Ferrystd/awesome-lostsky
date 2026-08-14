<script setup lang="ts">
import { ArrowRight, CheckCircle2, LockKeyhole } from '@lucide/vue'
import type { Component } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import { feedback } from '../feedback'

type LsWorkspaceOverviewAction = {
  key: string
  label: string
  icon: Component
  to?: RouteLocationRaw
  href?: string
  primary?: boolean
}

type LsWorkspaceOverviewEntry = {
  key: string
  label: string
  description: string
  icon: Component
  to?: RouteLocationRaw
  href?: string
  disabled?: boolean
  reason?: string
}

defineProps<{
  eyebrow: string
  title: string
  description: string
  actions: LsWorkspaceOverviewAction[]
  entries: LsWorkspaceOverviewEntry[]
  scopeNotes?: string[]
}>()

function explainDisabled(reason?: string) {
  if (reason?.trim()) feedback.info(reason.trim())
}
</script>

<template>
  <div class="ls-workspace-overview">
    <section class="ls-workspace-overview__hero" aria-labelledby="workspace-overview-title">
      <div class="ls-workspace-overview__intro">
        <p>{{ eyebrow }}</p>
        <h2 id="workspace-overview-title">{{ title }}</h2>
        <span>{{ description }}</span>
      </div>
      <nav class="ls-workspace-overview__actions" aria-label="工作台切换">
        <template v-for="action in actions" :key="action.key">
          <a
            v-if="action.href"
            :href="action.href"
            :class="['ls-workspace-overview__action', action.primary ? 'primary' : 'secondary']"
          ><component :is="action.icon" :size="18" />{{ action.label }}<ArrowRight :size="18" /></a>
          <RouterLink
            v-else-if="action.to"
            :to="action.to"
            :class="['ls-workspace-overview__action', action.primary ? 'primary' : 'secondary']"
          ><component :is="action.icon" :size="18" />{{ action.label }}<ArrowRight :size="18" /></RouterLink>
        </template>
      </nav>
    </section>

    <section class="ls-workspace-overview__entries" aria-label="工作入口">
      <template v-for="entry in entries" :key="entry.key">
        <button
          v-if="entry.disabled"
          type="button"
          class="ls-workspace-overview__entry disabled"
          aria-disabled="true"
          :aria-label="`${entry.label}不可用：${entry.reason || '当前不可用'}`"
          :title="entry.reason"
          @click="explainDisabled(entry.reason)"
        >
          <component :is="entry.icon" :size="21" />
          <div>
            <h3>{{ entry.label }}<span class="ls-workspace-overview__disabled-label"><LockKeyhole :size="13" />不可用</span></h3>
            <p>{{ entry.description }}</p>
          </div>
          <ArrowRight :size="20" />
        </button>
        <a v-else-if="entry.href" class="ls-workspace-overview__entry" :href="entry.href">
          <component :is="entry.icon" :size="21" />
          <div><h3>{{ entry.label }}</h3><p>{{ entry.description }}</p></div>
          <ArrowRight :size="20" />
        </a>
        <RouterLink v-else-if="entry.to" class="ls-workspace-overview__entry" :to="entry.to">
          <component :is="entry.icon" :size="21" />
          <div><h3>{{ entry.label }}</h3><p>{{ entry.description }}</p></div>
          <ArrowRight :size="20" />
        </RouterLink>
      </template>
    </section>

    <section v-if="scopeNotes?.length" class="ls-workspace-overview__scope" aria-labelledby="workspace-scope-title">
      <h3 id="workspace-scope-title">当前范围</h3>
      <ul>
        <li v-for="note in scopeNotes" :key="note"><CheckCircle2 :size="17" />{{ note }}</li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.ls-workspace-overview{display:grid;gap:1rem}.ls-workspace-overview__hero{display:grid;gap:1.25rem;padding:1.25rem;color:white;background:var(--sky-night);border-radius:12px}.ls-workspace-overview__intro p{margin:0;color:var(--sky-lost);font-size:.76rem;font-weight:750}.ls-workspace-overview__intro h2{margin:.35rem 0 0;font-size:clamp(1.55rem,3vw,2rem);line-height:1.2}.ls-workspace-overview__intro span{display:block;max-width:48rem;margin-top:.5rem;color:oklch(.78 .014 210);font-size:.9rem;line-height:1.65}.ls-workspace-overview__actions{display:flex;align-items:start;flex-wrap:wrap;gap:.5rem}.ls-workspace-overview__action{min-height:44px;display:inline-flex;align-items:center;justify-content:center;gap:.5rem;padding:0 .9rem;border-radius:8px;font-weight:700}.ls-workspace-overview__action.primary{color:var(--sky-void);background:var(--afterglow)}.ls-workspace-overview__action.secondary{color:white;background:color-mix(in oklch,var(--sky-night),white 8%);box-shadow:inset 0 0 0 1px color-mix(in oklch,var(--sky-lost),transparent 52%)}.ls-workspace-overview__action:focus-visible,.ls-workspace-overview__entry:focus-visible{outline:3px solid color-mix(in oklch,var(--sky-lost),transparent 65%);outline-offset:2px}.ls-workspace-overview__entries{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,15rem),1fr));gap:.75rem}.ls-workspace-overview__entry{min-width:0;min-height:132px;display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:start;gap:.8rem;padding:1rem;color:var(--ink);background:white;border:1px solid var(--line);border-radius:10px;text-align:left}.ls-workspace-overview__entry:not(.disabled):hover{border-color:var(--sky-lost);background:color-mix(in oklch,white,var(--cloud) 28%)}.ls-workspace-overview__entry>svg{margin-top:.1rem;color:var(--sky-lost-strong)}.ls-workspace-overview__entry>svg:last-child{align-self:center}.ls-workspace-overview__entry h3{display:flex;align-items:center;flex-wrap:wrap;gap:.45rem;margin:0;font-size:1rem}.ls-workspace-overview__entry p{margin:.4rem 0 0;color:var(--muted-ink);font-size:.82rem;line-height:1.55}.ls-workspace-overview__entry.disabled{color:var(--muted-ink);background:color-mix(in oklch,white,var(--cloud) 34%);border-color:color-mix(in oklch,var(--line),transparent 12%);border-style:dashed;cursor:not-allowed}.ls-workspace-overview__entry.disabled>svg{color:var(--muted-ink);opacity:.52}.ls-workspace-overview__entry.disabled h3{color:color-mix(in oklch,var(--ink),white 36%)}.ls-workspace-overview__entry.disabled p{color:color-mix(in oklch,var(--muted-ink),white 16%)}.ls-workspace-overview__disabled-label{display:inline-flex;align-items:center;gap:.25rem;padding:.18rem .4rem;color:var(--muted-ink);background:color-mix(in oklch,var(--line),white 62%);border-radius:5px;font-size:.67rem;font-weight:650;line-height:1.2}.ls-workspace-overview__scope{padding:1rem 1.1rem;background:white;border:1px solid var(--line);border-radius:10px}.ls-workspace-overview__scope h3{margin:0 0 .75rem;font-size:.9rem}.ls-workspace-overview__scope ul{display:grid;gap:.55rem;margin:0;padding:0;list-style:none}.ls-workspace-overview__scope li{display:flex;align-items:start;gap:.55rem;color:var(--muted-ink);font-size:.82rem;line-height:1.55}.ls-workspace-overview__scope li svg{flex:0 0 auto;margin-top:.15rem;color:var(--sky-lost-strong)}
@media(min-width:800px){.ls-workspace-overview__hero{grid-template-columns:minmax(0,1fr) auto;align-items:end;padding:1.75rem}.ls-workspace-overview__actions{justify-content:flex-end}.ls-workspace-overview__entry{min-height:150px;padding:1.25rem}.ls-workspace-overview__scope{padding:1.15rem 1.25rem}.ls-workspace-overview__scope ul{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:639px){.ls-workspace-overview__actions{display:grid}.ls-workspace-overview__action{width:100%}.ls-workspace-overview__entries{grid-template-columns:1fr}.ls-workspace-overview__entry{min-height:0}}
</style>
