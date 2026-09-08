<script setup lang="ts">
import type { Crepe as CrepeInstance } from '@milkdown/crepe'
import type { EntitySearch, EntitySummary, MarkdownImageUpload } from '../markdown'

import { Crepe } from '@milkdown/crepe'
import '@milkdown/crepe/theme/common/style.css'
import '@milkdown/crepe/theme/frame.css'
import { editorViewCtx } from '@milkdown/kit/core'
import { replaceAll } from '@milkdown/kit/utils'
import { Code2, Eye, FileText, Search, Users } from '@lucide/vue'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { feedback } from '../feedback'
import { removeUnresolvedMarkdownImages } from '../markdown'
import LsMarkdownRenderer from './LsMarkdownRenderer.vue'

const props = withDefaults(defineProps<{
  modelValue: string
  placeholder?: string
  draftKey?: string
  searchEntities?: EntitySearch
  resolveEntities?: (slugs: string[]) => Promise<EntitySummary[]>
  uploadImage: MarkdownImageUpload
  uploadDisabledReason?: string
}>(), { placeholder: '开始编写内容，输入 @ 可引用团队或成员…', draftKey: '' })

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const root = ref<HTMLElement | null>(null)
const editorRoot = ref<HTMLElement | null>(null)
const mode = ref<'visual' | 'source' | 'preview'>('visual')
const current = ref(removeUnresolvedMarkdownImages(props.modelValue ?? ''))
const mentionQuery = ref('')
const mentionRange = ref<{ from: number; to: number } | null>(null)
const suggestions = ref<EntitySummary[]>([])
const selectedIndex = ref(0)
const searching = ref(false)
const searchError = ref('')
const uploadError = ref('')
let crepe: CrepeInstance | null = null
let searchTimer: ReturnType<typeof setTimeout> | null = null
let searchVersion = 0

const mentionIcon = `
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" role="img">
    <title>引用团队或成员</title>
    <path d="M12 4a8 8 0 1 0 4.9 14.3l-1.2-1.6A6 6 0 1 1 18 12v1.25a1.75 1.75 0 0 1-3.5 0V8h-2v.55A4 4 0 1 0 14.6 15a3.75 3.75 0 0 0 6.4-2.65V12a9 9 0 0 0-9-8Zm-1.5 10a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z" />
  </svg>
`
const imageUploadIcon = `
  <svg data-lostsky-image-upload xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" role="img">
    <title>插入图片</title>
    <rect width="18" height="18" x="3" y="3" rx="2" fill="none" stroke="currentColor" stroke-width="2" />
    <circle cx="9" cy="9" r="2" fill="none" stroke="currentColor" stroke-width="2" />
    <path d="m21 15-5-5L5 21" fill="none" stroke="currentColor" stroke-width="2" />
  </svg>
`

const showSuggestions = computed(() => Boolean(mentionRange.value))

function update(value: string) {
  const next = removeUnresolvedMarkdownImages(value)
  if (next === current.value && next === props.modelValue) return
  current.value = next
  if (next !== props.modelValue) emit('update:modelValue', next)
  if (props.draftKey) localStorage.setItem(`lostsky:markdown:${props.draftKey}`, next)
}

function closeSuggestions() {
  mentionRange.value = null
  mentionQuery.value = ''
  suggestions.value = []
  selectedIndex.value = 0
  searchError.value = ''
}

