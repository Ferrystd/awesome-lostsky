<script setup lang="ts">
import type { EntityResolve, EntitySummary } from '../markdown'

import { Users } from '@lucide/vue'
import DOMPurify from 'dompurify'
import { marked } from 'marked'
import { NButton } from 'naive-ui'
import { computed, nextTick, ref, useId, watch } from 'vue'
import { entityTypeTone } from '../entity'
import LsEntityCard from './LsEntityCard.vue'

const props = withDefaults(defineProps<{
  content?: string | null
  resolveEntities?: EntityResolve
  chatEnabled?: boolean
  context?: 'inline' | 'document'
}>(), { chatEnabled: true, context: 'inline' })
const entities = ref<Record<string, EntitySummary>>({})
const selected = ref<EntitySummary | null>(null)
const markdownRoot = ref<HTMLElement | null>(null)
const selectedTrigger = ref<HTMLButtonElement | null>(null)
const detailsId = `ls-entity-details-${useId().replaceAll(':', '')}`
let resolveVersion = 0

const slugs = computed(() => {
  const result: string[] = []
  const pattern = /\]\(lostsky:\/\/entity\/([a-zA-Z][a-zA-Z0-9_-]{1,49})\)/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(props.content ?? ''))) result.push(match[1].toLowerCase())
  return [...new Set(result)]
})

watch(slugs, async (value) => {
  const version = ++resolveVersion
  selected.value = null
  selectedTrigger.value = null
  if (!value.length || !props.resolveEntities) {
    entities.value = {}
    return
  }
  try {
    const result = await props.resolveEntities(value)
    if (version !== resolveVersion) return
    entities.value = Object.fromEntries(result.map((item) => [item.slug, item]))
  } catch {
    if (version === resolveVersion) entities.value = {}
  }
}, { immediate: true })

function attr(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!)
}

const html = computed(() => {
  const renderer = new marked.Renderer()
  const defaultLink = renderer.link.bind(renderer)
  renderer.link = function (token) {
    const match = token.href.match(/^lostsky:\/\/entity\/([a-zA-Z][a-zA-Z0-9_-]{1,49})$/)
    if (!match) return defaultLink(token)
    const slug = match[1].toLowerCase()
    const entity = entities.value[slug]
    const fallback = this.parser.parseInline(token.tokens)
    const label = entity?.available && entity.display_name ? `@${attr(entity.display_name)}` : fallback
    const state = entity?.available ? 'available' : 'unavailable'
    const tone = entity?.available ? entityTypeTone(entity.type) : 'unknown'
    return `<button type="button" class="ls-entity-chip ls-entity-chip--${state}" data-entity-slug="${attr(slug)}" data-entity-tone="${tone}" aria-label="${entity?.available ? '查看对象' : '对象不可用'} ${attr(slug)}" aria-expanded="false" aria-controls="${detailsId}">${label}</button>`
  }
  return DOMPurify.sanitize(marked.parse(props.content ?? '', { async: false, renderer }) as string, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['data-entity-slug', 'data-entity-tone', 'aria-label', 'aria-expanded', 'aria-controls'],
  })
})

function selectEntity(event: MouseEvent) {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-entity-slug]')
  if (!button) return
  const slug = button.dataset.entitySlug ?? ''
  const shouldOpen = selected.value?.slug !== slug
  markdownRoot.value?.querySelectorAll<HTMLButtonElement>('[data-entity-slug]').forEach((chip) => {
    chip.setAttribute('aria-expanded', String(shouldOpen && chip.dataset.entitySlug === slug))
  })
  selected.value = shouldOpen
    ? entities.value[slug] ?? { slug, type: 'unknown', display_name: slug, available: false }
    : null
  selectedTrigger.value = shouldOpen ? button : null
}

