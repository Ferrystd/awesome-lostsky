<script setup lang="ts">
import catalogData from '../catalog.json'
import StoryRenderer from './StoryRenderer'
import { storyRegistry } from './story-registry'
import { previewStates, type CatalogEntry, type PreviewState } from './story-types'

const catalog = catalogData as CatalogEntry[]
const params = new URLSearchParams(location.search)
const id = params.get('id') || catalog[0]?.id || ''
const single = params.get('single') === '1'
const singleState = (params.get('state') || 'default') as PreviewState
const entry = catalog.find(item => item.id === id)
const story = entry ? storyRegistry[entry.name] : undefined
const stateLabels: Record<PreviewState, string> = {
  default: '默认', hover: '悬停', focus: '键盘聚焦', active: '激活 / 选中',
  disabled: '禁用 / 只读', loading: '加载中', error: '错误 / 空状态', mobile: '移动端 390px',
}
const singleUrl = (state: PreviewState) => `/?id=${encodeURIComponent(id)}&single=1&state=${state}`
const unsupportedReason = (state: PreviewState) => story?.reason?.[state] || '该组件没有此状态。'
function resizeFrame(event: Event, state: PreviewState) {
  const frame = event.currentTarget as HTMLIFrameElement
  if (state === 'mobile') return
  const resize = () => {
    const height = frame.contentDocument?.documentElement.scrollHeight ?? 250
    frame.style.height = `${Math.max(250, Math.min(520, height + 4))}px`
  }
  resize()
  window.setTimeout(resize, 400)
  window.setTimeout(resize, 1200)
}
</script>

<template>
  <main v-if="entry && story" :class="['preview-sheet', `preview-sheet--${entry.category}`, { 'preview-sheet--single': single }]" :data-preview-id="entry.id">
    <template v-if="single">
      <StoryRenderer :story="story" :state="singleState" />
    </template>
    <template v-else>
      <header class="preview-sheet__header">
        <div><span>{{ entry.category }}</span><h1>{{ entry.name }}</h1></div>
        <code>{{ entry.source }}</code>
      </header>
      <section class="preview-grid">
        <article v-for="state in previewStates" :key="state" :class="['preview-cell', { 'preview-cell--mobile': state === 'mobile', 'preview-cell--wide': state !== 'mobile' && story.desktopWidth }]" :data-state="state">
          <h2>{{ stateLabels[state] }}</h2>
          <div v-if="!story.supported.includes(state)" class="preview-na"><strong>不适用</strong><p>{{ unsupportedReason(state) }}</p></div>
          <iframe v-else :style="state !== 'mobile' && story.desktopWidth ? { width: `${story.desktopWidth}px`, maxWidth: '100%' } : undefined" :title="`${stateLabels[state]}组件预览`" :src="singleUrl(state)" @load="resizeFrame($event, state)" />
        </article>
      </section>
    </template>
  </main>
  <main v-else class="preview-missing"><h1>组件 Story 不存在</h1><p>{{ id }}</p></main>
</template>

<style>
*{box-sizing:border-box}html{background:#edf3f3}body{min-width:320px;margin:0;color:#15252b;background:#edf3f3;font-family:"PingFang SC","Microsoft YaHei",system-ui,sans-serif}.preview-sheet{width:1360px;min-height:100vh;padding:32px;background:#edf3f3;--preview-cell:#fff;--preview-border:#cddad9}.preview-sheet__header{display:flex;align-items:end;justify-content:space-between;gap:24px;padding:0 4px 22px}.preview-sheet__header span{color:#006f66;font-size:12px;font-weight:750;letter-spacing:.08em;text-transform:uppercase}.preview-sheet__header h1{margin:4px 0 0;font-size:28px}.preview-sheet__header code{max-width:58%;overflow-wrap:anywhere;color:#52666c;font-size:12px}.preview-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.preview-cell{min-width:0;min-height:320px;overflow:visible;padding:18px;border:1px solid var(--preview-border);border-radius:12px;background:var(--preview-cell)}.preview-cell>h2{margin:0 0 16px;color:#52666c;font-size:12px;font-weight:700}.preview-na{min-height:250px;display:grid;place-content:center;text-align:center;color:#687a7f}.preview-na strong{font-size:14px}.preview-na p{max-width:30rem;margin:6px 0 0;font-size:12px;line-height:1.5}.preview-cell--mobile{min-height:560px}.preview-cell iframe{width:100%;height:250px;display:block;margin:auto;border:1px solid var(--preview-border);border-radius:10px;background:#fff}.preview-cell--mobile iframe{width:390px;height:490px}.preview-sheet--single{width:100%;min-height:100vh;display:grid;align-content:start;padding:16px;background:var(--preview-cell)}.preview-missing{padding:48px}.preview-sheet--display{color:oklch(.97 .008 210);background:oklch(.105 .018 225);--preview-cell:oklch(.155 .026 218);--preview-border:oklch(.36 .035 218)}.preview-sheet--display .preview-sheet__header span,.preview-sheet--display .preview-sheet__header code,.preview-sheet--display .preview-cell>h2,.preview-sheet--display .preview-na{color:oklch(.75 .025 215)}.preview-sheet--display .preview-cell iframe{background:oklch(.105 .018 225)}
@media(max-width:600px){body{background:var(--preview-cell)}.preview-sheet--single{padding:12px}}
@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}
.story-stage{min-width:0;display:grid;align-content:start;gap:12px;padding:8px}.story-inline{display:flex;align-items:center;flex-wrap:wrap;gap:8px}.story-form{max-width:440px}.story-stage--editor,.story-stage--profile{padding:0}.story-stage--markdown{max-width:760px}.shell-content{min-height:180px;padding:24px}.shell-content h2,.shell-content p{margin:0}.shell-content p{margin-top:8px;color:var(--text-secondary)}.preview-sheet--single.preview-sheet--display{--surface:oklch(.17 .025 220);--ink:oklch(.97 .008 210);--muted-ink:oklch(.75 .025 215);--line:oklch(.36 .035 218);--sky-lost:oklch(.68 .12 190);--sky-lost-strong:oklch(.78 .13 190)}
</style>
<style>.preview-cell--wide { grid-column: 1 / -1; }</style>