function detectMention() {
  if (!crepe || mode.value !== 'visual') return closeSuggestions()
  crepe.editor.action((ctx) => {
    const view = ctx.get(editorViewCtx)
    const selection = view.state.selection
    if (!selection.empty) return closeSuggestions()
    const before = selection.$from.parent.textBetween(0, selection.$from.parentOffset, undefined, '\ufffc')
    const match = before.match(/(?:^|\s)@([a-zA-Z][a-zA-Z0-9_-]{0,49})?$/)
    if (!match) return closeSuggestions()
    const query = (match[1] ?? '').toLowerCase()
    mentionQuery.value = query
    mentionRange.value = { from: selection.from - query.length - 1, to: selection.from }
    if (query.length < 2 || !props.searchEntities) {
      suggestions.value = []
      searching.value = false
      return
    }
    if (searchTimer) clearTimeout(searchTimer)
    const version = ++searchVersion
    searchTimer = setTimeout(async () => {
      searching.value = true
      searchError.value = ''
      try {
        const result = await props.searchEntities!(query)
        if (version !== searchVersion) return
        suggestions.value = result.filter((item) => item.available)
        selectedIndex.value = 0
      } catch {
        if (version === searchVersion) searchError.value = '暂时无法搜索对象'
      } finally {
        if (version === searchVersion) searching.value = false
      }
    }, 220)
  })
}

function insertEntity(item: EntitySummary) {
  if (!crepe || !mentionRange.value || !item.display_name) return
  const range = mentionRange.value
  crepe.editor.action((ctx) => {
    const view = ctx.get(editorViewCtx)
    const link = view.state.schema.marks.link
    if (!link) return
    const text = view.state.schema.text(`@${item.display_name}`, [
      link.create({ href: `lostsky://entity/${item.slug}` }),
    ])
    view.dispatch(view.state.tr.replaceWith(range.from, range.to, text).scrollIntoView())
    view.focus()
  })
  closeSuggestions()
}

function onKeydown(event: KeyboardEvent) {
  if (!showSuggestions.value) return
  if (event.key === 'Escape') {
    event.preventDefault()
    closeSuggestions()
  } else if (event.key === 'ArrowDown' && suggestions.value.length) {
    event.preventDefault()
    selectedIndex.value = (selectedIndex.value + 1) % suggestions.value.length
  } else if (event.key === 'ArrowUp' && suggestions.value.length) {
    event.preventDefault()
    selectedIndex.value = (selectedIndex.value - 1 + suggestions.value.length) % suggestions.value.length
  } else if (event.key === 'Enter' && suggestions.value[selectedIndex.value]) {
    event.preventDefault()
    insertEntity(suggestions.value[selectedIndex.value])
  }
}

function onEditorClick(event: MouseEvent) {
  if (explainDisabledImage(event)) return
  const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="lostsky://entity/"]')
  if (link) event.preventDefault()
}

function explainDisabledImage(event: Event) {
  if (!props.uploadDisabledReason) return false
  const button = (event.target as Element | null)?.closest<HTMLButtonElement>('button')
  if (!button?.querySelector('svg[data-lostsky-image-upload]')) return false
  event.preventDefault()
  event.stopPropagation()
  feedback.info(props.uploadDisabledReason)
  return true
}

function startMention() {
  if (!crepe || mode.value !== 'visual' || !props.searchEntities) return
  closeSuggestions()
  crepe.editor.action((ctx) => {
    const view = ctx.get(editorViewCtx)
    const selection = view.state.selection
    const parentOffset = selection.$from.parentOffset
    const previous = parentOffset > 0
      ? selection.$from.parent.textBetween(parentOffset - 1, parentOffset, undefined, '\ufffc')
      : ''
    const text = previous && !/\s/.test(previous) ? ' @' : '@'
    view.dispatch(view.state.tr.insertText(text, selection.from, selection.to).scrollIntoView())
    view.focus()
    const cursor = view.state.selection.from
    mentionQuery.value = ''
    mentionRange.value = { from: cursor - 1, to: cursor }
  })
}

function setMode(value: 'visual' | 'source' | 'preview') {
  closeSuggestions()
  mode.value = value
  if (value === 'visual') nextTick(() => crepe?.editor.action(replaceAll(current.value)))
}

function clearDraft() {
  if (props.draftKey) localStorage.removeItem(`lostsky:markdown:${props.draftKey}`)
}