async function closeSelected() {
  const trigger = selectedTrigger.value
  markdownRoot.value?.querySelectorAll<HTMLButtonElement>('[data-entity-slug]').forEach((chip) => {
    chip.setAttribute('aria-expanded', 'false')
  })
  selected.value = null
  selectedTrigger.value = null
  await nextTick()
  if (trigger?.isConnected) trigger.focus()
}

function openProfile() {
  if (selected.value?.href) window.location.href = selected.value.href
}

function startChat() {
  if (props.chatEnabled && selected.value?.available) {
    window.location.href = `/new?participant=${encodeURIComponent(selected.value.slug)}`
  }
}
</script>

<template>
  <div :class="['ls-markdown-renderer', `ls-markdown-renderer--${context}`]">
    <div ref="markdownRoot" class="markdown" @click="selectEntity" v-html="html" />
    <LsEntityCard
      v-if="selected && selected.available"
      :id="detailsId"
      :entity="{ slug: selected.slug, type: selected.type, name: selected.display_name || `@${selected.slug}`, avatar: selected.avatar }"
      clearable
      :clear-label="`收起 ${selected.display_name || selected.slug} 的对象信息`"
      :chat-enabled="chatEnabled"
      :profile-enabled="Boolean(selected.href)"
      @chat="startChat"
      @clear="closeSelected"
      @profile="openProfile"
    />
    <aside v-else-if="selected" :id="detailsId" class="unavailable-card" role="status"><Users :size="19" /><span>对象不可用 · @{{ selected.slug }}</span><NButton quaternary circle aria-label="关闭对象信息" @click="closeSelected">×</NButton></aside>
  </div>
</template>

