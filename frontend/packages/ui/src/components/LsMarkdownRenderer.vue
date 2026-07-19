<script setup lang="ts">
import type { EntityResolve, EntitySummary } from '../markdown'

import { ExternalLink, Users } from '@lucide/vue'
import DOMPurify from 'dompurify'
import { marked } from 'marked'
import { computed, ref, watch } from 'vue'

const props = defineProps<{ content?: string | null; resolveEntities?: EntityResolve }>()
const entities = ref<Record<string, EntitySummary>>({})
const selected = ref<EntitySummary | null>(null)
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
    return `<button type="button" class="ls-entity-chip ls-entity-chip--${state}" data-entity-slug="${attr(slug)}" aria-label="${entity?.available ? '查看对象' : '对象不可用'} ${attr(slug)}">${label}</button>`
  }
  return DOMPurify.sanitize(marked.parse(props.content ?? '', { async: false, renderer }) as string, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['data-entity-slug', 'aria-label'],
  })
})

function selectEntity(event: MouseEvent) {
  const button = (event.target as HTMLElement).closest<HTMLElement>('[data-entity-slug]')
  if (!button) return
  const slug = button.dataset.entitySlug ?? ''
  selected.value = entities.value[slug] ?? { slug, type: 'unknown', display_name: slug, available: false }
}
</script>

<template>
  <div class="ls-markdown-renderer">
    <div class="markdown" @click="selectEntity" v-html="html" />
    <aside v-if="selected" class="entity-card" role="status">
      <span class="entity-card__icon"><Users :size="19" /></span>
      <div v-if="selected.available">
        <small>{{ selected.type === 'team' ? '团队' : selected.team?.display_name || '成员' }}</small>
        <strong>{{ selected.display_name || `@${selected.slug}` }}</strong>
        <span>@{{ selected.slug }}</span>
      </div>
      <div v-else><small>对象不可用</small><strong>@{{ selected.slug }}</strong><span>该对象已隐藏、停用或不存在。</span></div>
      <a v-if="selected.available && selected.href" :href="selected.href"><ExternalLink :size="16" />打开详情</a>
      <button type="button" aria-label="关闭对象信息" @click="selected = null">×</button>
    </aside>
  </div>
</template>

<style scoped>
.ls-markdown-renderer{display:grid;gap:.75rem}.markdown{min-width:0;line-height:1.75;overflow-wrap:anywhere}.markdown :deep(img){max-width:100%;height:auto}.markdown :deep(pre){overflow:auto;padding:1rem;color:white;background:var(--sky-void);border-radius:8px}.markdown :deep(blockquote){margin-inline:0;padding:1rem;background:var(--cloud);border:1px solid var(--line);border-radius:8px}.markdown :deep(a){color:var(--sky-lost-strong);text-decoration:underline}.markdown :deep(table){display:block;max-width:100%;overflow:auto;border-collapse:collapse}.markdown :deep(th),.markdown :deep(td){padding:.55rem;border:1px solid var(--line)}.markdown :deep(.ls-entity-chip){display:inline-flex;align-items:center;min-height:28px;padding:.08rem .45rem;color:var(--sky-lost-strong);background:color-mix(in oklch,var(--sky-lost),white 82%);border:1px solid color-mix(in oklch,var(--sky-lost-strong),transparent 62%);border-radius:999px;font:inherit;font-size:.9em;cursor:pointer}.markdown :deep(.ls-entity-chip--unavailable){color:var(--muted-ink);background:var(--cloud);border-style:dashed}.markdown :deep(.ls-entity-chip:focus-visible){outline:3px solid color-mix(in oklch,var(--sky-lost-strong),transparent 60%);outline-offset:2px}.entity-card{display:grid;grid-template-columns:auto minmax(0,1fr) auto auto;align-items:center;gap:.75rem;padding:.75rem;background:var(--cloud);border:1px solid var(--line);border-radius:9px}.entity-card__icon{width:38px;height:38px;display:grid;place-items:center;color:var(--sky-lost-strong);background:white;border-radius:8px}.entity-card small,.entity-card strong,.entity-card span{display:block}.entity-card small,.entity-card span{color:var(--muted-ink);font-size:.75rem}.entity-card a{min-height:40px;display:inline-flex;align-items:center;gap:.35rem;color:var(--sky-lost-strong);font-size:.8rem;font-weight:700}.entity-card>button{width:40px;height:40px;background:transparent;border:0;border-radius:7px;font-size:1.25rem;cursor:pointer}.entity-card>button:hover{background:white}@media(max-width:560px){.entity-card{grid-template-columns:auto minmax(0,1fr) auto}.entity-card a{grid-column:2}.entity-card>button{grid-column:3;grid-row:1}}
</style>