async function uploadImage(file: File): Promise<string> {
  uploadError.value = ''
  if (props.uploadDisabledReason) {
    feedback.info(props.uploadDisabledReason)
    throw new Error()
  }
  try {
    return await props.uploadImage(file)
  } catch (error) {
    uploadError.value = error instanceof Error ? error.message : '图片上传失败，请稍后重试'
    throw error
  }
}

function syncUploadControls() {
  if (!root.value) return
  const disabled = Boolean(props.uploadDisabledReason)
  for (const input of root.value.querySelectorAll<HTMLInputElement>('input[type="file"]')) {
    input.disabled = disabled
  }
  for (const button of root.value.querySelectorAll<HTMLButtonElement>('button')) {
    if (!button.textContent?.includes('上传图片')) continue
    button.disabled = disabled
  }
  const imageButton = root.value.querySelector<SVGElement>('svg[data-lostsky-image-upload]')?.closest<HTMLButtonElement>('button')
  if (imageButton) {
    imageButton.disabled = false
    imageButton.setAttribute('aria-label', '插入图片')
    imageButton.title = '插入图片'
    if (disabled) {
      imageButton.setAttribute('aria-disabled', 'true')
    } else {
      imageButton.removeAttribute('aria-disabled')
    }
  }
}

defineExpose({ clearDraft })

watch(() => props.modelValue, (value) => {
  const next = removeUnresolvedMarkdownImages(value ?? '')
  if (next !== value) emit('update:modelValue', next)
  if (next === current.value) return
  current.value = next
  if (crepe && crepe.getMarkdown() !== next) crepe.editor.action(replaceAll(next))
})
watch(() => props.uploadDisabledReason, () => {
  uploadError.value = ''
  void nextTick(syncUploadControls)
})

onMounted(async () => {
  if (current.value !== props.modelValue) emit('update:modelValue', current.value)
  if (props.draftKey) {
    const draft = localStorage.getItem(`lostsky:markdown:${props.draftKey}`)
    if (draft !== null && draft !== current.value) update(draft)
  }
  if (!editorRoot.value) return
  crepe = new Crepe({
    root: editorRoot.value,
    defaultValue: current.value,
    features: {
      [Crepe.Feature.TopBar]: true,
      [Crepe.Feature.AI]: false,
      [Crepe.Feature.ImageBlock]: true,
    },
    featureConfigs: {
      [Crepe.Feature.TopBar]: {
        imageIcon: imageUploadIcon,
        headingOptions: [
          { label: '段落', level: null },
          { label: '标题 1', level: 1 },
          { label: '标题 2', level: 2 },
          { label: '标题 3', level: 3 },
          { label: '标题 4', level: 4 },
          { label: '标题 5', level: 5 },
          { label: '标题 6', level: 6 },
        ],
        buildTopBar: (builder) => {
          const insertGroup = builder.getGroup('insert')
          insertGroup.addItem('mention', {
            icon: mentionIcon,
            active: () => false,
            onRun: () => startMention(),
          })
          const items = insertGroup.group.items
          const mention = items.pop()
          const linkIndex = items.findIndex((item) => item.key === 'link')
          if (mention) items.splice(Math.max(linkIndex, 0), 0, mention)
        },
      },
      [Crepe.Feature.Placeholder]: { text: props.placeholder, mode: 'doc' },
      [Crepe.Feature.ImageBlock]: {
        onUpload: uploadImage,
        inlineUploadButton: '上传图片',
        blockUploadButton: '上传图片',
        inlineUploadPlaceholderText: '或粘贴图片地址',
        blockUploadPlaceholderText: '或粘贴图片地址',
        blockCaptionPlaceholderText: '图片说明',
      },
    },
  })
  crepe.on((listener) => listener.markdownUpdated((_ctx, markdown) => {
    update(markdown)
    detectMention()
  }))
  await crepe.create()
  syncUploadControls()
})

onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer)
  void crepe?.destroy()
  crepe = null
})
</script>

