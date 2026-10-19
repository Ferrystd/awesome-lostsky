import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const catalog = path.join(root, 'frontend/backoffice-previews')
const output = path.join(root, 'test-results/backoffice-previews')
const apps = ['account', 'chat', 'transaction', 'admin', 'weibo', 'shop']
const manifestPath = path.join(root, 'frontend/backoffice-preview-manifest.json')
const baseline = JSON.parse(await readFile(manifestPath, 'utf8'))
const routes = JSON.parse(await readFile(path.join(catalog, 'routes.json'), 'utf8'))
const normalizeRoute = value => value.replace(/\([^)]*\)/g, '')
const pages = []
const missing = []
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
for (const app of apps) {
  const scenes = JSON.parse(await readFile(path.join(catalog, `${app}.json`), 'utf8'))
  const reportPath = path.join(output, `${app}-report.json`)
  const report = existsSync(reportPath) ? JSON.parse(await readFile(reportPath, 'utf8')) : []
  for (const expected of routes.filter(item => item.app === app && item.kind !== 'redirect')) {
    if (!scenes.some(item => normalizeRoute(item.path) === normalizeRoute(expected.path))) missing.push(`${app}:${expected.path}`)
  }
  for (const scene of scenes) {
    const result = report.find(item => item.routeKey === scene.routeKey)
    const images = result?.screenshots ?? (result?.captures ?? []).map(file => ({ width: file.endsWith('-desktop.png') ? 1440 : 375, path: file }))
    const status = result?.status ?? scene.status
    const complete = ['passed', 'captured'].includes(status) && [1440, 375].every(width => images.some(image => image.width === width && existsSync(image.path)))
    pages.push({ ...scene, title: result?.heading ?? result?.evidence?.geometry?.find(item => item.title)?.title ?? scene.title ?? scene.view, status: complete ? 'previewed' : status === 'failed' ? 'failed' : 'planned', screenshots: images, previewPath: Object.fromEntries(images.map(image => [image.width === 1440 ? 'desktop' : 'mobile', path.relative(root, image.path).replaceAll('\\', '/')])) })
  }
}
const redirects = routes.filter(item => item.kind === 'redirect').map(item => baseline.pages.find(page => page.app === item.app && page.path === item.path && page.template === 'redirect') ?? ({ ...item, routeKey: `${item.app}:${item.path}:redirect`, view: null, variant: 'redirect', template: 'redirect', previewPath: null, status: 'not-applicable', reuseSource: 'current router', specialReason: '路由跳转不渲染独立内容，不作为业务页面截图。' }))
await mkdir(output, { recursive: true })
await writeFile(path.join(output, 'manifest.json'), JSON.stringify({ ...baseline, pages: [...pages, ...redirects], missingRoutes: missing }, null, 2) + '\n')
const markdown = ['# 非 Team 后台页面预览', '', '真实 Vue 构建、模拟 API 数据；不代表生产业务验收。', '']
for (const app of apps) {
  markdown.push(`## ${app}`, '', '| 页面 | 路由 / 变体 | 模板 | 桌面 | 手机 | 状态 |', '| --- | --- | --- | --- | --- | --- |')
  for (const item of pages.filter(p => p.app === app)) {
    const link = width => { const image = item.screenshots.find(s => s.width === width); return image ? `[预览](${path.relative(output, image.path).replaceAll('\\', '/')})` : '未生成' }
    markdown.push(`| ${item.title} | ${item.path} · ${item.variant} | ${item.template} | ${link(1440)} | ${link(375)} | ${item.status} |`)
  }
  markdown.push('')
}
await writeFile(path.join(output, 'index.md'), markdown.join('\n'))
const sections = apps.map(app => `<section><h2>${app}</h2>${pages.filter(p => p.app === app).map(p => `<article><h3>${escape(p.title)}</h3><p><code>${escape(p.path)}</code> · ${escape(p.variant)} · ${escape(p.template)} · ${escape(p.status)}</p><div style="display:flex;gap:16px;align-items:start">${p.status !== 'previewed' ? '<span>等待有效预览</span>' : p.screenshots.map(image => `<a style="display:block;flex:${image.width === 1440 ? 3 : 1};min-width:0" href="${escape(path.relative(output, image.path).replaceAll('\\', '/'))}"><img loading="lazy" style="display:block;width:100%;height:auto" src="${escape(path.relative(output, image.path).replaceAll('\\', '/'))}" alt="${escape(p.title)} ${image.width === 1440 ? '桌面' : '手机'}">${image.width === 1440 ? '桌面' : '手机'}完整预览</a>`).join('')}</div></article>`).join('')}</section>`).join('')
await writeFile(path.join(output, 'index.html'), `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>后台页面预览</title><style>body{font:16px/1.6 system-ui;background:#101619;color:#edf3f3;max-width:1100px;margin:auto;padding:28px}a{color:#6ee7c8}article{padding:18px 0;border-bottom:1px solid #344247}h3{margin:0}p{color:#c0cdce}nav{display:flex;gap:20px;flex-wrap:wrap}</style><h1>非 Team 后台页面预览</h1><p>真实 Vue 构建 · 模拟 API 数据 · ${pages.length} 个页面/状态场景；不代表生产业务验收。Team、商城前台和 Community 不在范围。</p>${missing.length ? `<p>未覆盖路由：${escape(missing.join(', '))}</p>` : ''}${sections}</html>`)
console.log(JSON.stringify({ scenes: pages.length, previewed: pages.filter(p => p.status === 'previewed').length, missingRoutes: missing, index: path.join(output, 'index.html') }))
process.exitCode = missing.length || pages.some(p => p.status !== 'previewed') ? 1 : 0