<style scoped>
.ls-markdown-renderer{display:grid;gap:.75rem}
.ls-markdown-renderer--document{--markdown-h1-size:2rem;--markdown-h2-size:1.55rem;--markdown-h3-size:1.25rem;--markdown-h4-size:1.05rem;--markdown-body-size:1rem;--markdown-line-height:1.85}
.markdown{min-width:0;color:inherit;font-size:var(--markdown-body-size,1rem);line-height:var(--markdown-line-height,1.8);overflow-wrap:anywhere}
.markdown :deep(> :first-child){margin-top:0}
.markdown :deep(> :last-child){margin-bottom:0}
.markdown :deep(p),.markdown :deep(ul),.markdown :deep(ol),.markdown :deep(blockquote),.markdown :deep(pre),.markdown :deep(table){margin-block:1.25em}
.markdown :deep(p){text-wrap:pretty}
.markdown :deep(h1),.markdown :deep(h2),.markdown :deep(h3),.markdown :deep(h4){margin:2em 0 .7em;color:var(--ink);font-family:"PingFang SC","Microsoft YaHei",system-ui,sans-serif;font-weight:700;line-height:1.22;letter-spacing:-.025em;text-wrap:balance;scroll-margin-top:6rem}
.markdown :deep(h1){font-size:var(--markdown-h1-size,2.4rem)}
.markdown :deep(h2){font-size:var(--markdown-h2-size,1.9rem)}
.markdown :deep(h3){font-size:var(--markdown-h3-size,1.45rem)}
.markdown :deep(h4){font-size:var(--markdown-h4-size,1.15rem)}
.markdown :deep(ul),.markdown :deep(ol){padding-left:1.45em}
.markdown :deep(ul){list-style:disc}
.markdown :deep(ol){list-style:decimal}
.markdown :deep(li){padding-left:.3em}
.markdown :deep(li+li){margin-top:.45em}
.markdown :deep(li::marker){color:var(--sky-lost-strong);font-weight:700}
.markdown :deep(li:has(> input[type="checkbox"])){padding-left:0;list-style:none}
.markdown :deep(li>ul),.markdown :deep(li>ol){margin-block:.55em}
.markdown :deep(strong){color:var(--ink);font-weight:700}
.markdown :deep(a){color:var(--sky-lost-strong);text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:.22em}
.markdown :deep(a:hover){color:var(--ink)}
.markdown :deep(img){max-width:100%;height:auto;margin:2rem auto;border-radius:12px}
.markdown :deep(code){padding:.12em .38em;border-radius:5px;color:oklch(.88 .11 190);background:color-mix(in oklch,var(--sky-lost),transparent 86%);font:500 .88em/1.6 ui-monospace,SFMono-Regular,Consolas,monospace}
.markdown :deep(pre){overflow:auto;padding:1.15rem 1.25rem;color:oklch(.93 .012 210);background:oklch(.075 .018 225);border:1px solid color-mix(in oklch,var(--line),transparent 28%);border-radius:10px;tab-size:2}
.markdown :deep(pre code){padding:0;color:inherit;background:transparent;font-size:.88rem}
.markdown :deep(blockquote){margin-inline:0;padding:1rem 1.15rem;color:color-mix(in oklch,var(--ink),transparent 12%);background:color-mix(in oklch,var(--cloud),transparent 38%);border:1px solid var(--line);border-radius:10px}
.markdown :deep(blockquote> :first-child){margin-top:0}
.markdown :deep(blockquote> :last-child){margin-bottom:0}
.markdown :deep(table){display:block;max-width:100%;overflow:auto;border-collapse:collapse;font-size:.92em}
.markdown :deep(th),.markdown :deep(td){min-width:8rem;padding:.7rem .8rem;border:1px solid var(--line);text-align:left}
.markdown :deep(th){color:var(--ink);background:color-mix(in oklch,var(--cloud),transparent 20%);font-weight:700}
.markdown :deep(hr){height:1px;margin:2.5rem 0;border:0;background:var(--line)}
.markdown :deep(input[type="checkbox"]){width:1rem;height:1rem;margin:0 .5rem 0 0;accent-color:var(--sky-lost-strong)}
.markdown :deep(.ls-entity-chip){display:inline-flex;align-items:center;min-height:28px;padding:.08rem .45rem;color:var(--entity-accent);background:color-mix(in oklch,var(--entity-accent),transparent 88%);border:1px solid color-mix(in oklch,var(--entity-accent),transparent 58%);border-radius:999px;font:inherit;font-size:.9em;cursor:pointer;transition:color var(--motion-fast) var(--ease-standard),background-color var(--motion-fast) var(--ease-standard),border-color var(--motion-fast) var(--ease-standard)}
.markdown :deep(.ls-entity-chip[aria-expanded="true"]){color:var(--ink);background:color-mix(in oklch,var(--entity-accent),transparent 78%);border-color:var(--entity-accent)}
.markdown :deep(.ls-entity-chip--unavailable),.markdown :deep(.ls-entity-chip--unavailable[aria-expanded="true"]){color:var(--muted-ink);background:var(--cloud);border-color:var(--line);border-style:dashed}
.markdown :deep(.ls-entity-chip:focus-visible){outline:3px solid color-mix(in oklch,var(--entity-accent),transparent 55%);outline-offset:2px}
.unavailable-card{display:flex;align-items:center;gap:.65rem;padding:.75rem;color:var(--muted-ink);background:var(--cloud);border:1px solid var(--line);border-radius:9px}
.unavailable-card button{margin-left:auto;width:40px;height:40px;background:transparent;border:0;border-radius:7px;font-size:1.25rem;cursor:pointer}
.unavailable-card button:focus-visible{outline:3px solid color-mix(in oklch,var(--sky-lost-strong),transparent 60%);outline-offset:2px}
@media(max-width:480px){.markdown{--markdown-h1-size:2rem;--markdown-h2-size:1.65rem;--markdown-h3-size:1.3rem}.markdown :deep(pre){padding:1rem}.markdown :deep(th),.markdown :deep(td){min-width:7rem;padding:.6rem}}
@media(prefers-reduced-motion:reduce){.markdown :deep(.ls-entity-chip){transition:none}}
</style>