<template>
  <section ref="root" class="ls-markdown-editor" @keydown.capture="onKeydown" @keyup="detectMention" @pointerdown.capture="explainDisabledImage" @click="onEditorClick">
    <div class="mode-tabs" role="tablist" aria-label="Markdown 编辑模式">
      <button type="button" role="tab" :aria-selected="mode === 'visual'" @click="setMode('visual')"><FileText :size="16" />可视化</button>
      <button type="button" role="tab" :aria-selected="mode === 'source'" @click="setMode('source')"><Code2 :size="16" />源码</button>
      <button type="button" role="tab" :aria-selected="mode === 'preview'" @click="setMode('preview')"><Eye :size="16" />预览</button>
    </div>

    <p v-if="uploadError" class="upload-error" role="alert">{{ uploadError }}</p>

    <div v-show="mode === 'visual'" class="visual-pane">
      <div ref="editorRoot" />
      <Transition name="ls-popover">
        <div v-if="showSuggestions" class="entity-picker" role="listbox" aria-label="对象搜索结果">
          <div class="picker-status"><Search :size="15" /><span v-if="mentionQuery.length < 2">继续输入至少 2 个字符</span><span v-else-if="searching">正在搜索 @{{ mentionQuery }}…</span><span v-else-if="searchError">{{ searchError }}</span><span v-else-if="!suggestions.length">没有匹配的可用对象</span><span v-else>选择要引用的对象</span></div>
          <button v-for="(item, index) in suggestions" :key="`${item.type}:${item.slug}`" type="button" role="option" :aria-selected="index === selectedIndex" @mousedown.prevent="insertEntity(item)">
            <span class="entity-icon"><Users :size="17" /></span>
            <span><strong>@{{ item.slug }}</strong><small>{{ item.display_name }} · {{ item.type === 'team' ? '团队' : item.team?.display_name || '成员' }}</small></span>
          </button>
        </div>
      </Transition>
    </div>

    <textarea v-if="mode === 'source'" :value="current" :placeholder="placeholder" aria-label="Markdown 源码" @input="update(($event.target as HTMLTextAreaElement).value)" />
    <LsMarkdownRenderer v-if="mode === 'preview'" :content="current" :resolve-entities="resolveEntities" />
  </section>
</template>

<style scoped>
.ls-markdown-editor{position:relative;min-width:0;background:var(--surface,#fff);border:1px solid var(--line);border-radius:10px;overflow:visible}.mode-tabs{display:flex;gap:.25rem;padding:.4rem;background:var(--cloud);border-bottom:1px solid var(--line);border-radius:10px 10px 0 0}.mode-tabs button{min-height:44px;display:inline-flex;align-items:center;justify-content:center;gap:.4rem;padding:0 .7rem;color:var(--ink);background:transparent;border:0;border-radius:7px;font-size:.8rem;font-weight:650;cursor:pointer;transition:color var(--motion-fast) var(--ease-standard),background-color var(--motion-fast) var(--ease-standard),box-shadow var(--motion-fast) var(--ease-standard)}.mode-tabs button:hover{background:color-mix(in oklch,var(--sky-lost),white 88%)}.mode-tabs button[aria-selected=true]{color:var(--sky-night);background:white;box-shadow:0 1px 2px color-mix(in oklch,var(--sky-night),transparent 90%)}.mode-tabs button:focus-visible,.entity-picker button:focus-visible{outline:3px solid color-mix(in oklch,var(--sky-lost-strong),transparent 65%);outline-offset:1px}.visual-pane{position:relative;min-height:24rem}.ls-markdown-editor textarea{width:100%;min-height:26rem;padding:1rem;resize:vertical;color:var(--ink);background:white;border:0;border-radius:0 0 10px 10px;outline:0;font:500 .9rem/1.7 ui-monospace,SFMono-Regular,Consolas,monospace}.entity-picker{position:absolute;z-index:var(--z-popover,40);left:1rem;right:1rem;top:3.75rem;max-width:34rem;padding:.35rem;background:white;border:1px solid var(--line);border-radius:10px;box-shadow:0 14px 35px color-mix(in oklch,var(--sky-night),transparent 82%);overflow:hidden}.picker-status{min-height:38px;display:flex;align-items:center;gap:.45rem;padding:0 .65rem;color:var(--muted-ink);font-size:.78rem}.entity-picker button{width:100%;min-height:52px;display:flex;align-items:center;gap:.65rem;padding:.55rem .65rem;text-align:left;background:transparent;border:0;border-radius:7px;cursor:pointer;transition:background-color var(--motion-fast) var(--ease-standard)}.entity-picker button[aria-selected=true],.entity-picker button:hover{background:var(--cloud)}.entity-picker strong,.entity-picker small{display:block}.entity-picker strong{color:var(--ink);font-size:.85rem}.entity-picker small{margin-top:.15rem;color:var(--muted-ink);font-size:.74rem}.entity-icon{width:34px;height:34px;display:grid;place-items:center;color:var(--sky-lost-strong);background:color-mix(in oklch,var(--sky-lost),white 80%);border-radius:8px}
.upload-error{margin:0;padding:.65rem .8rem;color:var(--danger);background:color-mix(in oklch,var(--danger),white 94%);border-bottom:1px solid color-mix(in oklch,var(--danger),white 75%);font-size:.8rem}
.ls-markdown-editor :deep(.milkdown){--crepe-color-background:#fff;--crepe-color-surface:var(--cloud);--crepe-color-surface-low:color-mix(in oklch,var(--cloud),white 45%);--crepe-color-primary:var(--sky-lost-strong);--crepe-color-on-background:var(--ink);--crepe-color-on-surface:var(--ink);--crepe-color-on-surface-variant:var(--muted-ink);--crepe-color-outline:var(--line);--crepe-color-hover:var(--cloud);--crepe-color-selected:color-mix(in oklch,var(--sky-lost),white 70%);--crepe-font-default:inherit;--crepe-font-title:inherit;min-height:24rem}.ls-markdown-editor :deep(.milkdown .ProseMirror){min-height:22rem;padding:1rem;line-height:1.75}.ls-markdown-editor :deep(a[href^="lostsky://entity/"]){display:inline-flex;align-items:center;padding:.08rem .38rem;color:var(--sky-lost-strong);background:color-mix(in oklch,var(--sky-lost),white 82%);border:1px solid color-mix(in oklch,var(--sky-lost-strong),transparent 65%);border-radius:999px;text-decoration:none;cursor:default}
.ls-markdown-editor :deep(.milkdown .milkdown-top-bar .top-bar-item:not(:disabled):not([aria-disabled="true"]) svg),.ls-markdown-editor :deep(.milkdown .milkdown-toolbar .toolbar-item:not(:disabled):not([aria-disabled="true"]) svg){color:var(--ink);fill:var(--ink)}.ls-markdown-editor :deep(.milkdown .milkdown-top-bar .top-bar-chevron svg){color:var(--ink);stroke:var(--ink)}.ls-markdown-editor :deep(.milkdown .milkdown-top-bar .top-bar-item.active svg),.ls-markdown-editor :deep(.milkdown .milkdown-toolbar .toolbar-item.active svg){color:var(--sky-lost-strong);fill:var(--sky-lost-strong)}.ls-markdown-editor :deep(.milkdown button:disabled),.ls-markdown-editor :deep(.milkdown button[aria-disabled="true"]){color:var(--muted-ink);cursor:not-allowed;opacity:.42}.ls-markdown-editor :deep(.milkdown button:focus-visible){outline:3px solid color-mix(in oklch,var(--sky-lost-strong),transparent 65%);outline-offset:1px}
@media(max-width:639px){.mode-tabs{overflow:auto}.mode-tabs button{flex:1;white-space:nowrap}.entity-picker{left:.5rem;right:.5rem}.ls-markdown-editor :deep(.milkdown .ProseMirror){padding:.75rem}}
</style>
